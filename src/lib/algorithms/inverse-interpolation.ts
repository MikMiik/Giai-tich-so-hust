import { buildForwardDifferenceTable, factorial } from "./central-difference";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";
import type { Logger } from "@/types/solver";

const ZERO = 1e-12;
const MAX_ITERS = 50;

function signNum(value: number): number {
  if (Math.abs(value) < ZERO) return 0;
  return value > 0 ? 1 : -1;
}

function parseXY(
  params: Record<string, string>,
  logger: Logger,
): { X: number[]; Y: number[] } | null {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  if (X.length === 0) {
    logger.error("Vui lòng nhập dãy mốc $X$ hợp lệ.");
    return null;
  }
  if (Y.length === 0) {
    logger.error("Vui lòng nhập dãy giá trị $Y$ hợp lệ.");
    return null;
  }
  if (X.length !== Y.length) {
    logger.error(`Số phần tử $X$ (${X.length}) và $Y$ (${Y.length}) phải bằng nhau.`);
    return null;
  }
  if (X.length < 2) {
    logger.error("Cần ít nhất 2 mốc dữ liệu.");
    return null;
  }
  for (let i = 1; i < X.length; i++) {
    if (!(X[i] > X[i - 1] + ZERO)) {
      logger.error("Các mốc $x_i$ phải tăng nghiêm ngặt: $x_0 < x_1 < \\cdots < x_n$.");
      return null;
    }
  }
  return { X, Y };
}

