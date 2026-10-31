import type { Logger } from "@/types/solver";
import { fmtNum, parseCoeffs, parseFraction } from "./math-utils";
import { solveLinearSystem } from "./linear-solve";

function falling(power: number, order: number): number {
  let value = 1;
  for (let i = 0; i < order; i++) value *= power - i;
  return value;
}

function evalDerivative(coefficients: number[], u: number, order: number): number {
  return coefficients.reduce((sum, coefficient, power) => power < order ? sum : sum + coefficient * falling(power, order) * u ** (power - order), 0);
}

export function runSmoothingSpline(params: Record<string, string>, logger: Logger): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const degree = Number.parseInt(params.degree, 10);
  const xStar = params.xVal?.trim() ? parseFraction(params.xVal) : NaN;
  const boundary = [params.boundary1, params.boundary2, params.boundary3].map((value) => parseFraction(value || "0"));
  if (!Number.isInteger(degree) || degree < 1 || degree > 4) {
    logger.error("Bậc spline p phải là một số nguyên từ 1 đến 4.");
    return;
  }
  if (X.length < 2 || X.length !== Y.length || X.some((value, index) => index > 0 && value <= X[index - 1])) {
    logger.error("Cần ít nhất 2 mốc, hai dãy cùng độ dài và X tăng nghiêm ngặt.");
    return;
  }
  if (boundary.some((value) => !Number.isFinite(value))) {
    logger.error("Các điều kiện biên phải là số hợp lệ.");
    return;
  }

  const intervals = X.length - 1;
  const h = X.slice(0, -1).map((value, index) => X[index + 1] - value);
  const width = degree + 1;
  const unknowns = intervals * width;
  const matrix: number[][] = [];
  const rhs: number[] = [];
  const addEquation = (terms: { interval: number; power: number; value: number }[], value: number) => {
    const row = Array(unknowns).fill(0);
    terms.forEach((term) => { row[term.interval * width + term.power] = term.value; });
    matrix.push(row); rhs.push(value);
  };

  for (let k = 0; k < intervals; k++) {
    addEquation([{ interval: k, power: 0, value: 1 }], Y[k]);
    addEquation(Array.from({ length: width }, (_, power) => ({ interval: k, power, value: h[k] ** power })), Y[k + 1]);
  }
  for (let k = 0; k < intervals - 1; k++) {
    for (let order = 1; order < degree; order++) {
      addEquation([
        ...Array.from({ length: width - order }, (_, index) => ({ interval: k, power: index + order, value: falling(index + order, order) * h[k] ** index })),
        { interval: k + 1, power: order, value: -falling(order, order) },
      ], 0);
    }
  }
  for (let order = 1; order < degree; order++) addEquation([{ interval: 0, power: order, value: falling(order, order) }], boundary[order - 1]);

  let solution: number[];
  try { solution = solveLinearSystem(matrix, rhs); } catch (error) {
    logger.error(`Không giải được hệ hệ số spline: ${(error as Error).message}`); return;
  }
  const pieces = Array.from({ length: intervals }, (_, index) => solution.slice(index * width, (index + 1) * width));

  logger.section("BƯỚC LƯỚI VÀ ĐIỀU KIỆN BIÊN");
  logger.formula(`$$h_k=x_{k+1}-x_k=[${h.map((value) => fmtNum(value)).join(", ")}]$$`);
  if (degree > 1) logger.formula(`$$S^{(r)}(x_1)=[${boundary.slice(0, degree - 1).map((value) => fmtNum(value)).join(", ")}]\\quad(r=1,\\ldots,${degree - 1})$$`);
  logger.section("HỆ PHƯƠNG TRÌNH HỆ SỐ");
  if (degree === 1) logger.formula("$$a_k=\\frac{y_{k+1}-y_k}{h_k},\\quad b_k=y_k-a_kx_k$$");
  if (degree === 2) logger.formula("$$m_k+m_{k+1}=\\frac{2(y_{k+1}-y_k)}{h_k},\\quad m_k=S'(x_k)$$");
  if (degree === 3) logger.formula("$$\\frac{h_k}{6}\\alpha_k+\\frac{h_k+h_{k+1}}{3}\\alpha_{k+1}+\\frac{h_{k+1}}{6}\\alpha_{k+2}=\\frac{y_{k+2}-y_{k+1}}{h_{k+1}}-\\frac{y_{k+1}-y_k}{h_k}$$");
  if (degree === 4) logger.formula("$$S_k\\in\\Pi_4,\\quad S\\in C^3;\\quad \\text{giải hệ các điều kiện nội suy, trơn cấp 3 và biên}$$");
  logger.formula(`$$S_k(x)=\\sum_{r=0}^{${degree}}c_{k,r}(x-x_k)^r,\\quad S_k(x_k)=y_k,\\quad S_k(x_{k+1})=y_{k+1}$$`);
  if (degree > 1) logger.formula(`$$S_k^{(r)}(x_{k+1})=S_{k+1}^{(r)}(x_{k+1})\\quad(r=1,\\ldots,${degree - 1})$$`);
  logger.formula(`$$A\\mathbf{c}=d,\\quad A\\in\\mathbb{R}^{${unknowns}\\times${unknowns}}$$`);

  logger.section("CÁC ĐA THỨC GHÉP TRƠN");
  if (degree === 1) {
    logger.table(pieces.map((piece, index) => ({ "$k$": `$${index + 1}$`, "$a_k$": `$${fmtNum(piece[1])}$`, "$b_k$": `$${fmtNum(piece[0] - piece[1] * X[index])}$` })));
  }
  const powerTerm = (coefficient: number, power: number, origin: number) => `${coefficient >= 0 && power > 0 ? "+" : ""}${fmtNum(coefficient)}${power ? `(x-${fmtNum(origin)})${power > 1 ? `^${power}` : ""}` : ""}`;
  pieces.forEach((piece, index) => logger.result(`$$S_${index + 1}(x)=${piece.map((value, power) => powerTerm(value, power, X[index])).join("")}\\quad [${fmtNum(X[index])},${fmtNum(X[index + 1])}]$$`));

  if (Number.isFinite(xStar)) {
    if (xStar < X[0] || xStar > X.at(-1)!) { logger.warn("x* nằm ngoài miền các mốc nên không nội suy."); return; }
    const index = Math.min(intervals - 1, X.findIndex((value, i) => i < intervals && xStar <= X[i + 1]));
    const value = evalDerivative(pieces[index], xStar - X[index], 0);
    logger.section("GIÁ TRỊ TẠI x*");
    logger.result(`$$S(${fmtNum(xStar)})=S_${index + 1}(${fmtNum(xStar)})=${fmtNum(value)}$$`);
  }
}
