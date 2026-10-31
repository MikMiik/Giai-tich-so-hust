import { all, create } from "mathjs";
import type { Logger } from "@/types/solver";
import { fmtMat, fmtNum, parseCoeffs } from "./math-utils";
import { solveLinearSystem } from "./linear-solve";

const math = create(all);
type FitType = "general" | "power" | "exponential";

function readBasis(expressions: string): { raw: string; evaluate: (x: number) => number }[] {
  return expressions.split(/\r?\n|;/).map((value) => value.trim()).filter(Boolean).map((raw) => {
    const compiled = math.compile(raw);
    return { raw, evaluate: (x) => Number(compiled.evaluate({ x })) };
  });
}

function vector(values: number[]): string {
  return `\\begin{bmatrix}${values.map((value) => fmtNum(value)).join(" \\\\ ")}\\end{bmatrix}`;
}

export function runLeastSquares(params: Record<string, string>, logger: Logger): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const type = (params.fitType || "general") as FitType;
  if (X.length < 2 || X.length !== Y.length) {
    logger.error("Hai dãy X, Y phải cùng độ dài và có ít nhất 2 điểm.");
    return;
  }

  let basis: { raw: string; evaluate: (x: number) => number }[];
  let target = [...Y];
  try {
    if (type === "power") {
      if (X.some((x) => x <= 0) || Y.some((y) => y <= 0)) throw new Error("Dạng lũy thừa yêu cầu mọi x_i và y_i dương.");
      basis = [{ raw: "1", evaluate: () => 1 }, { raw: "ln(x)", evaluate: (x) => Math.log(x) }];
      target = Y.map((y) => Math.log(y));
    } else if (type === "exponential") {
      if (Y.some((y) => y <= 0)) throw new Error("Dạng mũ yêu cầu mọi y_i dương.");
      const nonlinearBasis = readBasis(params.basis);
      if (nonlinearBasis.length !== 2) throw new Error("Dạng mũ cần đúng hai hàm cơ sở φ₁, φ₂.");
      basis = [{ raw: "1", evaluate: () => 1 }, ...nonlinearBasis];
      target = Y.map((y) => Math.log(y));
    } else {
      basis = readBasis(params.basis);
      if (!basis.length) throw new Error("Cần nhập ít nhất một hàm cơ sở.");
    }
  } catch (error) {
    logger.error((error as Error).message);
    return;
  }
  if (basis.length > X.length) {
    logger.error("Số hàm cơ sở m không được vượt quá số điểm dữ liệu n.");
    return;
  }

  let phi: number[][];
  try {
    phi = X.map((x) => basis.map((item) => item.evaluate(x)));
    if (phi.flat().some((value) => !Number.isFinite(value))) throw new Error("Hàm cơ sở không cho giá trị hữu hạn tại các mốc X.");
  } catch (error) {
    logger.error(`Không tính được hàm cơ sở: ${(error as Error).message}`);
    return;
  }

  const m = basis.length;
  const M = Array.from({ length: m }, (_, row) =>
    Array.from({ length: m }, (_, col) => phi.reduce((sum, values) => sum + values[row] * values[col], 0)),
  );
  const b = Array.from({ length: m }, (_, col) => phi.reduce((sum, values, row) => sum + values[col] * target[row], 0));
  let coefficients: number[];
  try {
    coefficients = solveLinearSystem(M, b);
  } catch (error) {
    logger.error(`Không giải được phương trình chuẩn: ${(error as Error).message}`);
    return;
  }

  logger.section("DỮ LIỆU VÀ HÀM CƠ SỞ");
  logger.formula(`$$n=${X.length},\\quad m=${m},\\quad \\{\\varphi_j\\} = \\{${basis.map((item) => item.raw).join(", ")}\\}$$`);
  if (type === "power") logger.formula("$$X^*=\\ln X,\\quad Y^*=\\ln Y,\\quad \\ln y=a_0+b\\ln x$$");
  if (type === "exponential") logger.formula("$$Y^*=\\ln Y,\\quad a_0=\\ln a,\\quad \\ln y=a_0+b_1\\varphi_1(x)+b_2\\varphi_2(x)$$");

  logger.section("MA TRẬN THIẾT KẾ Φ");
  logger.formula(`$$\\Phi_{ij}=\\varphi_j(x_i),\\quad \\Phi=${fmtMat(phi)}$$`);
  logger.section("PHƯƠNG TRÌNH CHUẨN");
  logger.formula(`$$M=\\Phi^T\\Phi=${fmtMat(M)},\\quad b=\\Phi^T${type === "general" ? "Y" : "Y^*"}=${vector(b)}$$`);
  logger.formula(`$$M\\mathbf{a}=b,\\quad \\mathbf{a}=${vector(coefficients)}$$`);

  const fitted = phi.map((values) => values.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const output = type === "general" ? fitted : fitted.map((value) => Math.exp(value));
  const residuals = output.map((value, index) => value - Y[index]);
  const ssd = residuals.reduce((sum, value) => sum + value * value, 0);
  const rmse = Math.sqrt(ssd / X.length);

  logger.section("HÀM XẤP XỈ VÀ SAI SỐ");
  if (type === "power") {
    logger.result(`$$g(x)=${fmtNum(Math.exp(coefficients[0]))}x^{${fmtNum(coefficients[1])}}$$`);
  } else if (type === "exponential") {
    logger.result(`$$g(x)=${fmtNum(Math.exp(coefficients[0]))}e^{${fmtNum(coefficients[1])}(${basis[1].raw})+${fmtNum(coefficients[2])}(${basis[2].raw})}$$`);
  } else {
    logger.result(`$$g(x)=${coefficients.map((value, index) => `${index ? "+" : ""}${fmtNum(value)}(${basis[index].raw})`).join("")}$$`);
  }
  logger.table(X.map((x, index) => ({ "$x_i$": `$${fmtNum(x)}$`, "$y_i$": `$${fmtNum(Y[index])}$`, "$\\hat y_i$": `$${fmtNum(output[index])}$`, "$e_i$": `$${fmtNum(residuals[index])}$` })));
  logger.result(`$$S=E^TE=${fmtNum(ssd)},\\quad \\sigma=\\sqrt{S/n}=${fmtNum(rmse)}$$`);
}