function logDataTable(logger: Logger, X: number[], Y: number[]): void {
  logger.table(
    X.map((x, i) => ({
      "$i$": `$${i}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
    })),
  );
}

function isolationIntervals(
  X: number[],
  Y: number[],
  yBar: number,
): { index: number; d: number }[] {
  const found: { index: number; d: number }[] = [];
  for (let i = 0; i < X.length - 1; i++) {
    const d = (Y[i] - yBar) * (Y[i + 1] - yBar);
    if (d <= 0) found.push({ index: i, d });
  }
  return found;
}

function formatInterval(left: number, right: number): string {
  return `(${fmtNum(left)}, ${fmtNum(right)})`;
}

function directionLabel(sign: number): string {
  if (sign > 0) return "tăng";
  if (sign < 0) return "giảm";
  return "không đổi";
}

function yValuesDistinct(Y: number[]): boolean {
  for (let i = 0; i < Y.length; i++) {
    for (let j = i + 1; j < Y.length; j++) {
      if (Math.abs(Y[i] - Y[j]) < ZERO) return false;
    }
  }
  return true;
}

function monotoneSign(Y: number[]): number | null {
  let sign = 0;
  for (let i = 0; i < Y.length - 1; i++) {
    const step = signNum(Y[i + 1] - Y[i]);
    if (step === 0) return null;
    if (sign === 0) sign = step;
    else if (sign !== step) return null;
  }
  return sign === 0 ? null : sign;
}

function buildDividedDifferenceTable(nodes: number[], values: number[]): number[][] {
  const count = values.length;
  const table = Array.from({ length: count }, () => Array(count).fill(0));
  for (let i = 0; i < count; i++) table[i][0] = values[i];
  for (let order = 1; order < count; order++) {
    for (let i = order; i < count; i++) {
      table[i][order] = (table[i][order - 1] - table[i - 1][order - 1]) / (nodes[i] - nodes[i - order]);
    }
  }
  return table;
}

function buildNewtonC(nodes: number[], values: number[]): number[] {
  const c = [...values];
  const n = c.length - 1;
  for (let j = 1; j <= n; j++) {
    for (let i = n; i >= j; i--) {
      c[i] = (c[i] - c[i - 1]) / (nodes[i] - nodes[i - j]);
    }
  }
  return c;
}

function buildNewtonBasis(nodes: number[]): number[][] {
  const count = nodes.length;
  const n = count - 1;
  const rows: number[][] = [Array(count).fill(0)];
  rows[0][n] = 1;
  for (let k = 1; k <= n; k++) {
    const previous = rows[k - 1];
    const current = Array(count).fill(0);
    for (let i = n; i >= 0; i--) {
      const next = i === n ? 0 : previous[i + 1];
      current[i] = next - nodes[k - 1] * previous[i];
    }
    rows.push(current);
  }
  return rows;
}

function combineNewtonCoeffs(c: number[], basisRows: number[][]): number[] {
  const count = c.length;
  const coeffs: number[] = [];
  for (let j = 0; j < count; j++) {
    coeffs.push(c.reduce((sum, ck, k) => sum + ck * basisRows[k][j], 0));
  }
  return coeffs;
}

function evalAuxiliaryS(deltasFromK: number[], t: number): number {
  let sum = 0;
  for (let m = 2; m < deltasFromK.length; m++) {
    let product = 1;
    for (let r = 0; r < m; r++) product *= t - r;
    sum += (deltasFromK[m] / factorial(m)) * product;
  }
  return sum;
}

export function runInverseIsolation(params: Record<string, string>, logger: Logger): void {
  const parsed = parseXY(params, logger);
  if (!parsed) return;
  const yBar = parseFraction(params.yBar);
  if (!Number.isFinite(yBar)) {
    logger.error("Giá trị $\\bar{y}$ không hợp lệ.");
    return;
  }

  const { X, Y } = parsed;
  logger.section("ĐẦU VÀO");
  logger.formula(`$$f(x)=\\bar{y}=${fmtNum(yBar)}$$`);
  logDataTable(logger, X, Y);

  logger.section("KHOẢNG CÁCH LY");
  logger.formula(
    "$$d_i=(y_i-\\bar{y})(y_{i+1}-\\bar{y}),\\quad d_i\\le 0 \\Rightarrow (x_i,x_{i+1})\\in KCL$$",
  );

  const steps: Record<string, unknown>[] = [];
  const found = isolationIntervals(X, Y, yBar);
  for (let i = 0; i < X.length - 1; i++) {
    const left = Y[i] - yBar;
    const right = Y[i + 1] - yBar;
    const d = left * right;
    const keep = d <= 0;
    steps.push({
      "$i$": `$${i}$`,
      "$y_i-\\bar{y}$": `$${fmtNum(left)}$`,
      "$y_{i+1}-\\bar{y}$": `$${fmtNum(right)}$`,
      "$d_i$": `$${fmtNum(d)}$`,
      "Kết luận": keep
        ? `lấy $(${fmtNum(X[i])}, ${fmtNum(X[i + 1])})$`
        : "bỏ",
    });
  }
  logger.table(steps);

  logger.section("KẾT QUẢ");
  if (found.length === 0) {
    logger.warn("Không có khoảng cách ly: $\\bar{y}$ không nằm giữa hai giá trị $y_i$ liên tiếp.");
    logger.result("$$KCL = []$$");
    return;
  }
  const list = found
    .map((item) => formatInterval(X[item.index], X[item.index + 1]))
    .join(",\\ ");
  logger.result(`$$KCL = \\{ ${list} \\}$$`);
}

export function runMonotoneIntervals(params: Record<string, string>, logger: Logger): void {
  const parsed = parseXY(params, logger);
  if (!parsed) return;
  const { X, Y } = parsed;
  const n = X.length - 1;

  logger.section("ĐẦU VÀO");
  logDataTable(logger, X, Y);

  logger.section("XÁC ĐỊNH KHOẢNG ĐƠN ĐIỆU");
  const startSign = signNum(Y[1] - Y[0]);
  logger.formula(`$$\\mathrm{sign}_0 = \\mathrm{sign}(y_1-y_0) = ${startSign}$$`);
  logger.formula(
    "$$\\Delta_i = y_{i+1}-y_i;\\quad \\mathrm{sign}(\\Delta_i)\\ne \\mathrm{sign} \\Rightarrow \\text{cắt đoạn tại } x_i$$",
  );

  const intervals: { start: number; end: number; sign: number }[] = [];
  const steps: Record<string, unknown>[] = [];
  let start = 0;
  let sign = startSign;

  for (let i = 1; i < n; i++) {
    const delta = Y[i + 1] - Y[i];
    const deltaSign = signNum(delta);
    let action = "giữ";
    if (deltaSign !== 0) {
      if (sign === 0) {
        sign = deltaSign;
        action = `gán $\\mathrm{sign}=${sign}$`;
      } else if (deltaSign !== sign) {
        intervals.push({ start, end: i, sign });
        action = `cắt $(${fmtNum(X[start])}, ${fmtNum(X[i])})$, ${directionLabel(sign)}`;
        start = i;
        sign = deltaSign;
      }
    } else {
      action = "bỏ qua $\\Delta_i=0$";
    }
    steps.push({
      "$i$": `$${i}$`,
      "$\\Delta_i$": `$${fmtNum(delta)}$`,
      "$\\mathrm{sign}(\\Delta_i)$": `$${deltaSign}$`,
      "Hành động": action,
    });
  }
  intervals.push({ start, end: n, sign });
  logger.table(steps);

  logger.section("KẾT QUẢ");
  logger.table(
    intervals.map((item, index) => ({
      "Khoảng": `$K_{${index + 1}}$`,
      "$(x_{\\mathrm{start}}, x_{\\mathrm{end}})$": `$(${fmtNum(X[item.start])}, ${fmtNum(X[item.end])})$`,
      "$\\mathrm{sign}$": `$${item.sign}$`,
      "Chiều": directionLabel(item.sign),
    })),
  );
}

export function runInverseNewtonForward(params: Record<string, string>, logger: Logger): void {
  const parsed = parseXY(params, logger);
  if (!parsed) return;
  const yBar = parseFraction(params.yBar);
  if (!Number.isFinite(yBar)) {
    logger.error("Giá trị $\\bar{y}$ không hợp lệ.");
    return;
  }

  const { X, Y } = parsed;
  if (!yValuesDistinct(Y)) {
    logger.error("Các $y_i$ phải đôi một khác nhau để lập hàm ngược $x=P(y)$.");
    return;
  }
  const direction = monotoneSign(Y);
  if (direction === null) {
    logger.error("Bảng đã chọn phải đơn điệu. Hãy cắt theo khoảng đơn điệu trước khi nội suy ngược.");
    return;
  }

  const n = X.length - 1;
  logger.section("ĐẦU VÀO");
  logger.formula(`$$\\bar{y}=${fmtNum(yBar)},\\quad \\text{chiều } y_i:\\ ${directionLabel(direction)}$$`);
  logDataTable(logger, X, Y);

  logger.section("ĐỔI VAI TRÒ MỐC");
  logger.formula("$$Y\\ \\text{là mốc nội suy},\\quad X\\ \\text{là giá trị hàm}\\quad (x=P(y))$$");
  logger.table(
    Y.map((y, i) => ({
      "Mốc $y_i$": `$${fmtNum(y)}$`,
      "Giá trị $x_i$": `$${fmtNum(X[i])}$`,
    })),
  );

  logger.section("TỶ SAI PHÂN VÀ VECTOR C");
  logger.formula(
    `$$c_i\\leftarrow x_i,\\qquad c_i\\leftarrow \\frac{c_i-c_{i-1}}{y_i-y_{i-j}}\\quad (j=1,\\ldots,${n};\\ i=${n},\\ldots,j)$$`,
  );
  const dd = buildDividedDifferenceTable(Y, X);
  const c = buildNewtonC(Y, X);
  const diffTable = Y.map((y, i) => {
    const row: Record<string, unknown> = {
      "$y_i$": `$${fmtNum(y)}$`,
      "$x_i$": i === 0 ? `**$${fmtNum(X[i])}$**` : `$${fmtNum(X[i])}$`,
    };
    for (let order = 1; order <= n; order++) {
      row[`Cấp ${order}`] =
        order <= i
          ? i === order
            ? `**$${fmtNum(dd[i][order])}$**`
            : `$${fmtNum(dd[i][order])}$`
          : "—";
    }
    return row;
  });
  logger.table(diffTable);
  logger.result(`$$C = [${c.map((value) => fmtNum(value)).join(", ")}]$$`);

  logger.section("MA TRẬN ĐA THỨC CƠ SỞ A");
  logger.formula("$$A_0=[0,\\ldots,0,1],\\qquad A_{k,i}=A_{k-1,i+1}-y_{k-1}A_{k-1,i}$$");
  const basisRows = buildNewtonBasis(Y);
  logger.table(
    basisRows.map((row, k) => ({
      "Hàng": `$A_${k}$`,
      "Hệ số": `$[${row.map((value) => fmtNum(value)).join(", ")}]$`,
    })),
  );

  logger.section("KHAI TRIỂN P = C × A");
  logger.formula(`$$P_j = \\sum_{k=0}^{${n}} C_k A_{k,j}$$`);
  const P = combineNewtonCoeffs(c, basisRows);
  logger.result(`$$P = [${P.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.result(`$$P_{${n}}(y) = ${fmtPoly(P, "y")}$$`);

  logger.section("HORNER TẠI $\\bar{y}$");
  logger.formula(`$$p\\leftarrow P_0,\\qquad p\\leftarrow p\\times\\bar{y}+P_j$$`);
  const horner: Record<string, unknown>[] = [];
  let p = P[0];
  horner.push({
    "Hệ số": "$p$",
    "Tính": `$p = P_0 = ${fmtNum(p)}$`,
  });
  for (let j = 1; j <= n; j++) {
    const previous = p;
    p = previous * yBar + P[j];
    horner.push({
      "Hệ số": j === n ? "$\\bar{x}$" : "$p$",
      "Tính": `$p = (${fmtNum(previous)}) \\times (${fmtNum(yBar)}) + (${fmtNum(P[j])}) = ${fmtNum(p)}$`,
    });
  }
  logger.table(horner);

  logger.section("KẾT QUẢ");
  logger.result(`$$\\bar{x} = P(\\bar{y}) = ${fmtNum(p)}$$`);
}

export function runInverseNewtonIteration(params: Record<string, string>, logger: Logger): void {
  const parsed = parseXY(params, logger);
  if (!parsed) return;
  const { X, Y } = parsed;
  const yBar = parseFraction(params.yBar);
  const eps = parseFraction(params.eps);
  if (!Number.isFinite(yBar)) {
    logger.error("Giá trị $\\bar{y}$ không hợp lệ.");
    return;
  }
  if (!Number.isFinite(eps) || eps <= 0) {
    logger.error("Sai số $\\varepsilon$ phải là số dương.");
    return;
  }

  const h = X[1] - X[0];
  const uniform = X.every((x, i) => i === 0 || Math.abs(x - X[i - 1] - h) <= Math.abs(h) * 1e-8);
  if (!uniform || Math.abs(h) < ZERO) {
    logger.error("Các mốc $X$ phải cách đều với bước lưới $h \\ne 0$.");
    return;
  }

  const found = isolationIntervals(X, Y, yBar);
  let k = Number.parseInt(params.k, 10);
  if (!Number.isInteger(k) || Number.isNaN(k)) {
    if (found.length === 1) k = found[0].index;
    else if (found.length === 0) {
      logger.error("Không tìm được khoảng cách ly chứa $\\bar{y}$. Hãy chọn $k$ thủ công hoặc đổi dữ liệu.");
      return;
    } else {
      logger.error(
        `Có ${found.length} khoảng cách ly. Hãy nhập chỉ số $k$ của khoảng $[x_k, x_{k+1}]$.`,
      );
      return;
    }
  }
  if (k < 0 || k >= X.length - 1) {
    logger.error(`Chỉ số $k$ phải thuộc $\\{0,1,\\ldots,${X.length - 2}\\}$.`);
    return;
  }

  const deltaYk = Y[k + 1] - Y[k];
  if (Math.abs(deltaYk) < ZERO) {
    logger.error("$\\Delta y_k = 0$, không lập được công thức lặp.");
    return;
  }

  const inFound = found.some((item) => item.index === k);
  logger.section("ĐẦU VÀO");
  logger.formula(
    `$$h=${fmtNum(h)},\\quad \\bar{y}=${fmtNum(yBar)},\\quad \\varepsilon=${fmtNum(eps)},\\quad k=${k}$$`,
  );
  logger.formula(`$$[x_k,x_{k+1}]=[${fmtNum(X[k])}, ${fmtNum(X[k + 1])}],\\quad t=(x-x_k)/h$$`);
  if (!inFound) {
    logger.warn("$\\bar{y}$ không thỏa $d_k\\le 0$ trên khoảng đã chọn. Thuật toán vẫn chạy theo $k$ đã nhập.");
  }
  logDataTable(logger, X, Y);

  logger.section("BẢNG SAI PHÂN TIẾN");
  const delta = buildForwardDifferenceTable(Y);
  const n = X.length - 1;
  logger.table(
    X.map((x, i) => {
      const row: Record<string, unknown> = {
        "$i$": `$${i}$`,
        "$x_i$": `$${fmtNum(x)}$`,
        "$y_i$": `$${fmtNum(Y[i])}$`,
      };
      for (let order = 1; order <= n; order++) {
        row[`$\\Delta^{${order}}y$`] =
          i <= n - order ? `$${fmtNum(delta[i][order])}$` : "—";
      }
      return row;
    }),
  );

  const maxOrder = n - k;
  const deltasFromK = Array.from({ length: maxOrder + 1 }, (_, order) => delta[k][order]);
  logger.section("SAI PHÂN XUẤT PHÁT TỪ $x_k$");
  logger.table(
    deltasFromK.map((value, order) => ({
      "Cấp": order === 0 ? "$y_k$" : `$\\Delta^{${order}} y_k$`,
      "Giá trị": `$${fmtNum(value)}$`,
    })),
  );

  const t0 = (yBar - Y[k]) / deltasFromK[1];
  const tol = eps / Math.abs(h);
  logger.section("LẶP TÌM $t$");
  logger.formula(`$$t_0 = \\frac{\\bar{y}-y_k}{\\Delta y_k} = ${fmtNum(t0)}$$`);
  logger.formula(
    "$$S(t)=\\sum_{m=2}^{n-k}\\frac{\\Delta^m y_k}{m!}\\prod_{r=0}^{m-1}(t-r),\\qquad t_{j+1}=\\frac{\\bar{y}-y_k-S(t_j)}{\\Delta y_k}$$",
  );
  logger.formula(`$$\\text{dừng khi } |t_{j+1}-t_j| < \\varepsilon/h = ${fmtNum(tol)}$$`);

  const rows: Record<string, unknown>[] = [];
  let t = t0;
  let next = t0;
  let converged = false;
  let iter = 0;
  for (; iter < MAX_ITERS; iter++) {
    const s = evalAuxiliaryS(deltasFromK, t);
    next = (yBar - Y[k] - s) / deltasFromK[1];
    const diff = Math.abs(next - t);
    const stop = diff < tol;
    rows.push({
      "$j$": `$${iter}$`,
      "$t_j$": `$${fmtNum(t)}$`,
      "$S(t_j)$": `$${fmtNum(s)}$`,
      "$t_{j+1}$": `$${fmtNum(next)}$`,
      "$|\\Delta t|$": `$${fmtNum(diff)}$`,
      "So sánh": stop ? `$< ${fmtNum(tol)}$` : `$\\ge ${fmtNum(tol)}$`,
    });
    if (stop) {
      converged = true;
      break;
    }
    t = next;
  }
  logger.table(rows);

  if (!converged) {
    logger.warn(`Không hội tụ sau ${MAX_ITERS} vòng lặp.`);
  }

  const xBar = X[k] + next * h;
  logger.section("KẾT QUẢ");
  logger.result(`$$\\bar{x} = x_k + t_{j+1}\\, h = ${fmtNum(xBar)}$$`);
}
