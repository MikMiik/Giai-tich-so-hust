import type { Logger } from "@/types/solver";
import { fmtNum, parseCoeffs, parseFraction } from "./math-utils";

type Direction = "forward" | "backward";

function buildDifferenceTable(values: number[]): number[][] {
  const count = values.length;
  const delta = Array.from({ length: count }, () => Array(count).fill(0));
  for (let i = 0; i < count; i++) delta[i][0] = values[i];
  for (let order = 1; order < count; order++) {
    for (let row = 0; row < count - order; row++) {
      delta[row][order] = delta[row + 1][order - 1] - delta[row][order - 1];
    }
  }
  return delta;
}

function factorLabel(shift: number): string {
  if (shift === 0) return "t";
  return shift > 0 ? `(t + ${shift})` : `(t - ${Math.abs(shift)})`;
}

export function runGaussCentral(
  params: Record<string, string>,
  logger: Logger,
  direction: Direction,
): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const xStar = parseFraction(params.xVal);
  const center = Number.parseInt(params.centerIndex, 10);
  const degree = Number.parseInt(params.degree, 10);

  if (X.length < 3 || X.length !== Y.length) {
    logger.error("Cần ít nhất 3 mốc và hai dãy X, Y phải có cùng số phần tử.");
    return;
  }
  if (!Number.isFinite(xStar) || !Number.isInteger(center) || !Number.isInteger(degree)) {
    logger.error("Điểm x*, chỉ số mốc trung tâm và bậc nội suy không hợp lệ.");
    return;
  }
  if (degree < 1 || degree >= X.length || center < 0 || center >= X.length) {
    logger.error("Bậc phải từ 1 đến số mốc trừ 1; chỉ số mốc trung tâm phải thuộc bảng dữ liệu.");
    return;
  }

  const h = X[1] - X[0];
  if (Math.abs(h) < 1e-12 || X.some((x, i) => i > 0 && Math.abs((x - X[i - 1]) - h) > Math.abs(h) * 1e-8)) {
    logger.error("Các mốc X phải cách đều với bước lưới h khác 0.");
    return;
  }
  const radius = Math.ceil(degree / 2);
  if (center - radius < 0 || center + radius >= X.length) {
    logger.error(`Bậc ${degree} cần các mốc đối xứng quanh x_${center}; hãy chọn mốc trung tâm nằm cách mỗi biên ít nhất ${radius} vị trí.`);
    return;
  }

  const t = (xStar - X[center]) / h;
  if ((direction === "forward" && t < -1e-10) || (direction === "backward" && t > 1e-10)) {
    logger.warn(direction === "forward" ? "Gauss tiến thường dùng khi x* nằm về bên phải mốc trung tâm." : "Gauss lùi thường dùng khi x* nằm về bên trái mốc trung tâm.");
  }

  logger.section("ĐẦU VÀO");
  logger.formula(`$$x_0 = ${fmtNum(X[center])}, \\quad h = ${fmtNum(h)}, \\quad t = \\frac{x^*-x_0}{h} = ${fmtNum(t)}$$`);

  const delta = buildDifferenceTable(Y);
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  const table: Record<string, unknown>[] = X.map((x, row) => {
    const item: Record<string, unknown> = {
      "$i$": `$${row - center}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[row])}$`,
    };
    for (let order = 1; order <= degree; order++) {
      item[`$\\Delta^{${order}}y$`] = row < X.length - order ? `$${fmtNum(delta[row][order])}$` : "—";
    }
    return item;
  });
  logger.table(table);

  logger.section("TRÍCH XUẤT HỆ SỐ THEO CÔNG THỨC GAUSS");
  logger.formula(
    direction === "forward"
      ? "$$c_{2j-1}=\\Delta^{2j-1}y_{-(j-1)}, \\qquad c_{2j}=\\Delta^{2j}y_{-j}$$"
      : "$$c_{2j-1}=\\Delta^{2j-1}y_{-j}, \\qquad c_{2j}=\\Delta^{2j}y_{-j}$$",
  );
  const coeffs = [Y[center]];
  const rows: Record<string, unknown>[] = [{
    "$k$": "$0$",
    "Sai phân được lấy": "$y_0$",
    "$c_k$": `$${fmtNum(Y[center])}$`,
  }];
  const polynomialTerms = [`${fmtNum(Y[center])}`];

  let product = 1;
  let productDerivative = 0;
  let value = Y[center];
  let derivativeByT = 0;
  for (let k = 1; k <= degree; k++) {
    const j = Math.ceil(k / 2);
    const rowIndex = direction === "forward"
      ? center - (k % 2 === 1 ? j - 1 : j)
      : center - j;
    const coefficient = delta[rowIndex][k];
    coeffs.push(coefficient);

    const shift = direction === "forward"
      ? (k % 2 === 1 ? j - 1 : -j)
      : (k % 2 === 1 ? -(j - 1) : j);
    const factor = (t + shift) / k;
    const factorDerivative = 1 / k;
    productDerivative = productDerivative * factor + product * factorDerivative;
    product *= factor;
    value += coefficient * product;
    derivativeByT += coefficient * productDerivative;

    const shifts = Array.from({ length: k }, (_, index) => {
      const order = index + 1;
      const level = Math.ceil(order / 2);
      return direction === "forward"
        ? (order % 2 === 1 ? level - 1 : -level)
        : (order % 2 === 1 ? -(level - 1) : level);
    });
    const relativeRow = rowIndex - center;
    const source = `\\Delta^{${k}}y_{${relativeRow}}`;
    const numerator = shifts.map(factorLabel).join("");
    const term = `${source}\\frac{${numerator}}{${k}!}`;
    polynomialTerms.push(`+ ${term}`);

    rows.push({
      "$k$": `$${k}$`,
      "Sai phân được lấy": `$${source} = ${fmtNum(coefficient)}$`,
      "$c_k$": `$${fmtNum(coefficient)}$`,
    });
  }
  logger.table(rows);
  logger.result(`$$C = [${coeffs.map((value) => fmtNum(value)).join(", ")}]$$`);

  logger.section("ĐA THỨC GAUSS THEO BIẾN t");
  logger.formula(`$$P_${degree}(t) = ${polynomialTerms.join(" ")}$$`);
  logger.formula(`$$P_${degree}(${fmtNum(t)}) = ${fmtNum(value)}$$`);

  logger.section("KẾT QUẢ");
  logger.result(`$$P_${degree}(${fmtNum(xStar)}) = ${fmtNum(value)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{P'(t)}{h} = ${fmtNum(derivativeByT / h)}$$`);
}

export const runGaussForwardInterpolation = (params: Record<string, string>, logger: Logger) =>
  runGaussCentral(params, logger, "forward");

export const runGaussBackwardInterpolation = (params: Record<string, string>, logger: Logger) =>
  runGaussCentral(params, logger, "backward");
