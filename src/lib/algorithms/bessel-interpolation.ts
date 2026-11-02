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

// Tìm phân số tối giản xấp xỉ dạng LaTeX
function toFractionLatex(val: number, maxDen = 500): string | null {
  const eps = 1e-6;
  const sign = val < 0 ? "-" : "";
  const absVal = Math.abs(val);
  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(absVal * den);
    if (Math.abs(absVal - num / den) < eps) {
      if (den === 1) return `${sign}${num}`;
      return `${sign}\\frac{${num}}{${den}}`;
    }
  }
  return null;
}

// Xây dựng ma trận khai triển tích cơ sở theo lũy thừa của u
function getBesselBasisData(m: number) {
  const n = 2 * m - 1;
  // E[i] là đa thức theo w = u^2: hệ số từ bậc 0 đến i
  const E: number[][] = [[1]];
  for (let i = 1; i < m; i++) {
    const shift = ((2 * i - 1) / 2) ** 2; // 0.25, 2.25, 6.25,...
    const prev = E[i - 1];
    const curr = new Array(i + 1).fill(0);
    for (let r = 0; r < prev.length; r++) {
      curr[r] -= shift * prev[r];
      curr[r + 1] += prev[r];
    }
    E.push(curr);
  }

  // Xây dựng 2m đa thức cơ sở theo biến u với bậc tối đa n
  // basisMatrix[j][p] là hệ số của u^p trong hàng j (0 <= p <= n)
  const basisMatrix: number[][] = [];
  const basisLabels: string[] = [];

  for (let j = 0; j < 2 * m; j++) {
    const i = Math.floor(j / 2);
    const isOdd = j % 2 === 1;
    const polyU = new Array(n + 1).fill(0);
    const e = E[i];

    for (let r = 0; r < e.length; r++) {
      const power = 2 * r + (isOdd ? 1 : 0);
      if (power <= n) {
        polyU[power] = e[r];
      }
    }
    basisMatrix.push(polyU);

    if (i === 0) {
      basisLabels.push(isOdd ? "$u$" : "$1$");
    } else {
      let label = Array.from({ length: i }, (_, idx) => {
        const num = (2 * idx + 1) ** 2;
        return `\\left(u^2 - \\frac{${num}}{4}\\right)`;
      }).join("");
      if (isOdd) label = `u${label}`;
      basisLabels.push(`$${label}$`);
    }
  }

  return { basisMatrix, basisLabels };
}

