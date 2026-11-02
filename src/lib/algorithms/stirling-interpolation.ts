import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  extractStirlingSubarray,
  factorial,
  logCentralDifferenceTable,
} from "./central-difference";

// Định dạng hạng tử đa thức chuẩn dấu
function fmtTerm(coeff: number, varPart: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-14) return "";
  const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
  return `${sign}${fmtNum(Math.abs(coeff))}${varPart}`;
}

export function runStirlingInterpolation(
  params: Record<string, string>,
  logger: Logger,
): void {
  const subarray = extractStirlingSubarray(params, logger);
  if (!subarray) return;

  const { X_full, Y_full, X_sub, Y_sub, k, initialK, m, x0, h, xStar } = subarray;

  // ── 1. Dữ liệu đầu vào toàn bộ ──────────────────────────
  logger.section("DỮ LIỆU ĐẦU VÀO TOÀN BỘ");
  logger.info(
    `Tổng số mốc dữ liệu: $N_{full} = ${X_full.length}$, bước lưới $h = ${fmtNum(h)}$. ` +
    `Điểm cần tính: $x^* = ${fmtNum(xStar)}$. Số mốc cần lấy: $N_{mốc} = ${2 * m + 1}$ ($m = ${m}$).`,
  );

  const fullTable = X_full.map((x, i) => ({
    "Chỉ số": `$${i}$`,
    "$x_i$": `$${fmtNum(x)}$`,
    "$y_i$": `$${fmtNum(Y_full[i])}$`,
    "Khoảng cách $|x^* - x_i|$": `$${fmtNum(Math.abs(xStar - x))}$`,
  }));
  logger.table(fullTable);
  logger.separator();

  // ── 2. Xác định mốc trung tâm và trích xuất mảng con ─────
  logger.section("XÁC ĐỊNH MỐC TRUNG TÂM VÀ TRÍCH XUẤT MẢNG CON");
  logger.formula(`$$k_{\\text{gần nhất}} = ${initialK} \\implies X_{full}[${initialK}] = ${fmtNum(X_full[initialK])}$$`);
  logger.formula(
    `$$k = \\max(m, \\; \\min(N - m, \\; k)) = \\max(${m}, \\; \\min(${X_full.length - 1 - m}, \\; ${initialK})) = ${k}$$`,
  );
  logger.formula(`$$\\text{Mốc trung tâm: } x_0 = X_{full}[${k}] = ${fmtNum(x0)}$$`);
  logger.info(
    `Trích xuất $2m + 1 = ${2 * m + 1}$ mốc đối xứng quanh $x_0$: ` +
    `chỉ số gốc từ $k - m = ${k - m}$ đến $k + m = ${k + m}$.`,
  );

  const subTable = X_sub.map((x, i) => {
    const centeredIndex = i - m; // -m..m
    const originalIndex = k - m + i;
    return {
      "Chỉ số quy chuẩn $i$": centeredIndex === 0 ? "**$0$ (tâm)**" : `$${centeredIndex}$`,
      "Chỉ số gốc": `$${originalIndex}$`,
      "$x_i$": centeredIndex === 0 ? `**$${fmtNum(x)}$**` : `$${fmtNum(x)}$`,
      "$y_i$": centeredIndex === 0 ? `**$${fmtNum(Y_sub[i])}$**` : `$${fmtNum(Y_sub[i])}$`,
    };
  });
  logger.table(subTable);
  logger.separator();

  // ── 3. Đổi biến số chuẩn hóa ─────────────────────────────
  logger.section("ĐỔI BIẾN SỐ CHUẨN HÓA");
  const t = (xStar - x0) / h;
  logger.formula(`$$t = \\frac{x^* - x_0}{h} = \\frac{${fmtNum(xStar)} - ${fmtNum(x0)}}{${fmtNum(h)}} = ${fmtNum(t)}$$`);
  if (Math.abs(t) > 0.5) {
    logger.warn("Chú ý: Stirling cho kết quả chính xác nhất khi $x^*$ nằm gần mốc trung tâm ($|t| \\le 0.5$).");
  }
  logger.separator();

  // ── 4. Bảng sai phân hữu hạn ────────────────────────────
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  const delta = buildForwardDifferenceTable(Y_sub);
  logCentralDifferenceTable(logger, X_sub, Y_sub, delta, m);
  logger.separator();

  // ── 5. Hệ số Stirling (Tách Chẵn - Lẻ) ───────────────────
  logger.section("HỆ SỐ STIRLING (Tách Chẵn - Lẻ)");
  logger.formula(
    "$$C_{\\text{lẻ}}[i] = \\frac{\\Delta_{-i+1, 2i-1} + \\Delta_{-i, 2i-1}}{2 \\cdot (2i-1)!}, \\qquad C_{\\text{chẵn}}[i] = \\frac{\\Delta_{-i, 2i}}{(2i)!}$$",
  );

  const even = [Y_sub[m]]; // C_even[0] = y_0
  const odd: number[] = [0]; // C_odd[0] = 0

  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$\\Delta_{0, 0} = y_0$",
    "$C_{\\text{chẵn}}[i]$": `$${fmtNum(Y_sub[m])}$`,
    "$C_{\\text{lẻ}}[i]$": "—",
  }];

  for (let i = 1; i <= m; i++) {
    const oddLeft = delta[m - i + 1][2 * i - 1];
    const oddRight = delta[m - i][2 * i - 1];
    const oddValue = (oddLeft + oddRight) / (2 * factorial(2 * i - 1));
    const evenValue = delta[m - i][2 * i] / factorial(2 * i);
    odd.push(oddValue);
    even.push(evenValue);
    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\Delta_{${-i}, ${2 * i}}, \\quad \\frac{\\Delta_{${1 - i}, ${2 * i - 1}} + \\Delta_{${-i}, ${2 * i - 1}}}{2}$`,
      "$C_{\\text{chẵn}}[i]$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ}}[i]$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);
  logger.separator();

  // ── 6. Tính tích lũy hai thành phần và đạo hàm ──────────
  let evenValue = even[0];
  let oddValue = 0;
  let evenDerivative = 0;
  let oddDerivative = 0;
  let base = 1;
  let baseDerivative = 0;

  const evenTerms: string[] = [fmtNum(even[0])];
  const oddTerms: string[] = [];

  for (let i = 1; i <= m; i++) {
    if (i > 1) {
      const shift = i - 1;
      const factor = t * t - shift * shift;
      const factorDerivative = 2 * t;
      baseDerivative = baseDerivative * factor + base * factorDerivative;
      base *= factor;
    }

    const evenBasis = base * t * t;
    const evenBasisDerivative = baseDerivative * t * t + base * 2 * t;
    const oddBasis = base * t;
    const oddBasisDerivative = baseDerivative * t + base;

    evenValue += even[i] * evenBasis;
    oddValue += odd[i] * oddBasis;
    evenDerivative += even[i] * evenBasisDerivative;
    oddDerivative += odd[i] * oddBasisDerivative;

    const baseLabel = i === 1
      ? ""
      : Array.from({ length: i - 1 }, (_, idx) => `(t^2-${(idx + 1) ** 2})`).join("");
    const evenTerm = fmtTerm(even[i], `t^2${baseLabel}`, false);
    if (evenTerm) evenTerms.push(evenTerm);
    const oddTerm = fmtTerm(odd[i], `t${baseLabel}`, oddTerms.length === 0);
    if (oddTerm) oddTerms.push(oddTerm);
  }

  logger.section("ĐA THỨC STIRLING");
  logger.formula(`$$P_{\\text{chẵn}}(t) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(t) = ${oddTerms.length ? oddTerms.join("") : "0"}$$`);
  logger.formula(`$$P(t) = P_{\\text{chẵn}}(t) + P_{\\text{lẻ}}(t)$$`);
  logger.separator();

  // ── 7. Kết quả xấp xỉ và đạo hàm ─────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(t)}) = ${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(t)}) = ${fmtNum(oddValue)}$$`);
  logger.result(`$$f(${fmtNum(xStar)}) \\approx P(${fmtNum(xStar)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{1}{h}\\left(P_{\\text{chẵn}}'(t) + P_{\\text{lẻ}}'(t)\\right) = ${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
