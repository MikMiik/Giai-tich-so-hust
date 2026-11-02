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

// Xây dựng ma trận khai triển tích cơ sở của Stirling theo lũy thừa của t
function getStirlingBasisData(m: number) {
  const n = 2 * m;
  // E[i] là đa thức theo w = t^2: \prod_{r=1}^{i-1} (w - r^2) với i = 1..m
  const E: number[][] = [[], [1]];
  for (let i = 2; i <= m; i++) {
    const shift = (i - 1) * (i - 1);
    const prev = E[i - 1];
    const curr = new Array(prev.length + 1).fill(0);
    for (let r = 0; r < prev.length; r++) {
      curr[r] -= shift * prev[r];
      curr[r + 1] += prev[r];
    }
    E.push(curr);
  }

  // Khởi tạo ma trận cơ sở: 2m + 1 hàng, mỗi hàng là đa thức theo t từ bậc 0 đến n
  const basisMatrix: number[][] = [];
  const basisLabels: string[] = [];

  // Hàng 0: cơ sở hằng số 1
  const row0 = new Array(n + 1).fill(0);
  row0[0] = 1;
  basisMatrix.push(row0);
  basisLabels.push("$1$");

  for (let i = 1; i <= m; i++) {
    // Cơ sở lẻ: t \prod_{r=1}^{i-1} (t^2 - r^2)
    const polyOdd = new Array(n + 1).fill(0);
    const e = E[i];
    for (let r = 0; r < e.length; r++) {
      polyOdd[2 * r + 1] = e[r];
    }
    basisMatrix.push(polyOdd);

    const baseProd = i === 1
      ? ""
      : Array.from({ length: i - 1 }, (_, idx) => `\\left(t^2 - ${(idx + 1) ** 2}\\right)`).join("");
    basisLabels.push(i === 1 ? "$t$" : `$t${baseProd}$`);

    // Cơ sở chẵn: t^2 \prod_{r=1}^{i-1} (t^2 - r^2)
    const polyEven = new Array(n + 1).fill(0);
    for (let r = 0; r < e.length; r++) {
      polyEven[2 * r + 2] = e[r];
    }
    basisMatrix.push(polyEven);
    basisLabels.push(i === 1 ? "$t^2$" : `$t^2${baseProd}$`);
  }

  return { basisMatrix, basisLabels };
}

