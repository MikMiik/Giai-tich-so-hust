import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  extractBesselSubarray,
  factorial,
  logCentralDifferenceTable,
} from "./central-difference";

// Định dạng hạng tử đa thức chuẩn dấu
function fmtTerm(coeff: number, varPart: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-14) return "";
  const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
  return `${sign}${fmtNum(Math.abs(coeff))}${varPart}`;
}

export function runBesselInterpolation(
  params: Record<string, string>,
  logger: Logger,
): void {
  const subarray = extractBesselSubarray(params, logger);
  if (!subarray) return;

  const { X_full, Y_full, X_sub, Y_sub, k, initialK, m, x0, x1, h, xStar } = subarray;

  // ── 1. Dữ liệu đầu vào toàn bộ ──────────────────────────
  logger.section("DỮ LIỆU ĐẦU VÀO TOÀN BỘ");
  logger.info(
    `Tổng số mốc dữ liệu: $N_{full} = ${X_full.length}$, bước lưới $h = ${fmtNum(h)}$. ` +
    `Điểm cần tính: $x^* = ${fmtNum(xStar)}$. Số mốc cần lấy: $N_{mốc} = ${2 * m}$ ($m = ${m}$, bậc $n = ${2 * m - 1}$).`,
  );

  const fullTable = X_full.map((x, i) => ({
    "Chỉ số": `$${i}$`,
    "$x_i$": `$${fmtNum(x)}$`,
    "$y_i$": `$${fmtNum(Y_full[i])}$`,
  }));
  logger.table(fullTable);
  logger.separator();

  // ── 2. Xác định khoảng trung tâm và trích xuất mảng con ──
  logger.section("XÁC ĐỊNH KHOẢNG TRUNG TÂM VÀ TRÍCH XUẤT MẢNG CON");
  logger.formula(
    `$$X_{full}[${initialK}] \\le x^* = ${fmtNum(xStar)} < X_{full}[${initialK + 1}] \\implies k_{\\text{khoảng}} = ${initialK}$$`,
  );
  logger.formula(
    `$$k = \\max(m - 1, \\; \\min(N - m, \\; k)) = \\max(${m - 1}, \\; \\min(${X_full.length - 1 - m}, \\; ${initialK})) = ${k}$$`,
  );
  logger.formula(
    `$$\\text{Khoảng trung tâm: } [x_0, x_1] = [X_{full}[${k}], \\; X_{full}[${k + 1}]] = [${fmtNum(x0)}, \\; ${fmtNum(x1)}]$$`,
  );
  logger.info(
    `Trích xuất $2m = ${2 * m}$ mốc đối xứng quanh khoảng $[x_0, x_1]$: ` +
    `chỉ số gốc từ $k - m + 1 = ${k - m + 1}$ đến $k + m = ${k + m}$.`,
  );

  // Mốc x0 ứng với index m - 1 trong mảng con X_sub
  const subCenterLeft = m - 1;
  const subTable = X_sub.map((x, i) => {
    const centeredIndex = i - subCenterLeft; // -(m-1)..m
    const originalIndex = k - m + 1 + i;
    const isCenterPair = centeredIndex === 0 || centeredIndex === 1;
    return {
      "Chỉ số quy chuẩn $i$": isCenterPair ? `**$${centeredIndex}$ (tâm)**` : `$${centeredIndex}$`,
      "Chỉ số gốc": `$${originalIndex}$`,
      "$x_i$": isCenterPair ? `**$${fmtNum(x)}$**` : `$${fmtNum(x)}$`,
      "$y_i$": isCenterPair ? `**$${fmtNum(Y_sub[i])}$**` : `$${fmtNum(Y_sub[i])}$`,
    };
  });
  logger.table(subTable);
  logger.separator();

  // ── 3. Đổi biến số chuẩn hóa ─────────────────────────────
  logger.section("ĐỔI BIẾN SỐ CHUẨN HÓA");
  const t = (xStar - x0) / h;
  const u = t - 0.5;
  logger.formula(`$$t = \\frac{x^* - x_0}{h} = \\frac{${fmtNum(xStar)} - ${fmtNum(x0)}}{${fmtNum(h)}} = ${fmtNum(t)}$$`);
  logger.formula(`$$u = t - \\frac{1}{2} = ${fmtNum(t)} - 0.5 = ${fmtNum(u)}$$`);
  if (Math.abs(u) > 0.5) {
    logger.warn("Chú ý: Bessel cho kết quả chính xác nhất khi $x^*$ nằm gần trung điểm của hai mốc trung tâm ($|u| \\le 0.5$).");
  }
  logger.separator();

  // ── 4. Bảng sai phân hữu hạn ────────────────────────────
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  const delta = buildForwardDifferenceTable(Y_sub);
  logCentralDifferenceTable(logger, X_sub, Y_sub, delta, subCenterLeft);
  logger.separator();

  // ── 5. Hệ số Bessel (Tách Chẵn - Lẻ) ─────────────────────
  logger.section("HỆ SỐ BESSEL (Tách Chẵn - Lẻ)");
  logger.formula(
    "$$C_{\\text{chẵn}}[0] = \\frac{\\Delta_{0,0} + \\Delta_{1,0}}{2}, \\qquad C_{\\text{chẵn}}[i] = \\frac{\\Delta_{-i, 2i} + \\Delta_{-i+1, 2i}}{2 \\cdot (2i)!} \\quad (i=1,\\dots,m-1)$$",
  );
  logger.formula(
    "$$C_{\\text{lẻ}}[i] = \\frac{\\Delta_{-i, 2i+1}}{(2i+1)!} \\quad (i=0,\\dots,m-1)$$",
  );

  const even: number[] = [(Y_sub[subCenterLeft] + Y_sub[subCenterLeft + 1]) / 2];
  const odd: number[] = [delta[subCenterLeft][1]]; // Delta_{0, 1} / 1!

  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$\\frac{y_0 + y_1}{2}, \\quad \\Delta_{0, 1}$",
    "$C_{\\text{chẵn}}[i]$": `$${fmtNum(even[0])}$`,
    "$C_{\\text{lẻ}}[i]$": `$${fmtNum(odd[0])}$`,
  }];

  for (let i = 1; i < m; i++) {
    const rowMinusI = subCenterLeft - i;
    const rowMinusIPlus1 = subCenterLeft - i + 1;

    const evenValue = (delta[rowMinusI][2 * i] + delta[rowMinusIPlus1][2 * i]) / (2 * factorial(2 * i));
    const oddValue = delta[rowMinusI][2 * i + 1] / factorial(2 * i + 1);

    even.push(evenValue);
    odd.push(oddValue);

    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\frac{\\Delta_{${-i}, ${2 * i}} + \\Delta_{${1 - i}, ${2 * i}}}{2}, \\quad \\Delta_{${-i}, ${2 * i + 1}}$`,
      "$C_{\\text{chẵn}}[i]$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ}}[i]$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);
  logger.separator();

  // ── 6. Tính tích lũy hai thành phần và đạo hàm ──────────
  let evenValue = even[0];
  let oddValue = odd[0] * u;
  let evenDerivative = 0;
  let oddDerivative = odd[0];
  let base = 1;
  let baseDerivative = 0;

  const evenTerms: string[] = [fmtNum(even[0])];
  const oddTerms: string[] = [fmtTerm(odd[0], "u", true) || "0"];

  for (let i = 1; i < m; i++) {
    const shift = (2 * i - 1) / 2;
    const factor = u * u - shift * shift;
    const factorDerivative = 2 * u;
    baseDerivative = baseDerivative * factor + base * factorDerivative;
    base *= factor;

    evenValue += even[i] * base;
    oddValue += odd[i] * base * u;
    evenDerivative += even[i] * baseDerivative;
    oddDerivative += odd[i] * (baseDerivative * u + base);

    const baseLabel = Array.from({ length: i }, (_, idx) =>
      `\\left(u^2-\\frac{${(2 * idx + 1) ** 2}}{4}\\right)`
    ).join("");
    const evenTerm = fmtTerm(even[i], baseLabel, false);
    if (evenTerm) evenTerms.push(evenTerm);
    const oddTerm = fmtTerm(odd[i], `u${baseLabel}`, false);
    if (oddTerm) oddTerms.push(oddTerm);
  }

  logger.section("ĐA THỨC BESSEL");
  logger.formula(`$$P_{\\text{chẵn}}(u) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(u) = ${oddTerms.join("")}$$`);
  logger.formula(`$$P(u) = P_{\\text{chẵn}}(u) + P_{\\text{lẻ}}(u)$$`);
  logger.separator();

  // ── 7. Kết quả xấp xỉ và đạo hàm ─────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(u)}) = ${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(u)}) = ${fmtNum(oddValue)}$$`);
  logger.result(`$$f(${fmtNum(xStar)}) \\approx P(${fmtNum(xStar)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{1}{h}\\left(P_{\\text{chẵn}}'(u) + P_{\\text{lẻ}}'(u)\\right) = ${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
