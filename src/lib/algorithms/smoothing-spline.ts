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
  const b1 = parseFraction(params.boundary1 || "0");
  const b2 = parseFraction(params.boundary2 || "0");

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
  if (degree >= 2 && !Number.isFinite(b1)) {
    logger.error("Cần nhập điều kiện biên $b_1$ hợp lệ.");
    return;
  }
  if (degree === 3) {
    if (!Number.isFinite(b2)) {
      logger.error("Spline bậc 3 cần 2 điều kiện biên $\\alpha_1, \\alpha_n$.");
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
    logger.formula(`$$S_k(x) = a_k x + b_k, \\quad a_k = \\frac{y_{k+1}-y_k}{h_k}, \\quad b_k = y_k - a_k x_k$$`);

    const aArr: number[] = [], bArr: number[] = [];
    const coefTable: Record<string, unknown>[] = [];
    for (let k = 0; k < intervals; k++) {
      const ak = (Y[k + 1] - Y[k]) / h[k];
      const bk = Y[k] - ak * X[k];
      aArr.push(ak); bArr.push(bk);
      coefTable.push({
        "$k$": `$${k + 1}$`,
        "$a_k$": `$${fmtNum(ak)}$`,
        "$b_k$": `$${fmtNum(bk)}$`,
        "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * X[k] + bk)}$ (kỳ vọng $${fmtNum(Y[k])}$)`,
      });
    }
    logger.table(coefTable);

    logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 1)");
    for (let k = 0; k < intervals; k++) {
      logger.result(
        `$$S_{${k + 1}}(x) = ${fmtPolyLinear(aArr[k], bArr[k])} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
      );
    }

    if (Number.isFinite(xStar)) {
      if (xStar < X[0] || xStar > X[nNodes - 1]) {
        logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
        return;
      }
      const k = findInterval(X, xStar);
      const val = aArr[k] * xStar + bArr[k];
      logger.section("GIÁ TRỊ TẠI ĐIỂM NỘI SUY");
      logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
    }
    return;
  }

  // ── p = 2: Spline bậc 2 với đệ quy tiến ────────────────
  if (degree === 2) {
    logger.section("ĐỆ QUY TIẾN TÌM ĐẠO HÀM m_k (p = 2)");
    logger.formula(`$$m_1 = ${fmtNum(b1)} \\;(\\text{điều kiện biên}), \\quad m_{k+1} = \\frac{2(y_{k+1}-y_k)}{h_k} - m_k$$`);

    const m: number[] = [b1];
    const mTable: Record<string, unknown>[] = [{ "$k$": "$1$", "$m_k = S'(x_k)$": `$${fmtNum(b1)}$`, "Nguồn": "Điều kiện biên" }];
    for (let k = 0; k < intervals; k++) {
      const mk1 = 2 * (Y[k + 1] - Y[k]) / h[k] - m[k];
      m.push(mk1);
      mTable.push({
        "$k$": `$${k + 2}$`,
        "$m_k = S'(x_k)$": `$${fmtNum(mk1)}$`,
        "Nguồn": `$\\frac{2 \\cdot ${fmtNum(Y[k + 1] - Y[k])}}{${fmtNum(h[k])}} - ${fmtNum(m[k])} = ${fmtNum(mk1)}$`,
      });
    }
    logger.table(mTable);

    logger.section("HỆ SỐ ĐA THỨC BẬC HAI (p = 2)");
    logger.formula(`$$a_k = \\frac{m_{k+1}-m_k}{2h_k}, \\quad b_k = \\frac{m_k x_{k+1}-m_{k+1}x_k}{h_k}, \\quad c_k = \\frac{-m_k x_{k+1}^2+m_{k+1}x_k^2}{2h_k}+y_k+\\frac{m_k h_k}{2}$$`);

    const aArr: number[] = [], bArr: number[] = [], cArr: number[] = [];
    const coefTable: Record<string, unknown>[] = [];
    for (let k = 0; k < intervals; k++) {
      const ak = (m[k + 1] - m[k]) / (2 * h[k]);
      const bk = (m[k] * X[k + 1] - m[k + 1] * X[k]) / h[k];
      const ck = (-m[k] * X[k + 1] ** 2 + m[k + 1] * X[k] ** 2) / (2 * h[k]) + Y[k] + m[k] * h[k] / 2;
      aArr.push(ak); bArr.push(bk); cArr.push(ck);
      coefTable.push({
        "$k$": `$${k + 1}$`,
        "$a_k$": `$${fmtNum(ak)}$`,
        "$b_k$": `$${fmtNum(bk)}$`,
        "$c_k$": `$${fmtNum(ck)}$`,
        "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * X[k] ** 2 + bk * X[k] + ck)}$`,
      });
    }
    logger.table(coefTable);

    logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 2)");
    for (let k = 0; k < intervals; k++) {
      logger.result(
        `$$S_{${k + 1}}(x) = ${fmtPolyQuadratic(aArr[k], bArr[k], cArr[k])} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
      );
    }

    if (Number.isFinite(xStar)) {
      if (xStar < X[0] || xStar > X[nNodes - 1]) {
        logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
        return;
      }
      const k = findInterval(X, xStar);
      const val = aArr[k] * xStar ** 2 + bArr[k] * xStar + cArr[k];
      logger.section("GIÁ TRỊ TẠI ĐIỂM NỘI SUY");
      logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
    }
    return;
  }

  // ── p = 3: Spline bậc 3 với thuật toán Thomas ───────────
  logger.section("HỆ PHƯƠNG TRÌNH BA ĐƯỜNG CHÉO (p = 3)");
  logger.formula(
    `$$\\frac{h_k}{6}\\alpha_k + \\frac{h_k+h_{k+1}}{3}\\alpha_{k+1} + \\frac{h_{k+1}}{6}\\alpha_{k+2} = \\frac{y_{k+2}-y_{k+1}}{h_{k+1}} - \\frac{y_{k+1}-y_k}{h_k}, \\quad k=1,\\ldots,n-2$$`,
  );
  logger.info(`Điều kiện biên: $\\alpha_1 = ${fmtNum(b1)}$, $\\alpha_n = ${fmtNum(b2)}$. Giải cho $\\alpha_2, \\ldots, \\alpha_{n-1}$.`);

  // eqCount = nNodes - 2 ẩn số (alpha[1..nNodes-2])
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

  // Log hệ phương trình
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
  const alpha: number[] = [b1, ...alphaInner, b2];
  const alphaTable = alpha.map((a, i) => ({
    "$k$": `$${i + 1}$`,
    "$\\alpha_k = S''(x_k)$": `$${fmtNum(a)}$`,
    "Nguồn": i === 0 || i === nNodes - 1 ? "Điều kiện biên" : "Thuật toán Thomas",
  }));
  logger.table(alphaTable);

  logger.section("HỆ SỐ ĐA THỨC BẬC BA (p = 3)");
  logger.formula(`$$a_k=\\frac{\\alpha_{k+1}-\\alpha_k}{6h_k},\\quad b_k=\\frac{3\\alpha_k x_{k+1}-3\\alpha_{k+1}x_k}{6h_k}$$`);
  logger.formula(`$$c_k=\\frac{-3\\alpha_k x_{k+1}^2+3\\alpha_{k+1}x_k^2}{6h_k}+\\frac{y_{k+1}-y_k}{h_k}-\\frac{(\\alpha_{k+1}-\\alpha_k)h_k}{6}$$`);
  logger.formula(`$$d_k=\\frac{\\alpha_k x_{k+1}^3-\\alpha_{k+1}x_k^3}{6h_k}+\\frac{y_k x_{k+1}-y_{k+1}x_k}{h_k}+\\frac{(\\alpha_{k+1}x_k-\\alpha_k x_{k+1})h_k}{6}$$`);

  interface SplinePiece { a: number; b: number; c: number; d: number }
  const pieces: SplinePiece[] = [];
  const coefTable: Record<string, unknown>[] = [];

  for (let k = 0; k < intervals; k++) {
    const al = alpha[k], al1 = alpha[k + 1];
    const xk = X[k], xk1 = X[k + 1];
    const yk = Y[k], yk1 = Y[k + 1];
    const hk = h[k];

    const ak = (al1 - al) / (6 * hk);
    const bk = (3 * al * xk1 - 3 * al1 * xk) / (6 * hk);
    const ck = (-3 * al * xk1 ** 2 + 3 * al1 * xk ** 2) / (6 * hk)
      + (yk1 - yk) / hk - (al1 - al) * hk / 6;
    const dk = (al * xk1 ** 3 - al1 * xk ** 3) / (6 * hk)
      + (yk * xk1 - yk1 * xk) / hk + (al1 * xk - al * xk1) * hk / 6;

    pieces.push({ a: ak, b: bk, c: ck, d: dk });
    coefTable.push({
      "$k$": `$${k + 1}$`,
      "$a_k$": `$${fmtNum(ak)}$`,
      "$b_k$": `$${fmtNum(bk)}$`,
      "$c_k$": `$${fmtNum(ck)}$`,
      "$d_k$": `$${fmtNum(dk)}$`,
      "Kiểm tra $S_k(x_k)$": `$${fmtNum(ak * xk ** 3 + bk * xk ** 2 + ck * xk + dk)}$`,
    });
  }
  logger.table(coefTable);

  logger.section("CÁC ĐA THỨC GHÉP TRƠN (p = 3)");
  for (let k = 0; k < intervals; k++) {
    const { a, b, c, d } = pieces[k];
    logger.result(
      `$$S_{${k + 1}}(x) = ${fmtPolyCubic(a, b, c, d)} \\quad x \\in [${fmtNum(X[k])},\\,${fmtNum(X[k + 1])}]$$`,
    );
  }

  if (Number.isFinite(xStar)) {
    if (xStar < X[0] || xStar > X[nNodes - 1]) {
      logger.warn(`$x^* = ${fmtNum(xStar)}$ nằm ngoài miền $[${fmtNum(X[0])}, ${fmtNum(X[nNodes - 1])}]$.`);
      return;
    }
    const k = findInterval(X, xStar);
    const { a, b, c, d } = pieces[k];
    const val = a * xStar ** 3 + b * xStar ** 2 + c * xStar + d;
    logger.section("GIÁ TRỊ TẠI ĐIỂM NỘI SUY");
    logger.result(`$$S(${fmtNum(xStar)}) = S_{${k + 1}}(${fmtNum(xStar)}) = ${fmtNum(val)}$$`);
  }
}