// Định dạng đa thức chính tắc P_n(u) từ mảng hệ số A_p (từ bậc n xuống bậc 0)
function fmtCanonicalPoly(A: number[]): string {
  const n = A.length - 1;
  const terms: string[] = [];
  for (let p = n; p >= 0; p--) {
    const coeff = A[p];
    if (Math.abs(coeff) < 1e-12) continue;
    let varPart = "";
    if (p > 1) varPart = `u^{${p}}`;
    else if (p === 1) varPart = "u";

    const isFirst = terms.length === 0;
    const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
    terms.push(`${sign}${fmtNum(Math.abs(coeff), 6)}${varPart}`);
  }
  return terms.length > 0 ? terms.join("") : "0";
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

  logger.section("ĐA THỨC BESSEL (Dạng Tích Cơ Sở)");
  logger.formula(`$$P_{\\text{chẵn}}(u) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(u) = ${oddTerms.join("")}$$`);
  logger.formula(`$$P(u) = P_{\\text{chẵn}}(u) + P_{\\text{lẻ}}(u)$$`);
  logger.separator();

  // ── 7. Bảng nhân cơ sở theo lũy thừa của u ──────────────
  logger.section("BẢNG NHÂN MA TRẬN CƠ SỞ THEO LŨY THỪA CỦA u");
  const n = 2 * m - 1;
  const { basisMatrix, basisLabels } = getBesselBasisData(m);

  logger.info(`Khai triển các tích cơ sở theo lũy thừa của $u$, ta có bảng nhân (hệ số từ $u^{${n}}, \\dots, u, 1$):`);
  const basisTableRows: Record<string, unknown>[] = [];
  for (let j = 0; j < 2 * m; j++) {
    const rowObj: Record<string, unknown> = {
      "Tích cơ sở": basisLabels[j],
    };
    for (let p = n; p >= 0; p--) {
      const colHeader = p > 1 ? `$u^{${p}}$` : p === 1 ? "$u$" : "$1$";
      const val = basisMatrix[j][p];
      rowObj[colHeader] = Math.abs(val) < 1e-12 ? "$0$" : `$${val}$`;
    }
    basisTableRows.push(rowObj);
  }
  logger.table(basisTableRows);
  logger.separator();

  // ── 8. Dạng chính tắc của đa thức Bessel ────────────────
  logger.section("DẠNG CHÍNH TẮC CỦA ĐA THỨC BESSEL");
  logger.info("Nhân từng hàng của bảng nhân với hệ số $c_j$ tương ứng rồi cộng theo cột, ta được dạng chính tắc:");

  // Mảng hệ số c_j: c_{2i} = even[i], c_{2i+1} = odd[i]
  const c: number[] = [];
  for (let i = 0; i < m; i++) {
    c.push(even[i]);
    c.push(odd[i]);
  }

  // A[p] là hệ số của u^p trong đa thức chính tắc
  const A = new Array(n + 1).fill(0);
  for (let p = 0; p <= n; p++) {
    for (let j = 0; j < 2 * m; j++) {
      A[p] += c[j] * basisMatrix[j][p];
    }
  }

  const canonicalPolyStr = fmtCanonicalPoly(A);
  logger.formula(`$$P_{${n}}(u) = ${canonicalPolyStr}$$`);
  logger.separator();

  // ── 9. Kết quả xấp xỉ và đạo hàm (Sơ đồ Horner & Biến gốc x) ─
  logger.section("KẾT QUẢ XẤP XỈ VÀ ĐẠO HÀM");

  const fracT = toFractionLatex(t);
  const fracU = toFractionLatex(u);
  const tFracStr = fracT ? ` = ${fracT} \\approx ${fmtNum(t, 6)}` : ` = ${fmtNum(t, 6)}`;
  const uFracStr = fracU ? ` = ${fracU} \\approx ${fmtNum(u, 6)}` : ` = ${fmtNum(u, 6)}`;

  logger.info(`Tại $\\bar{x} = ${fmtNum(xStar)}$, ta thực hiện đổi biến:`);
  logger.formula(
    `$$\\bar{t} = \\frac{${fmtNum(xStar)} - ${fmtNum(x0)}}{${fmtNum(h)}}${tFracStr} \\implies \\bar{u} = \\bar{t} - \\frac{1}{2}${uFracStr}$$`,
  );

  // Tính P(u) và P'(u) bằng sơ đồ Horner
  const bHorner = new Array(n + 1).fill(0);
  bHorner[n] = A[n];
  for (let p = n - 1; p >= 0; p--) {
    bHorner[p] = A[p] + u * bHorner[p + 1];
  }
  const hornerPVal = bHorner[0];

  let hornerDVal = 0;
  if (n >= 1) {
    let cHorner = bHorner[n];
    for (let p = n - 1; p >= 1; p--) {
      cHorner = bHorner[p] + u * cHorner;
    }
    hornerDVal = cHorner;
  }

  logger.info("Tính $P(\\bar{u})$ và $P'(\\bar{u})$ bằng sơ đồ Horner (hoặc đạo hàm trực tiếp rồi thay $\\bar{u}$):");
  logger.result(
    `$$f(${fmtNum(xStar)}) \\approx P_{${n}}(\\bar{u}) = ${fmtNum(hornerPVal, 6)}, \\qquad \\left.\\frac{dP_{${n}}}{du}\\right|_{u=\\bar{u}} \\approx ${fmtNum(hornerDVal, 6)}$$`,
  );

  const fxPrime = hornerDVal / h;
  logger.info("Đạo hàm theo biến gốc $x$:");
  logger.result(
    `$$f'(${fmtNum(xStar)}) \\approx P'_{${n}}(${fmtNum(xStar)}) = \\left.\\frac{1}{h} \\frac{dP_{${n}}}{du}\\right|_{u=\\bar{u}} = \\frac{${fmtNum(hornerDVal, 6)}}{${fmtNum(h)}} \\approx ${fmtNum(fxPrime, 6)}$$`,
  );

  // Đối chiếu kiểm tra với dạng tích cơ sở
  logger.info(
    `Kiểm chứng tính nhất quán: $P_{\\text{chẵn}}(${fmtNum(u)}) + P_{\\text{lẻ}}(${fmtNum(u)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$. ` +
    `Sai khác giữa hai dạng: $${fmtNum(Math.abs(hornerPVal - (evenValue + oddValue)))}$.`,
  );
}
