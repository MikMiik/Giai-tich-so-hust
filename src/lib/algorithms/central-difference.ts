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

export interface StirlingSubarrayResult {
  X_full: number[];
  Y_full: number[];
  X_sub: number[];
  Y_sub: number[];
  k: number;
  initialK: number;
  m: number;
  x0: number;
  h: number;
  xStar: number;
}

export function extractStirlingSubarray(
  params: Record<string, string>,
  logger: Logger,
): StirlingSubarrayResult | null {
  const X_full = parseCoeffs(params.xList);
  const Y_full = parseCoeffs(params.yList);
  const xStar = parseFraction(params.xVal);

  if (X_full.length < 3 || X_full.length !== Y_full.length) {
    logger.error("Cần ít nhất 3 mốc và hai dãy X, Y phải có cùng số phần tử.");
    return null;
  }
  if (!Number.isFinite(xStar)) {
    logger.error("Vui lòng nhập điểm cần tính $x^*$ hợp lệ.");
    return null;
  }

  const h = X_full[1] - X_full[0];
  if (
    Math.abs(h) < 1e-12 ||
    X_full.some((x, i) => i > 0 && Math.abs(x - X_full[i - 1] - h) > Math.abs(h) * 1e-8)
  ) {
    logger.error("Các mốc X phải cách đều với bước lưới h khác 0.");
    return null;
  }

  const N_full = X_full.length;
  const N = N_full - 1; // Chỉ số cuối cùng 0..N

  // Parse số mốc cần lấy N_mốc = 2m + 1 (số lẻ)
  let requestedNodes = Number.parseInt(params.nodeCount || "", 10);
  if (!Number.isInteger(requestedNodes) || requestedNodes <= 0) {
    // Mặc định: nếu mảng lẻ lấy toàn bộ; nếu mảng chẵn lấy N_full - 1 hoặc tối thiểu 5 nếu có đủ
    requestedNodes = N_full % 2 === 1 ? N_full : Math.max(3, N_full - 1);
  }

  if (requestedNodes % 2 === 0) {
    logger.error(`Thuật toán Stirling yêu cầu số mốc $N_{mốc} = 2m + 1$ là số lẻ. Đã nhận: ${requestedNodes}.`);
    return null;
  }
  if (requestedNodes < 3) {
    logger.error("Cần ít nhất 3 mốc để nội suy Stirling ($m \\ge 1$).");
    return null;
  }
  if (requestedNodes > N_full) {
    logger.error(
      `Số mốc yêu cầu $N_{mốc} = ${requestedNodes}$ vượt quá tổng số mốc dữ liệu $N_{full} = ${N_full}$.`,
    );
    return null;
  }

  const m = (requestedNodes - 1) / 2;

  // Bước 1: Tìm chỉ số k sao cho |x* - X_full[k]| nhỏ nhất
  let initialK = 0;
  let minDiff = Math.abs(xStar - X_full[0]);
  for (let i = 1; i < N_full; i++) {
    const diff = Math.abs(xStar - X_full[i]);
    if (diff < minDiff) {
      minDiff = diff;
      initialK = i;
    }
  }

  // Xử lý biên: k = max(m, min(N - m, k))
  const k = Math.max(m, Math.min(N - m, initialK));
  const x0 = X_full[k];

  // Trích xuất 2m + 1 mốc đối xứng quanh x0: X_full[k-m ... k+m]
  const X_sub = X_full.slice(k - m, k + m + 1);
  const Y_sub = Y_full.slice(k - m, k + m + 1);

  return {
    X_full,
    Y_full,
    X_sub,
    Y_sub,
    k,
    initialK,
    m,
    x0,
    h,
    xStar,
  };
}

export interface BesselSubarrayResult {
  X_full: number[];
  Y_full: number[];
  X_sub: number[];
  Y_sub: number[];
  k: number;
  initialK: number;
  m: number;
  x0: number;
  x1: number;
  h: number;
  xStar: number;
}

export function extractBesselSubarray(
  params: Record<string, string>,
  logger: Logger,
): BesselSubarrayResult | null {
  const X_full = parseCoeffs(params.xList);
  const Y_full = parseCoeffs(params.yList);
  const xStar = parseFraction(params.xVal);

  if (X_full.length < 2 || X_full.length !== Y_full.length) {
    logger.error("Cần ít nhất 2 mốc và hai dãy X, Y phải có cùng số phần tử.");
    return null;
  }
  if (!Number.isFinite(xStar)) {
    logger.error("Vui lòng nhập điểm cần tính $x^*$ hợp lệ.");
    return null;
  }

  const h = X_full[1] - X_full[0];
  if (
    Math.abs(h) < 1e-12 ||
    X_full.some((x, i) => i > 0 && Math.abs(x - X_full[i - 1] - h) > Math.abs(h) * 1e-8)
  ) {
    logger.error("Các mốc X phải cách đều với bước lưới h khác 0.");
    return null;
  }

  const N_full = X_full.length;
  const N = N_full - 1; // Chỉ số cuối cùng 0..N

  // Parse số mốc cần lấy N_mốc = 2m (số chẵn)
  let requestedNodes = Number.parseInt(params.nodeCount || "", 10);
  if (!Number.isInteger(requestedNodes) || requestedNodes <= 0) {
    // Mặc định: nếu mảng chẵn lấy toàn bộ; nếu mảng lẻ lấy N_full - 1 hoặc tối thiểu 4 nếu có đủ
    requestedNodes = N_full % 2 === 0 ? N_full : Math.max(2, N_full - 1);
  }

  if (requestedNodes % 2 !== 0) {
    logger.error(`Thuật toán Bessel yêu cầu số mốc $N_{mốc} = 2m$ là số chẵn. Đã nhận: ${requestedNodes}.`);
    return null;
  }
  if (requestedNodes < 2) {
    logger.error("Cần ít nhất 2 mốc để nội suy Bessel ($m \\ge 1$).");
    return null;
  }
  if (requestedNodes > N_full) {
    logger.error(
      `Số mốc yêu cầu $N_{mốc} = ${requestedNodes}$ vượt quá tổng số mốc dữ liệu $N_{full} = ${N_full}$.`,
    );
    return null;
  }

  const m = requestedNodes / 2;

  // Bước 1: Tìm chỉ số k sao cho X_full[k] <= x* < X_full[k+1]
  let initialK = 0;
  if (xStar < X_full[0]) {
    initialK = 0;
  } else if (xStar >= X_full[N]) {
    initialK = N - 1;
  } else {
    for (let i = 0; i < N; i++) {
      if (xStar >= X_full[i] && xStar < X_full[i + 1]) {
        initialK = i;
        break;
      }
    }
  }

  // Xử lý biên: k = max(m - 1, min(N - m, k))
  const k = Math.max(m - 1, Math.min(N - m, initialK));
  const x0 = X_full[k];
  const x1 = X_full[k + 1];

  // Trích xuất 2m mốc đối xứng quanh khoảng [x0, x1]: X_full[k-m+1 ... k+m]
  const X_sub = X_full.slice(k - m + 1, k + m + 1);
  const Y_sub = Y_full.slice(k - m + 1, k + m + 1);

  return {
    X_full,
    Y_full,
    X_sub,
    Y_sub,
    k,
    initialK,
    m,
    x0,
    x1,
    h,
    xStar,
  };
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
