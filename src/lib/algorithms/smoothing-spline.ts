import type { Logger } from "@/types/solver";
import { fmtNum, parseCoeffs, parseFraction } from "./math-utils";

// ─────────────────────────────────────────────────────────────
// Thomas algorithm cho hệ ba đường chéo
//   lower[i]*x[i-1] + diag[i]*x[i] + upper[i]*x[i+1] = rhs[i]
//   i = 0..n-1   (lower[0] và upper[n-1] không dùng)
// ─────────────────────────────────────────────────────────────
function solveThomas(
  lower: number[],
  diag: number[],
  upper: number[],
  rhs: number[],
): number[] {
  const n = diag.length;
  if (n === 0) return [];
  if (n === 1) return [rhs[0] / diag[0]];

  const c = [...upper];
  const d = [...rhs];
  const x: number[] = Array(n).fill(0);

  // Bước tiến (forward sweep)
  c[0] = c[0] / diag[0];
  d[0] = d[0] / diag[0];
  for (let i = 1; i < n; i++) {
    const denom = diag[i] - lower[i] * c[i - 1];
    if (Math.abs(denom) < 1e-15) throw new Error("Ma trận suy biến (denom = 0)");
    c[i] = upper[i] / denom;
    d[i] = (d[i] - lower[i] * d[i - 1]) / denom;
  }

  // Bước lùi (back substitution)
  x[n - 1] = d[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = d[i] - c[i] * x[i + 1];
  }
  return x;
}

// Định dạng số hạng đa thức bậc p: [sign]|coeff|x^p... (tránh "+ -3x")
function polyTerm(coeff: number, varExpr: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-14) return "";
  const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
  const abs = Math.abs(coeff);
  return `${sign}${fmtNum(abs)}${varExpr}`;
}

function fmtPolyLinear(a: number, b: number): string {
  const terms: string[] = [];
  const sA = polyTerm(a, "x", terms.length === 0);
  if (sA) terms.push(sA);
  const sB = polyTerm(b, "", terms.length === 0);
  if (sB) terms.push(sB);
  return terms.join("") || "0";
}

function fmtPolyQuadratic(a: number, b: number, c: number): string {
  const terms: string[] = [];
  const sA = polyTerm(a, "x^2", terms.length === 0);
  if (sA) terms.push(sA);
  const sB = polyTerm(b, "x", terms.length === 0);
  if (sB) terms.push(sB);
  const sC = polyTerm(c, "", terms.length === 0);
  if (sC) terms.push(sC);
  return terms.join("") || "0";
}

function fmtPolyCubic(a: number, b: number, c: number, d: number): string {
  const terms: string[] = [];
  const sA = polyTerm(a, "x^3", terms.length === 0);
  if (sA) terms.push(sA);
  const sB = polyTerm(b, "x^2", terms.length === 0);
  if (sB) terms.push(sB);
  const sC = polyTerm(c, "x", terms.length === 0);
  if (sC) terms.push(sC);
  const sD = polyTerm(d, "", terms.length === 0);
  if (sD) terms.push(sD);
  return terms.join("") || "0";
}

// Biểu diễn biến lệch (x - x_k)^p cho dạng khai triển Taylor
function fmtShiftedVar(x0: number, pow: number): string {
  const base = Math.abs(x0) < 1e-14
    ? "x"
    : x0 > 0
      ? `(x - ${fmtNum(x0)})`
      : `(x + ${fmtNum(Math.abs(x0))})`;
  if (pow === 1) return base;
  return `${base}^${pow}`;
}

// Định dạng đa thức theo dạng Taylor cục bộ tại x_k: y_k + sum(coeff_p * (x - x_k)^p)
function fmtTaylor(
  yk: number,
  coeffs: { pow: number; val: number }[],
  x0: number,
): string {
  const terms: string[] = [];
  const sY = polyTerm(yk, "", terms.length === 0);
  if (sY) terms.push(sY);
  for (const { pow, val } of coeffs) {
    const sTerm = polyTerm(val, fmtShiftedVar(x0, pow), terms.length === 0);
    if (sTerm) terms.push(sTerm);
  }
  return terms.join("") || "0";
}

// Tìm đoạn k chứa xStar (trả về 0-indexed interval)
function findInterval(X: number[], xStar: number): number {
  const intervals = X.length - 1;
  for (let k = 0; k < intervals - 1; k++) {
    if (xStar <= X[k + 1]) return k;
  }
  return intervals - 1;
}