// Định dạng đa thức chính tắc P_n(t)
function fmtCanonicalPolyT(A: number[]): string {
  const n = A.length - 1;
  const terms: string[] = [];
  for (let p = n; p >= 0; p--) {
    const coeff = A[p];
    if (Math.abs(coeff) < 1e-12) continue;
    let varPart = "";
    if (p > 1) varPart = `t^{${p}}`;
    else if (p === 1) varPart = "t";

    const isFirst = terms.length === 0;
    const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
    terms.push(`${sign}${fmtNum(Math.abs(coeff), 6)}${varPart}`);
  }
  return terms.length > 0 ? terms.join("") : "0";
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

  logger.section("ĐA THỨC STIRLING (Dạng Tích Cơ Sở)");
  logger.formula(`$$P_{\\text{chẵn}}(t) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(t) = ${oddTerms.length ? oddTerms.join("") : "0"}$$`);
  logger.formula(`$$P(t) = P_{\\text{chẵn}}(t) + P_{\\text{lẻ}}(t)$$`);
  logger.separator();

  // ── 7. Bảng nhân cơ sở theo lũy thừa của t ──────────────
  logger.section("BẢNG NHÂN MA TRẬN CƠ SỞ THEO LŨY THỪA CỦA t");
  const n = 2 * m;
  const { basisMatrix, basisLabels } = getStirlingBasisData(m);

  logger.info(`Khai triển các tích cơ sở theo lũy thừa của $t$, ta có bảng nhân (hệ số từ $t^{${n}}, \\dots, t, 1$):`);
  const basisTableRows: Record<string, unknown>[] = [];
  for (let j = 0; j <= 2 * m; j++) {
    const rowObj: Record<string, unknown> = {
      "Tích cơ sở": basisLabels[j],
    };
    for (let p = n; p >= 0; p--) {
      const colHeader = p > 1 ? `$t^{${p}}$` : p === 1 ? "$t$" : "$1$";
      const val = basisMatrix[j][p];
      rowObj[colHeader] = Math.abs(val) < 1e-12 ? "$0$" : `$${val}$`;
    }
    basisTableRows.push(rowObj);
  }
  logger.table(basisTableRows);
  logger.separator();

  // ── 8. Dạng chính tắc của đa thức Stirling ────────────────
  logger.section("DẠNG CHÍNH TẮC CỦA ĐA THỨC STIRLING");
  logger.info("Nhân từng hàng của bảng nhân với hệ số $c_j$ tương ứng rồi cộng theo cột, ta được dạng chính tắc:");

  // Mảng hệ số c_j: c[0] = even[0], sau đó c_{2i-1} = odd[i], c_{2i} = even[i]
  const c: number[] = [even[0]];
  for (let i = 1; i <= m; i++) {
    c.push(odd[i]);
    c.push(even[i]);
  }

  // A[p] là hệ số của t^p trong đa thức chính tắc
  const A = new Array(n + 1).fill(0);
  for (let p = 0; p <= n; p++) {
    for (let j = 0; j <= 2 * m; j++) {
      A[p] += c[j] * basisMatrix[j][p];
    }
  }

  const canonicalPolyStr = fmtCanonicalPolyT(A);
  logger.formula(`$$P_{${n}}(t) = ${canonicalPolyStr}$$`);
  logger.separator();

  // ── 9. Kết quả xấp xỉ và đạo hàm (Sơ đồ Horner & Biến gốc x) ─
  logger.section("KẾT QUẢ XẤP XỈ VÀ ĐẠO HÀM");

  const fracT = toFractionLatex(t);
  const tFracStr = fracT ? ` = ${fracT} \\approx ${fmtNum(t, 6)}` : ` = ${fmtNum(t, 6)}`;

  logger.info(`Tại $\\bar{x} = ${fmtNum(xStar)}$, ta có bước đổi biến:`);
  logger.formula(`$$\\bar{t} = \\frac{${fmtNum(xStar)} - ${fmtNum(x0)}}{${fmtNum(h)}}${tFracStr}$$`);

  // Tính P(t) và P'(t) bằng sơ đồ Horner
  const bHorner = new Array(n + 1).fill(0);
  bHorner[n] = A[n];
  for (let p = n - 1; p >= 0; p--) {
    bHorner[p] = A[p] + t * bHorner[p + 1];
  }
  const hornerPVal = bHorner[0];

  let hornerDVal = 0;
  if (n >= 1) {
    let cHorner = bHorner[n];
    for (let p = n - 1; p >= 1; p--) {
      cHorner = bHorner[p] + t * cHorner;
    }
    hornerDVal = cHorner;
  }

  logger.info("Tính $P(\\bar{t})$ và $P'(\\bar{t})$ bằng sơ đồ Horner (hoặc đạo hàm trực tiếp rồi thay $\\bar{t}$):");
  logger.result(
    `$$f(${fmtNum(xStar)}) \\approx P_{${n}}(\\bar{t}) = ${fmtNum(hornerPVal, 6)}, \\qquad \\left.\\frac{dP_{${n}}}{dt}\\right|_{t=\\bar{t}} \\approx ${fmtNum(hornerDVal, 6)}$$`,
  );

  const fxPrime = hornerDVal / h;
  logger.info("Đạo hàm theo biến gốc $x$:");
  logger.result(
    `$$f'(${fmtNum(xStar)}) \\approx P'_{${n}}(${fmtNum(xStar)}) = \\left.\\frac{1}{h} \\frac{dP_{${n}}}{dt}\\right|_{t=\\bar{t}} = \\frac{${fmtNum(hornerDVal, 6)}}{${fmtNum(h)}} \\approx ${fmtNum(fxPrime, 6)}$$`,
  );

  // Đối chiếu kiểm tra tính nhất quán với dạng tích cơ sở hiện tại
  logger.info(
    `Kiểm chứng tính nhất quán: $P_{\\text{chẵn}}(${fmtNum(t)}) + P_{\\text{lẻ}}(${fmtNum(t)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$. ` +
    `Sai khác giữa hai dạng: $${fmtNum(Math.abs(hornerPVal - (evenValue + oddValue)))}$.`,
  );
}
