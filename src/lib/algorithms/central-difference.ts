import { fmtNum, parseCoeffs, parseFraction } from "./math-utils";
import type { Logger } from "@/types/solver";

export function buildForwardDifferenceTable(values: number[]): number[][] {
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

export function factorial(value: number): number {
  let result = 1;
  for (let i = 2; i <= value; i++) result *= i;
  return result;
}

export interface CentralInput {
  X: number[];
  Y: number[];
  xStar: number;
  center: number;
  h: number;
}

export function parseCentralInput(
  params: Record<string, string>,
  logger: Logger,
  centerField: string,
): CentralInput | null {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const xStar = parseFraction(params.xVal);
  let center = Number.parseInt(params[centerField], 10);
  if (!Number.isInteger(center)) {
    // Mặc định tự động tính tâm:
    // Stirling: phần tử chính giữa mảng lẻ
    // Bessel: mốc trái của cặp giữa mảng chẵn
    center = centerField === "centerLeftIndex" ? Math.floor(X.length / 2) - 1 : Math.floor(X.length / 2);
  }

  if (X.length < 3 || X.length !== Y.length) {
    logger.error("Cần ít nhất 3 mốc và hai dãy X, Y phải có cùng số phần tử.");
    return null;
  }
  if (!Number.isFinite(xStar) || center < 0 || center >= X.length) {
    logger.error("Điểm x* hoặc chỉ số mốc trung tâm không hợp lệ.");
    return null;
  }
  const h = X[1] - X[0];
  if (Math.abs(h) < 1e-12 || X.some((x, i) => i > 0 && Math.abs((x - X[i - 1]) - h) > Math.abs(h) * 1e-8)) {
    logger.error("Các mốc X phải cách đều với bước lưới h khác 0.");
    return null;
  }
  return { X, Y, xStar, center, h };
}

export function logCentralDifferenceTable(
  logger: Logger,
  X: number[],
  Y: number[],
  delta: number[][],
  center: number,
): void {
  const table = X.map((x, row) => {
    const item: Record<string, unknown> = {
      "$i$": `$${row - center}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[row])}$`,
    };
    for (let order = 1; order < X.length; order++) {
      item[`$\\Delta^{${order}}y$`] = row < X.length - order ? `$${fmtNum(delta[row][order])}$` : "—";
    }
    return item;
  });
  logger.table(table);
}