// ─────────────────────────────────────────────────────────────
export function runSmoothingSpline(
  params: Record<string, string>,
  logger: Logger,
): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const degree = Number.parseInt(params.degree, 10);
  const xStar = params.xVal?.trim() ? parseFraction(params.xVal) : NaN;

  // Hỗ trợ cả tên tham số mới (boundaryVal1/2) và cũ (boundary1/2)
  const rawB1 = params.boundaryVal1?.trim() || params.boundary1?.trim() || "0";
  const rawB2 = params.boundaryVal2?.trim() || params.boundary2?.trim() || "0";
  const b1 = parseFraction(rawB1);
  const b2 = parseFraction(rawB2);

  // Dạng biên cho p = 3: "second" (S''), "clamped" (S'), "clamped_second" (S' trái, S'' phải), "second_clamped" (S'' trái, S' phải)
  const boundaryType3 = ["clamped", "clamped_second", "second_clamped"].includes(
    params.boundaryType3,
  )
    ? params.boundaryType3
    : "second";

  // ── Kiểm tra đầu vào ────────────────────────────────────
  if (!Number.isInteger(degree) || degree < 1 || degree > 3) {
    logger.error("Bậc spline $p$ phải là số nguyên từ **1 đến 3**.");
    return;
  }
  const nNodes = X.length;
  if (nNodes < 2 || nNodes !== Y.length) {
    logger.error("Cần ít nhất 2 mốc và hai dãy $X$, $Y$ cùng độ dài.");
    return;
  }
  for (let i = 1; i < nNodes; i++) {
    if (X[i] <= X[i - 1]) {
      logger.error(`Dãy $X$ phải tăng nghiêm ngặt: $x_{${i-1}} < x_${i}$.`);
      return;
    }
  }

  // Xác định mốc điều kiện biên cho p = 2 (có thể là bất kỳ mốc x_i nào từ 1 đến n)
  let nodeIdx2 = 0; // 0-based
  if (params.boundaryNode2 && params.boundaryNode2.trim() !== "") {
    const rawNode = params.boundaryNode2.trim().toLowerCase();
    if (rawNode === "xn") {
      nodeIdx2 = nNodes - 1;
    } else if (rawNode.startsWith("x")) {
      const parsed = parseInt(rawNode.slice(1), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= nNodes) {
        nodeIdx2 = parsed - 1;
      }
    } else {
      const parsed = parseInt(rawNode, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= nNodes) {
        nodeIdx2 = parsed - 1;
      }
    }
  } else if (params.boundaryPos2 === "xn") {
    nodeIdx2 = nNodes - 1;
  }

  if (degree === 2 && !Number.isFinite(b1)) {
    logger.error(`Cần nhập điều kiện biên $S'(x_{${nodeIdx2 + 1}})$ hợp lệ.`);
    return;
  }
  if (degree === 3) {
    if (!Number.isFinite(b1) || !Number.isFinite(b2)) {
      let typeLabel = "S''(x_1), S''(x_n)";
      if (boundaryType3 === "clamped") typeLabel = "S'(x_1), S'(x_n)";
      else if (boundaryType3 === "clamped_second") typeLabel = "S'(x_1), S''(x_n)";
      else if (boundaryType3 === "second_clamped") typeLabel = "S''(x_1), S'(x_n)";
      logger.error(`Spline bậc 3 cần 2 điều kiện biên $${typeLabel}$.`);
      return;
    }
    if (nNodes < 3) {
      logger.error("Spline bậc 3 cần ít nhất 3 mốc nội suy.");
      return;
    }
  }

  const intervals = nNodes - 1;
  const h: number[] = X.slice(0, -1).map((xi, i) => X[i + 1] - xi);

  // ── 1. Bảng dữ liệu và bước lưới ───────────────────────
  logger.section("BẢNG DỮ LIỆU VÀ BƯỚC LƯỚI");
  const inputTable = X.map((xi, i) => ({
    "$k$": `$${i + 1}$`,
    "$x_k$": `$${fmtNum(xi)}$`,
    "$y_k$": `$${fmtNum(Y[i])}$`,
    "$h_k = x_{k+1} - x_k$": i < intervals ? `$${fmtNum(h[i])}$` : "—",
  }));
  logger.table(inputTable);
  logger.info(`Số đoạn: $n - 1 = ${intervals}$. Mỗi đoạn $[x_k, x_{k+1}]$ có một đa thức $S_k(x)$ riêng.`);

  // ── p = 1: Spline tuyến tính ────────────────────────────
  if (degree === 1) {
    logger.section("HỆ SỐ ĐA THỨC TUYẾN TÍNH (p = 1)");
    logger.formula(`$$\\text{Dạng cục bộ: } S_k(x) = y_k + m_k(x - x_k), \\quad m_k = \\frac{y_{k+1}-y_k}{h_k}$$`);
    logger.formula(`$$\\text{Dạng chính tắc: } S_k(x) = a_k x + b_k, \\quad a_k = m_k, \\quad b_k = y_k - a_k x_k$$`);

    const aArr: number[] = [], bArr: number[] = [];
    const coefTable: Record<string, unknown>[] = [];
    for (let k = 0; k < intervals; k++) {
      const ak = (Y[k + 1] - Y[k]) / h[k];
      const bk = Y[k] - ak * X[k];
      aArr.push(ak); bArr.push(bk);
      coefTable.push({
        "$k$": `$${k + 1}$`,
        "Đoạn": `$[${fmtNum(X[k])}, ${fmtNum(X[k + 1])}]$`,
        "$m_k = a_k$": `$${fmtNum(ak)}$`,
        "$b_k$": `$${fmtNum(bk)}$`,
        "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * X[k] + bk)}$ (kỳ vọng $${fmtNum(Y[k])}$)`,
      });
    }
    logger.table(coefTable);

    logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 1)");
    for (let k = 0; k < intervals; k++) {
      const taylorStr = fmtTaylor(Y[k], [{ pow: 1, val: aArr[k] }], X[k]);
      const canonStr = fmtPolyLinear(aArr[k], bArr[k]);
      logger.result(
        `$$S_{${k + 1}}(x) = ${taylorStr} = ${canonStr} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
      );
    }

    if (Number.isFinite(xStar)) {
      if (xStar < X[0] || xStar > X[nNodes - 1]) {
        logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
        return;
      }
      const k = findInterval(X, xStar);
      const val = aArr[k] * xStar + bArr[k];
      const d1 = aArr[k];
      logger.section("GIÁ TRỊ VÀ ĐẠO HÀM TẠI ĐIỂM NỘI SUY");
      logger.info(`Điểm $x^* = ${fmtNum(xStar)}$ thuộc đoạn $[x_{${k + 1}}, x_{${k + 2}}] = [${fmtNum(X[k])}, ${fmtNum(X[k + 1])}]$, sử dụng đa thức $S_{${k + 1}}(x)$.`);
      logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
      logger.result(`$$S'(${fmtNum(xStar)}) = S'_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(d1)}$$`);
    }
    return;
  }

  // ── p = 2: Spline bậc 2 với đệ quy tiến / lùi / hai chiều từ mốc x_i ───
  if (degree === 2) {
    const m: number[] = Array(nNodes).fill(0);
    const chosenNodeName = `x_{${nodeIdx2 + 1}}`;

    // Gán giá trị biên tại mốc đã chọn
    m[nodeIdx2] = b1;

    // Chiều tiến: từ nodeIdx2 tiến về n - 1
    for (let k = nodeIdx2; k < intervals; k++) {
      m[k + 1] = (2 * (Y[k + 1] - Y[k])) / h[k] - m[k];
    }

    // Chiều lùi: từ nodeIdx2 - 1 lùi về 0
    for (let k = nodeIdx2 - 1; k >= 0; k--) {
      m[k] = (2 * (Y[k + 1] - Y[k])) / h[k] - m[k + 1];
    }

    if (nodeIdx2 === 0) {
      logger.section("ĐỆ QUY TIẾN TÌM ĐẠO HÀM m_k (p = 2, từ mốc x₁)");
      logger.formula(`$$m_1 = ${fmtNum(b1)} \\;(\\text{điều kiện biên tại } x_1), \\quad m_{k+1} = \\frac{2(y_{k+1}-y_k)}{h_k} - m_k$$`);
    } else if (nodeIdx2 === nNodes - 1) {
      logger.section(`ĐỆ QUY LÙI TÌM ĐẠO HÀM m_k (p = 2, từ mốc x_${nNodes})`);
      logger.formula(`$$m_n = ${fmtNum(b1)} \\;(\\text{điều kiện biên tại } x_n), \\quad m_k = \\frac{2(y_{k+1}-y_k)}{h_k} - m_{k+1}$$`);
    } else {
      logger.section(`ĐỆ QUY HAI CHIỀU TÌM ĐẠO HÀM m_k (p = 2, xuất phát từ mốc $${chosenNodeName}$)`);
      logger.formula(`$$S'(${chosenNodeName}) = m_{${nodeIdx2 + 1}} = ${fmtNum(b1)} \\;(\\text{điều kiện biên})$$`);
      logger.formula(`$$\\text{Chiều tiến: } m_{k+1} = \\frac{2(y_{k+1}-y_k)}{h_k} - m_k \\quad (k \\ge ${nodeIdx2 + 1})$$`);
      logger.formula(`$$\\text{Chiều lùi: } m_k = \\frac{2(y_{k+1}-y_k)}{h_k} - m_{k+1} \\quad (k \\le ${nodeIdx2})$$`);
    }

    const mTable: Record<string, unknown>[] = [];
    for (let i = 0; i < nNodes; i++) {
      let source = "";
      if (i === nodeIdx2) {
        source = `Điều kiện biên tại $x_{${i + 1}}$`;
      } else if (i > nodeIdx2) {
        source = `Tính tiến: $\\frac{2 \\cdot ${fmtNum(Y[i] - Y[i - 1])}}{${fmtNum(h[i - 1])}} - (${fmtNum(m[i - 1])}) = ${fmtNum(m[i])}$`;
      } else {
        source = `Tính lùi: $\\frac{2 \\cdot ${fmtNum(Y[i + 1] - Y[i])}}{${fmtNum(h[i])}} - (${fmtNum(m[i + 1])}) = ${fmtNum(m[i])}$`;
      }
      mTable.push({
        "$k$": `$${i + 1}$`,
        "$m_k = S'(x_k)$": `$${fmtNum(m[i])}$`,
        "Nguồn": source,
      });
    }
    logger.table(mTable);

    logger.section("HỆ SỐ ĐA THỨC BẬC HAI (p = 2)");
    logger.formula(`$$\\text{Dạng cục bộ: } S_k(x) = y_k + m_k(x - x_k) + a_k(x - x_k)^2, \\quad a_k = \\frac{m_{k+1}-m_k}{2h_k}$$`);
    logger.formula(`$$\\text{Dạng chính tắc: } S_k(x) = a_k x^2 + b_k x + c_k, \\quad b_k = \\frac{m_k x_{k+1}-m_{k+1}x_k}{h_k}, \\quad c_k = \\frac{-m_k x_{k+1}^2+m_{k+1}x_k^2}{2h_k}+y_k+\\frac{m_k h_k}{2}$$`);

    const aArr: number[] = [], bArr: number[] = [], cArr: number[] = [];
    const coefTable: Record<string, unknown>[] = [];
    for (let k = 0; k < intervals; k++) {
      const ak = (m[k + 1] - m[k]) / (2 * h[k]);
      const bk = (m[k] * X[k + 1] - m[k + 1] * X[k]) / h[k];
      const ck = (-m[k] * X[k + 1] ** 2 + m[k + 1] * X[k] ** 2) / (2 * h[k]) + Y[k] + (m[k] * h[k]) / 2;
      aArr.push(ak); bArr.push(bk); cArr.push(ck);
      coefTable.push({
        "$k$": `$${k + 1}$`,
        "Đoạn": `$[${fmtNum(X[k])}, ${fmtNum(X[k + 1])}]$`,
        "$a_k$": `$${fmtNum(ak)}$`,
        "$b_k$": `$${fmtNum(bk)}$`,
        "$c_k$": `$${fmtNum(ck)}$`,
        "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * X[k] ** 2 + bk * X[k] + ck)}$ (kỳ vọng $${fmtNum(Y[k])}$)`,
      });
    }
    logger.table(coefTable);

    logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 2)");
    for (let k = 0; k < intervals; k++) {
      const taylorStr = fmtTaylor(Y[k], [{ pow: 1, val: m[k] }, { pow: 2, val: aArr[k] }], X[k]);
      const canonStr = fmtPolyQuadratic(aArr[k], bArr[k], cArr[k]);
      logger.result(
        `$$S_{${k + 1}}(x) = ${taylorStr} = ${canonStr} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
      );
    }

    if (Number.isFinite(xStar)) {
      if (xStar < X[0] || xStar > X[nNodes - 1]) {
        logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
        return;
      }
      const k = findInterval(X, xStar);
      const dx = xStar - X[k];
      const val = aArr[k] * xStar ** 2 + bArr[k] * xStar + cArr[k];
      const d1 = m[k] + 2 * aArr[k] * dx;
      const d2 = 2 * aArr[k];
      logger.section("GIÁ TRỊ VÀ ĐẠO HÀM TẠI ĐIỂM NỘI SUY");
      logger.info(`Điểm $x^* = ${fmtNum(xStar)}$ thuộc đoạn $[x_{${k + 1}}, x_{${k + 2}}] = [${fmtNum(X[k])}, ${fmtNum(X[k + 1])}]$, sử dụng đa thức $S_{${k + 1}}(x)$.`);
      logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
      logger.result(`$$S'(${fmtNum(xStar)}) = S'_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(d1)}$$`);
      logger.result(`$$S''(${fmtNum(xStar)}) = S''_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(d2)}$$`);
    }
    return;
  }

  // ── p = 3: Spline bậc 3 với thuật toán Thomas ───────────
  let alpha: number[] = [];

  if (boundaryType3 === "second") {
    // Dạng 1: Biên đạo hàm cấp 2 cả 2 đầu: S''(x₁) = b₁, S''(xₙ) = b₂
    logger.section("HỆ PHƯƠNG TRÌNH BA ĐƯỜNG CHÉO (p = 3, BIÊN S'')");
    logger.formula(
      `$$\\frac{h_{k-1}}{6}\\alpha_{k-1} + \\frac{h_{k-1}+h_k}{3}\\alpha_k + \\frac{h_k}{6}\\alpha_{k+1} = \\frac{y_{k+1}-y_k}{h_k} - \\frac{y_k-y_{k-1}}{h_{k-1}}, \\quad k=2,\\ldots,n-1$$`,
    );
    logger.info(`Điều kiện biên cấp hai: $\\alpha_1 = S''(x_1) = ${fmtNum(b1)}$, $\\alpha_n = S''(x_n) = ${fmtNum(b2)}$. Giải cho $\\alpha_2, \\ldots, \\alpha_{n-1}$.`);

    const eqCount = nNodes - 2;
    const lowerArr: number[] = Array(eqCount).fill(0);
    const diagArr: number[] = Array(eqCount).fill(0);
    const upperArr: number[] = Array(eqCount).fill(0);
    const rhsArr: number[] = Array(eqCount).fill(0);

    for (let eq = 0; eq < eqCount; eq++) {
      const hk = h[eq], hk1 = h[eq + 1];
      diagArr[eq] = (hk + hk1) / 3;
      if (eq > 0) lowerArr[eq] = hk / 6;
      if (eq < eqCount - 1) upperArr[eq] = hk1 / 6;

      let rVal = (Y[eq + 2] - Y[eq + 1]) / hk1 - (Y[eq + 1] - Y[eq]) / hk;
      if (eq === 0) rVal -= (hk / 6) * b1;
      if (eq === eqCount - 1) rVal -= (hk1 / 6) * b2;
      rhsArr[eq] = rVal;
    }

    const sysTable: Record<string, unknown>[] = [];
    for (let eq = 0; eq < eqCount; eq++) {
      sysTable.push({
        "PT": `$${eq + 1}$`,
        [`$\\alpha_{${eq + 1}}$`]: eq > 0 ? `$${fmtNum(lowerArr[eq])}$` : "biên",
        [`$\\alpha_{${eq + 2}}$`]: `$${fmtNum(diagArr[eq])}$`,
        [`$\\alpha_{${eq + 3}}$`]: eq < eqCount - 1 ? `$${fmtNum(upperArr[eq])}$` : "biên",
        "Vế phải": `$${fmtNum(rhsArr[eq])}$`,
      });
    }
    logger.table(sysTable);

    logger.section("THUẬT TOÁN THOMAS — BẢNG ĐẠO HÀM CẤP HAI");
    let alphaInner: number[];
    try {
      alphaInner = solveThomas(lowerArr, diagArr, upperArr, rhsArr);
    } catch (e) {
      logger.error(`Hệ ba đường chéo suy biến: ${(e as Error).message}`);
      return;
    }
    alpha = [b1, ...alphaInner, b2];
  } else if (boundaryType3 === "clamped") {
    // Dạng 2: Clamped Spline (Biên đạo hàm cấp 1 cả 2 đầu: S'(x₁) = b₁, S'(xₙ) = b₂)
    logger.section("HỆ PHƯƠNG TRÌNH BA ĐƯỜNG CHÉO (p = 3, CLAMPED SPLINE S')");
    logger.formula(`$$\\text{Biên } x_1: \\quad \\frac{h_1}{3}\\alpha_1 + \\frac{h_1}{6}\\alpha_2 = \\frac{y_2 - y_1}{h_1} - S'(x_1)$$`);
    logger.formula(`$$\\text{Mốc trong: } \\quad \\frac{h_{k-1}}{6}\\alpha_{k-1} + \\frac{h_{k-1}+h_k}{3}\\alpha_k + \\frac{h_k}{6}\\alpha_{k+1} = \\frac{y_{k+1}-y_k}{h_k} - \\frac{y_k-y_{k-1}}{h_{k-1}}$$`);
    logger.formula(`$$\\text{Biên } x_n: \\quad \\frac{h_{n-1}}{6}\\alpha_{n-1} + \\frac{h_{n-1}}{3}\\alpha_n = S'(x_n) - \\frac{y_n - y_{n-1}}{h_{n-1}}$$`);
    logger.info(`Điều kiện kẹp biên cấp một: $S'(x_1) = ${fmtNum(b1)}$, $S'(x_n) = ${fmtNum(b2)}$. Hệ gồm $n = ${nNodes}$ phương trình giải cho $\\alpha_1, \\dots, \\alpha_n$.`);

    const eqCount = nNodes;
    const lowerArr: number[] = Array(eqCount).fill(0);
    const diagArr: number[] = Array(eqCount).fill(0);
    const upperArr: number[] = Array(eqCount).fill(0);
    const rhsArr: number[] = Array(eqCount).fill(0);

    // PT 0: Biên tại x_1
    diagArr[0] = h[0] / 3;
    upperArr[0] = h[0] / 6;
    rhsArr[0] = (Y[1] - Y[0]) / h[0] - b1;

    // PT 1 .. n-2: Mốc trong
    for (let k = 1; k < nNodes - 1; k++) {
      const hk_prev = h[k - 1];
      const hk = h[k];
      lowerArr[k] = hk_prev / 6;
      diagArr[k] = (hk_prev + hk) / 3;
      upperArr[k] = hk / 6;
      rhsArr[k] = (Y[k + 1] - Y[k]) / hk - (Y[k] - Y[k - 1]) / hk_prev;
    }

    // PT n-1: Biên tại x_n
    const lastH = h[nNodes - 2];
    lowerArr[nNodes - 1] = lastH / 6;
    diagArr[nNodes - 1] = lastH / 3;
    rhsArr[nNodes - 1] = b2 - (Y[nNodes - 1] - Y[nNodes - 2]) / lastH;

    const sysTable: Record<string, unknown>[] = [];
    for (let eq = 0; eq < eqCount; eq++) {
      sysTable.push({
        "PT": `$${eq + 1}$`,
        [`$\\alpha_{${eq}}$`]: eq > 0 ? `$${fmtNum(lowerArr[eq])}$` : "—",
        [`$\\alpha_{${eq + 1}}$`]: `$${fmtNum(diagArr[eq])}$`,
        [`$\\alpha_{${eq + 2}}$`]: eq < eqCount - 1 ? `$${fmtNum(upperArr[eq])}$` : "—",
        "Vế phải": `$${fmtNum(rhsArr[eq])}$`,
      });
    }
    logger.table(sysTable);

    logger.section("THUẬT TOÁN THOMAS — BẢNG ĐẠO HÀM CẤP HAI");
    try {
      alpha = solveThomas(lowerArr, diagArr, upperArr, rhsArr);
    } catch (e) {
      logger.error(`Hệ ba đường chéo suy biến: ${(e as Error).message}`);
      return;
    }
  } else if (boundaryType3 === "clamped_second") {
    // Dạng 3: Biên hỗn hợp: S'(x₁) = b₁ (trái) và S''(xₙ) = b₂ (phải)
    logger.section("HỆ PHƯƠNG TRÌNH BA ĐƯỜNG CHÉO (p = 3, BIÊN HỖN HỢP: S'(x₁) VÀ S''(xₙ))");
    logger.formula(`$$\\text{Biên trái } x_1: \\quad \\frac{h_1}{3}\\alpha_1 + \\frac{h_1}{6}\\alpha_2 = \\frac{y_2 - y_1}{h_1} - S'(x_1)$$`);
    logger.formula(`$$\\text{Mốc trong: } \\quad \\frac{h_{k-1}}{6}\\alpha_{k-1} + \\frac{h_{k-1}+h_k}{3}\\alpha_k + \\frac{h_k}{6}\\alpha_{k+1} = \\frac{y_{k+1}-y_k}{h_k} - \\frac{y_k-y_{k-1}}{h_{k-1}}$$`);
    logger.formula(`$$\\text{Phương trình sát biên phải: } \\quad \\frac{h_{n-2}}{6}\\alpha_{n-2} + \\frac{h_{n-2}+h_{n-1}}{3}\\alpha_{n-1} = \\frac{y_n-y_{n-1}}{h_{n-1}} - \\frac{y_{n-1}-y_{n-2}}{h_{n-2}} - \\frac{h_{n-1}}{6}S''(x_n)$$`);
    logger.info(`Điều kiện biên hỗn hợp: $S'(x_1) = ${fmtNum(b1)}$ và $\\alpha_n = S''(x_n) = ${fmtNum(b2)}$. Hệ gồm $n - 1 = ${nNodes - 1}$ phương trình giải cho $\\alpha_1, \\dots, \\alpha_{n-1}$.`);

    const eqCount = nNodes - 1;
    const lowerArr: number[] = Array(eqCount).fill(0);
    const diagArr: number[] = Array(eqCount).fill(0);
    const upperArr: number[] = Array(eqCount).fill(0);
    const rhsArr: number[] = Array(eqCount).fill(0);

    // PT 0: Biên tại x_1
    diagArr[0] = h[0] / 3;
    upperArr[0] = h[0] / 6;
    rhsArr[0] = (Y[1] - Y[0]) / h[0] - b1;

    // PT 1 .. n-3: Mốc trong
    for (let k = 1; k < nNodes - 2; k++) {
      const hk_prev = h[k - 1];
      const hk = h[k];
      lowerArr[k] = hk_prev / 6;
      diagArr[k] = (hk_prev + hk) / 3;
      upperArr[k] = hk / 6;
      rhsArr[k] = (Y[k + 1] - Y[k]) / hk - (Y[k] - Y[k - 1]) / hk_prev;
    }

    // PT n-2: Mốc k = n-2 (ẩn alpha_{n-1})
    const lastEq = nNodes - 2;
    const hPrevLast = h[lastEq - 1];
    const hLast = h[lastEq];
    lowerArr[lastEq] = hPrevLast / 6;
    diagArr[lastEq] = (hPrevLast + hLast) / 3;
    rhsArr[lastEq] = (Y[lastEq + 1] - Y[lastEq]) / hLast - (Y[lastEq] - Y[lastEq - 1]) / hPrevLast - (hLast / 6) * b2;

    const sysTable: Record<string, unknown>[] = [];
    for (let eq = 0; eq < eqCount; eq++) {
      sysTable.push({
        "PT": `$${eq + 1}$`,
        [`$\\alpha_{${eq}}$`]: eq > 0 ? `$${fmtNum(lowerArr[eq])}$` : "—",
        [`$\\alpha_{${eq + 1}}$`]: `$${fmtNum(diagArr[eq])}$`,
        [`$\\alpha_{${eq + 2}}$`]: eq < eqCount - 1 ? `$${fmtNum(upperArr[eq])}$` : "biên",
        "Vế phải": `$${fmtNum(rhsArr[eq])}$`,
      });
    }
    logger.table(sysTable);

    logger.section("THUẬT TOÁN THOMAS — BẢNG ĐẠO HÀM CẤP HAI");
    let alphaPrefix: number[];
    try {
      alphaPrefix = solveThomas(lowerArr, diagArr, upperArr, rhsArr);
    } catch (e) {
      logger.error(`Hệ ba đường chéo suy biến: ${(e as Error).message}`);
      return;
    }
    alpha = [...alphaPrefix, b2];
  } else {
    // Dạng 4: Biên hỗn hợp: S''(x₁) = b₁ (trái) và S'(xₙ) = b₂ (phải)
    logger.section("HỆ PHƯƠNG TRÌNH BA ĐƯỜNG CHÉO (p = 3, BIÊN HỖN HỢP: S''(x₁) VÀ S'(xₙ))");
    logger.formula(`$$\\text{Phương trình sát biên trái: } \\quad \\frac{h_1+h_2}{3}\\alpha_2 + \\frac{h_2}{6}\\alpha_3 = \\frac{y_3 - y_2}{h_2} - \\frac{y_2 - y_1}{h_1} - \\frac{h_1}{6}S''(x_1)$$`);
    logger.formula(`$$\\text{Mốc trong: } \\quad \\frac{h_{k-1}}{6}\\alpha_{k-1} + \\frac{h_{k-1}+h_k}{3}\\alpha_k + \\frac{h_k}{6}\\alpha_{k+1} = \\frac{y_{k+1}-y_k}{h_k} - \\frac{y_k-y_{k-1}}{h_{k-1}}$$`);
    logger.formula(`$$\\text{Biên phải } x_n: \\quad \\frac{h_{n-1}}{6}\\alpha_{n-1} + \\frac{h_{n-1}}{3}\\alpha_n = S'(x_n) - \\frac{y_n - y_{n-1}}{h_{n-1}}$$`);
    logger.info(`Điều kiện biên hỗn hợp: $\\alpha_1 = S''(x_1) = ${fmtNum(b1)}$ và $S'(x_n) = ${fmtNum(b2)}$. Hệ gồm $n - 1 = ${nNodes - 1}$ phương trình giải cho $\\alpha_2, \\dots, \\alpha_n$.`);

    const eqCount = nNodes - 1;
    const lowerArr: number[] = Array(eqCount).fill(0);
    const diagArr: number[] = Array(eqCount).fill(0);
    const upperArr: number[] = Array(eqCount).fill(0);
    const rhsArr: number[] = Array(eqCount).fill(0);

    // PT 0: Mốc k = 1 (ẩn alpha_2)
    diagArr[0] = (h[0] + h[1]) / 3;
    upperArr[0] = h[1] / 6;
    rhsArr[0] = (Y[2] - Y[1]) / h[1] - (Y[1] - Y[0]) / h[0] - (h[0] / 6) * b1;

    // PT 1 .. n-3: Mốc trong (eq tương ứng k = eq + 1)
    for (let eq = 1; eq < eqCount - 1; eq++) {
      const k = eq + 1;
      const hk_prev = h[k - 1];
      const hk = h[k];
      lowerArr[eq] = hk_prev / 6;
      diagArr[eq] = (hk_prev + hk) / 3;
      upperArr[eq] = hk / 6;
      rhsArr[eq] = (Y[k + 1] - Y[k]) / hk - (Y[k] - Y[k - 1]) / hk_prev;
    }

    // PT n-2: Biên tại x_n
    const lastEq = eqCount - 1;
    const lastH = h[nNodes - 2];
    lowerArr[lastEq] = lastH / 6;
    diagArr[lastEq] = lastH / 3;
    rhsArr[lastEq] = b2 - (Y[nNodes - 1] - Y[nNodes - 2]) / lastH;

    const sysTable: Record<string, unknown>[] = [];
    for (let eq = 0; eq < eqCount; eq++) {
      sysTable.push({
        "PT": `$${eq + 1}$`,
        [`$\\alpha_{${eq + 1}}$`]: eq > 0 ? `$${fmtNum(lowerArr[eq])}$` : "biên",
        [`$\\alpha_{${eq + 2}}$`]: `$${fmtNum(diagArr[eq])}$`,
        [`$\\alpha_{${eq + 3}}$`]: eq < eqCount - 1 ? `$${fmtNum(upperArr[eq])}$` : "—",
        "Vế phải": `$${fmtNum(rhsArr[eq])}$`,
      });
    }
    logger.table(sysTable);

    logger.section("THUẬT TOÁN THOMAS — BẢNG ĐẠO HÀM CẤP HAI");
    let alphaSuffix: number[];
    try {
      alphaSuffix = solveThomas(lowerArr, diagArr, upperArr, rhsArr);
    } catch (e) {
      logger.error(`Hệ ba đường chéo suy biến: ${(e as Error).message}`);
      return;
    }
    alpha = [b1, ...alphaSuffix];
  }

  const alphaTable = alpha.map((a, i) => {
    let source = "Thuật toán Thomas";
    if (boundaryType3 === "second") {
      if (i === 0) source = "Điều kiện biên: S''(x_1)";
      if (i === nNodes - 1) source = "Điều kiện biên: S''(x_n)";
    } else if (boundaryType3 === "clamped") {
      if (i === 0) source = "Thuật toán Thomas (biên S'(x_1))";
      if (i === nNodes - 1) source = "Thuật toán Thomas (biên S'(x_n))";
    } else if (boundaryType3 === "clamped_second") {
      if (i === 0) source = "Thuật toán Thomas (biên S'(x_1))";
      if (i === nNodes - 1) source = "Điều kiện biên: S''(x_n)";
    } else if (boundaryType3 === "second_clamped") {
      if (i === 0) source = "Điều kiện biên: S''(x_1)";
      if (i === nNodes - 1) source = "Thuật toán Thomas (biên S'(x_n))";
    }
    return {
      "$k$": `$${i + 1}$`,
      "$\\alpha_k = S''(x_k)$": `$${fmtNum(a)}$`,
      "Nguồn": source,
    };
  });
  logger.table(alphaTable);

  logger.section("HỆ SỐ ĐA THỨC BẬC BA (p = 3)");
  logger.formula(`$$\\text{Dạng cục bộ: } S_k(x) = y_k + B_k(x - x_k) + C_k(x - x_k)^2 + D_k(x - x_k)^3$$`);
  logger.formula(`$$B_k = \\frac{y_{k+1}-y_k}{h_k} - \\frac{2\\alpha_k + \\alpha_{k+1}}{6}h_k, \\quad C_k = \\frac{\\alpha_k}{2}, \\quad D_k = \\frac{\\alpha_{k+1}-\\alpha_k}{6h_k}$$`);
  logger.formula(`$$\\text{Dạng chính tắc: } S_k(x) = a_k x^3 + b_k x^2 + c_k x + d_k$$`);
  logger.formula(`$$a_k = \\frac{\\alpha_{k+1}-\\alpha_k}{6h_k}, \\quad b_k = \\frac{3\\alpha_k x_{k+1}-3\\alpha_{k+1}x_k}{6h_k}$$`);
  logger.formula(`$$c_k = \\frac{-3\\alpha_k x_{k+1}^2+3\\alpha_{k+1}x_k^2}{6h_k}+\\frac{y_{k+1}-y_k}{h_k}-\\frac{(\\alpha_{k+1}-\\alpha_k)h_k}{6}$$`);
  logger.formula(`$$d_k = \\frac{\\alpha_k x_{k+1}^3-\\alpha_{k+1}x_k^3}{6h_k}+\\frac{y_k x_{k+1}-y_{k+1}x_k}{h_k}+\\frac{(\\alpha_{k+1}x_k-\\alpha_k x_{k+1})h_k}{6}$$`);

  interface SplinePiece {
    a: number; b: number; c: number; d: number;
    B: number; C: number; D: number;
  }
  const pieces: SplinePiece[] = [];
  const coefTable: Record<string, unknown>[] = [];

  for (let k = 0; k < intervals; k++) {
    const al = alpha[k], al1 = alpha[k + 1];
    const xk = X[k], xk1 = X[k + 1];
    const yk = Y[k], yk1 = Y[k + 1];
    const hk = h[k];
    const dkSlope = (yk1 - yk) / hk;

    const Bk = dkSlope - ((2 * al + al1) / 6) * hk;
    const Ck = al / 2;
    const Dk = (al1 - al) / (6 * hk);

    const ak = (al1 - al) / (6 * hk);
    const bk = (3 * al * xk1 - 3 * al1 * xk) / (6 * hk);
    const ck = (-3 * al * xk1 ** 2 + 3 * al1 * xk ** 2) / (6 * hk)
      + dkSlope - (al1 - al) * hk / 6;
    const dkConst = (al * xk1 ** 3 - al1 * xk ** 3) / (6 * hk)
      + (yk * xk1 - yk1 * xk) / hk + (al1 * xk - al * xk1) * hk / 6;

    pieces.push({ a: ak, b: bk, c: ck, d: dkConst, B: Bk, C: Ck, D: Dk });
    coefTable.push({
      "$k$": `$${k + 1}$`,
      "Đoạn": `$[${fmtNum(xk)}, ${fmtNum(xk1)}]$`,
      "$B_k$": `$${fmtNum(Bk)}$`,
      "$C_k$": `$${fmtNum(Ck)}$`,
      "$D_k$": `$${fmtNum(Dk)}$`,
      "$a_k$": `$${fmtNum(ak)}$`,
      "$b_k$": `$${fmtNum(bk)}$`,
      "$c_k$": `$${fmtNum(ck)}$`,
      "$d_k$": `$${fmtNum(dkConst)}$`,
      "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * xk ** 3 + bk * xk ** 2 + ck * xk + dkConst)}$ (kỳ vọng $${fmtNum(yk)}$)`,
    });
  }
  logger.table(coefTable);

  logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 3)");
  for (let k = 0; k < intervals; k++) {
    const p = pieces[k];
    const taylorStr = fmtTaylor(Y[k], [
      { pow: 1, val: p.B },
      { pow: 2, val: p.C },
      { pow: 3, val: p.D },
    ], X[k]);
    const canonStr = fmtPolyCubic(p.a, p.b, p.c, p.d);
    logger.result(
      `$$S_{${k + 1}}(x) = ${taylorStr} = ${canonStr} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
    );
  }

  if (Number.isFinite(xStar)) {
    if (xStar < X[0] || xStar > X[nNodes - 1]) {
      logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
      return;
    }
    const k = findInterval(X, xStar);
    const p = pieces[k];
    const dx = xStar - X[k];
    const val = p.a * xStar ** 3 + p.b * xStar ** 2 + p.c * xStar + p.d;
    const d1 = p.B + 2 * p.C * dx + 3 * p.D * dx ** 2;
    const d2 = 2 * p.C + 6 * p.D * dx;
    logger.section("GIÁ TRỊ VÀ ĐẠO HÀM TẠI ĐIỂM NỘI SUY");
    logger.info(`Điểm $x^* = ${fmtNum(xStar)}$ thuộc đoạn $[x_{${k + 1}}, x_{${k + 2}}] = [${fmtNum(X[k])}, ${fmtNum(X[k + 1])}]$, sử dụng đa thức $S_{${k + 1}}(x)$.`);
    logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
    logger.result(`$$S'(${fmtNum(xStar)}) = S'_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(d1)}$$`);
    logger.result(`$$S''(${fmtNum(xStar)}) = S''_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(d2)}$$`);
  }
}
