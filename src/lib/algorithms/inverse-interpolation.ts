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

export interface MonotoneIntervalItem {
  index: number; // 0-based
  start: number;
  end: number;
  sign: number;
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  yMin: number;
  yMax: number;
  containsYBar: boolean;
}

export function detectMonotoneIntervals(
  X: number[],
  Y: number[],
  yBar?: number,
): MonotoneIntervalItem[] {
  const n = X.length - 1;
  const startSign = signNum(Y[1] - Y[0]);
  const intervals: MonotoneIntervalItem[] = [];
  let start = 0;
  let sign = startSign;

  for (let i = 1; i < n; i++) {
    const delta = Y[i + 1] - Y[i];
    const deltaSign = signNum(delta);
    if (deltaSign !== 0) {
      if (sign === 0) {
        sign = deltaSign;
      } else if (deltaSign !== sign) {
        const yMin = Math.min(Y[start], Y[i]);
        const yMax = Math.max(Y[start], Y[i]);
        const contains =
          yBar !== undefined ? yMin - ZERO <= yBar && yBar <= yMax + ZERO : false;
        intervals.push({
          index: intervals.length,
          start,
          end: i,
          sign,
          xStart: X[start],
          xEnd: X[i],
          yStart: Y[start],
          yEnd: Y[i],
          yMin,
          yMax,
          containsYBar: contains,
        });
        start = i;
        sign = deltaSign;
      }
    }
  }

  const yMinLast = Math.min(Y[start], Y[n]);
  const yMaxLast = Math.max(Y[start], Y[n]);
  const containsLast =
    yBar !== undefined ? yMinLast - ZERO <= yBar && yBar <= yMaxLast + ZERO : false;
  intervals.push({
    index: intervals.length,
    start,
    end: n,
    sign,
    xStart: X[start],
    xEnd: X[n],
    yStart: Y[start],
    yEnd: Y[n],
    yMin: yMinLast,
    yMax: yMaxLast,
    containsYBar: containsLast,
  });

  return intervals;
}

export interface ExtractedSubarray {
  Xsub: number[];
  Ysub: number[];
  pos: number;
  idx: number;
  isExtracted: boolean;
}

export function extractSubarrayAroundY(
  X: number[],
  Y: number[],
  yBar: number,
  kNodes?: number,
): ExtractedSubarray {
  const M = Y.length;
  if (!kNodes || kNodes >= M) {
    return {
      Xsub: X,
      Ysub: Y,
      pos: 0,
      idx: 0,
      isExtracted: false,
    };
  }

  const sign = Y[M - 1] > Y[0] ? 1 : -1;
  let pos = 0;

  if (sign > 0) {
    if (yBar <= Y[0]) pos = 0;
    else if (yBar >= Y[M - 1]) pos = M - 2;
    else {
      for (let i = 0; i < M - 1; i++) {
        if (Y[i] <= yBar && yBar <= Y[i + 1]) {
          pos = i;
          break;
        }
      }
    }
  } else {
    if (yBar >= Y[0]) pos = 0;
    else if (yBar <= Y[M - 1]) pos = M - 2;
    else {
      for (let i = 0; i < M - 1; i++) {
        if (Y[i] >= yBar && yBar >= Y[i + 1]) {
          pos = i;
          break;
        }
      }
    }
  }

  const half = Math.floor((kNodes - 1) / 2);
  let idx = Math.max(0, pos - half);
  if (idx + kNodes > M) idx = M - kNodes;
  if (idx < 0) idx = 0;

  return {
    Xsub: X.slice(idx, idx + kNodes),
    Ysub: Y.slice(idx, idx + kNodes),
    pos,
    idx,
    isExtracted: true,
  };
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

  // Parse số mốc cần lấy k (tùy chọn)
  let kNodes: number | undefined;
  if (params.nodeCount && params.nodeCount.trim() !== "") {
    const parsedK = parseInt(params.nodeCount, 10);
    if (isNaN(parsedK) || parsedK < 2) {
      logger.error("Số mốc cần lấy phải là số nguyên dương $\\ge 2$.");
      return;
    }
    kNodes = parsedK;
  }

  const { X, Y } = parsed;

  let workingX = X;
  let workingY = Y;
  let direction = monotoneSign(Y);

  let currentSection = 1;
  const nextSection = (title: string) => {
    logger.section(`${currentSection++}. ${title}`);
  };

  // Nếu Y chưa đơn điệu, áp dụng thuật toán monotone-intervals để tìm khoảng phù hợp với yBar
  if (direction === null) {
    nextSection("ĐẦU VÀO BAN ĐẦU (DÃY TÙY Ý)");
    logger.formula(`$$\\bar{y} = ${fmtNum(yBar)}$$`);
    logger.info(
      "💡 Dãy giá trị $Y$ ban đầu **chưa đơn điệu**. Thuật toán tự động áp dụng phương pháp phân rã khoảng đơn điệu để tìm khoảng chứa $\\bar{y}$."
    );
    logDataTable(logger, X, Y);
    logger.separator();

    nextSection("XÁC ĐỊNH KHOẢNG ĐƠN ĐIỆU (MONOTONE INTERVALS)");
    const intervals = detectMonotoneIntervals(X, Y, yBar);

    logger.table(
      intervals.map((item) => ({
        "Khoảng": `$K_{${item.index + 1}}$`,
        "Chỉ số": `$[${item.start}, ${item.end}]$`,
        "$[x_{\\mathrm{start}}, x_{\\mathrm{end}}]$": `$(${fmtNum(item.xStart)}, ${fmtNum(item.xEnd)})$`,
        "$[y_{\\mathrm{start}}, y_{\\mathrm{end}}]$": `$(${fmtNum(item.yStart)}, ${fmtNum(item.yEnd)})$`,
        "Chiều": directionLabel(item.sign),
        "Chứa $\\bar{y}$?": item.containsYBar ? "✅ Có" : "❌ Không",
      })),
    );

    const matching = intervals.filter((item) => item.containsYBar);
    if (matching.length === 0) {
      logger.error(
        `Không có khoảng đơn điệu nào chứa giá trị $\\bar{y} = ${fmtNum(yBar)}$. Giá trị hàm $Y$ dao động trong đoạn $[${fmtNum(Math.min(...Y))}, ${fmtNum(Math.max(...Y))}]$. Vui lòng kiểm tra lại $\\bar{y}$ hoặc bổ sung dữ liệu.`
      );
      return;
    }

    // Chọn khoảng: mặc định khoảng đầu tiên chứa yBar, hoặc theo intervalIndex nếu người dùng nhập
    let chosen = matching[0];
    const userChoice = params.intervalIndex ? parseInt(params.intervalIndex, 10) : NaN;
    if (!isNaN(userChoice)) {
      const foundByUser = intervals.find((item) => item.index + 1 === userChoice);
      if (foundByUser) {
        if (!foundByUser.containsYBar) {
          logger.warn(
            `Khoảng $K_{${userChoice}}$ do bạn chọn không chứa $\\bar{y} = ${fmtNum(yBar)}$. Thuật toán vẫn tiếp tục với khoảng này theo yêu cầu.`
          );
        }
        chosen = foundByUser;
      } else {
        logger.warn(
          `Chỉ số khoảng $K_{${userChoice}}$ không hợp lệ (bảng có ${intervals.length} khoảng). Tự động dùng khoảng $K_{${chosen.index + 1}}$.`
        );
      }
    }

    logger.success(
      `Đã chọn khoảng đơn điệu **$K_{${chosen.index + 1}} = [${fmtNum(chosen.xStart)}, ${fmtNum(chosen.xEnd)}]$** (chỉ số gốc $[${chosen.start} \\dots ${chosen.end}]$) có $y \\in [${fmtNum(chosen.yMin)}, ${fmtNum(chosen.yMax)}]$ chứa $\\bar{y} = ${fmtNum(yBar)}$.`
    );
    logger.separator();

    workingX = X.slice(chosen.start, chosen.end + 1);
    workingY = Y.slice(chosen.start, chosen.end + 1);
    direction = chosen.sign;
  }

  // Nếu người dùng yêu cầu số mốc kNodes và nhỏ hơn độ dài khoảng hiện tại -> trích xuất quanh yBar
  if (kNodes !== undefined) {
    if (kNodes > workingY.length) {
      logger.warn(
        `Số mốc yêu cầu $k = ${kNodes}$ lớn hơn số mốc của khoảng đơn điệu ($M = ${workingY.length}$). Tự động lấy toàn bộ ${workingY.length} mốc.`
      );
    } else if (kNodes < workingY.length) {
      nextSection(`TRÍCH XUẤT ${kNodes} MỐC TỐI ƯU QUANH ȳ`);
      const extraction = extractSubarrayAroundY(workingX, workingY, yBar, kNodes);
      const { pos, idx, Xsub, Ysub } = extraction;

      logger.info(
        `Điểm $\\bar{y} = ${fmtNum(yBar)}$ nằm trong khoảng giữa hai mốc $y_{${pos}} = ${fmtNum(workingY[pos])}$ và $y_{${pos + 1}} = ${fmtNum(workingY[pos + 1])}$.`
      );
      logger.info(
        `Xác định chỉ số bắt đầu để $\\bar{y}$ nằm ở trung tâm: $idx = \\max(0, \\min(${workingY.length - kNodes}, ${pos} - \\lfloor(${kNodes}-1)/2\\rfloor)) = ${idx}$.`
      );
      logger.success(
        `Đã trích xuất $k = ${kNodes}$ mốc tối ưu từ chỉ số $[${idx} \\dots ${idx + kNodes - 1}]$.`
      );
      logger.separator();

      workingX = Xsub;
      workingY = Ysub;
    }
  }

  // Kiểm tra tính đơn trị của Y trên mảng con đã chọn
  if (!yValuesDistinct(workingY)) {
    logger.error("Các giá trị $y_i$ trong khoảng đơn điệu đã chọn phải đôi một khác nhau để lập hàm ngược $x = P(y)$.");
    return;
  }

  const n = workingX.length - 1;
  nextSection("BẢNG DỮ LIỆU ĐƠN ĐIỆU SỬ DỤNG CHO HÀM NGƯỢC");
  logger.formula(`$$\\bar{y} = ${fmtNum(yBar)},\\quad \\text{chiều } y_i:\\ ${directionLabel(direction)}$$`);
  logDataTable(logger, workingX, workingY);
  logger.separator();

  nextSection("ĐỔI VAI TRÒ MỐC NỘI SUY VÀ GIÁ TRỊ HÀM");
  logger.formula("$$Y\\ \\text{là mốc nội suy đầu vào},\\quad X\\ \\text{là giá trị hàm tương ứng}\\quad (x = P(y))$$");
  logger.table(
    workingY.map((y, i) => ({
      "Mốc $y_i$": `$${fmtNum(y)}$`,
      "Giá trị $x_i$": `$${fmtNum(workingX[i])}$`,
    })),
  );
  logger.separator();

  nextSection("BẢNG TỶ SAI PHÂN VÀ VECTOR C");
  logger.formula(
    `$$c_i\\leftarrow x_i,\\qquad c_i\\leftarrow \\frac{c_i-c_{i-1}}{y_i-y_{i-j}}\\quad (j=1,\\ldots,${n};\\ i=${n},\\ldots,j)$$`,
  );
  const dd = buildDividedDifferenceTable(workingY, workingX);
  const c = buildNewtonC(workingY, workingX);
  const diffTable = workingY.map((y, i) => {
    const row: Record<string, unknown> = {
      "$y_i$": `$${fmtNum(y)}$`,
      "$x_i$": i === 0 ? `**$${fmtNum(workingX[i])}$**` : `$${fmtNum(workingX[i])}$`,
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
  logger.separator();

  nextSection("MA TRẬN ĐA THỨC CƠ SỞ A");
  logger.formula("$$A_0=[0,\\ldots,0,1],\\qquad A_{k,i}=A_{k-1,i+1}-y_{k-1}A_{k-1,i}$$");
  const basisRows = buildNewtonBasis(workingY);
  logger.table(
    basisRows.map((row, k) => ({
      "Hàng": `$A_${k}$`,
      "Hệ số": `$[${row.map((value) => fmtNum(value)).join(", ")}]$`,
    })),
  );
  logger.separator();

  nextSection("KHAI TRIỂN ĐA THỨC HÀM NGƯỢC P = C × A");
  logger.formula(`$$P_j = \\sum_{k=0}^{${n}} C_k A_{k,j}$$`);
  const P = combineNewtonCoeffs(c, basisRows);
  logger.result(`$$P = [${P.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.result(`$$P_{${n}}(y) = ${fmtPoly(P, "y")}$$`);
  logger.separator();

  nextSection("SƠ ĐỒ HORNER TÍNH NGHIỆM TẠI ȳ");
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
  logger.separator();

  nextSection("KẾT QUẢ");
  logger.success(`Nghiệm gần đúng của bài toán nội suy ngược tại $\\bar{y} = ${fmtNum(yBar)}$:`);
  logger.result(`$$\\bar{x} = P(\\bar{y}) = ${fmtNum(p)}$$`);
}

/** Giải một khoảng cách ly kGlobal và ghi log kết quả. */
function solveOneIterationInterval(
  X: number[],
  Y: number[],
  yBar: number,
  eps: number,
  h: number,
  kGlobal: number,
  nodeCount: number | undefined,
  logger: Logger,
  globalSolIdx: number,          // thứ tự nghiệm (1-based, để đánh section)
  totalSolutions: number,        // tổng số khoảng cách ly
): { converged: boolean; xBar: number } {
  const SECTION_PREFIX = totalSolutions > 1 ? `[Nghiệm ${globalSolIdx}/${totalSolutions}] ` : "";

  // --- Trích xuất mảng con nếu cần ---
  let workingX = X;
  let workingY = Y;
  let kLocal = kGlobal;

  if (nodeCount !== undefined && nodeCount < X.length) {
    const half = Math.floor((nodeCount - 1) / 2);
    let idxStart = Math.max(0, kGlobal - half);
    if (idxStart + nodeCount > X.length) idxStart = X.length - nodeCount;
    const idxEnd = idxStart + nodeCount;

    logger.section(`${SECTION_PREFIX}TRÍCH XUẤT ${nodeCount} MỐC QUANH KHOẢNG CÁCH LY`);
    logger.info(
      `Lấy $n_{mốc} = ${nodeCount}$ mốc đối xứng quanh $x_k = ${fmtNum(X[kGlobal])}$: chỉ số $[${idxStart} \\dots ${idxEnd - 1}]$.`
    );
    workingX = X.slice(idxStart, idxEnd);
    workingY = Y.slice(idxStart, idxEnd);
    kLocal = kGlobal - idxStart;

    const subTable = workingX.map((xi, i) => ({
      "$i_{sub}$": `$${i}$`,
      "$i_{gốc}$": `$${idxStart + i}$`,
      "$x_i$": i === kLocal || i === kLocal + 1 ? `**$${fmtNum(xi)}$**` : `$${fmtNum(xi)}$`,
      "$y_i$": i === kLocal || i === kLocal + 1 ? `**$${fmtNum(workingY[i])}$**` : `$${fmtNum(workingY[i])}$`,
    }));
    logger.table(subTable);
    logger.success(`Khoảng cách ly trong mảng con: $k_{sub} = ${kLocal}$, tức $[${fmtNum(workingX[kLocal])}, ${fmtNum(workingX[kLocal + 1])}]$.`);
  }

  const deltaYk = workingY[kLocal + 1] - workingY[kLocal];
  if (Math.abs(deltaYk) < ZERO) {
    logger.warn(`${SECTION_PREFIX}$\\Delta y_k = 0$, bỏ qua khoảng $[${fmtNum(X[kGlobal])}, ${fmtNum(X[kGlobal + 1])}]$.`);
    return { converged: false, xBar: NaN };
  }

  // --- Tham số ---
  logger.section(`${SECTION_PREFIX}THAM SỐ LẶP`);
  logger.formula(
    `$$h = ${fmtNum(h)},\\quad \\bar{y} = ${fmtNum(yBar)},\\quad \\varepsilon = ${fmtNum(eps)},\\quad k = ${kLocal}$$`
  );
  logger.formula(
    `$$[x_k, x_{k+1}] = [${fmtNum(workingX[kLocal])}, ${fmtNum(workingX[kLocal + 1])}],\\quad t = \\frac{x - x_k}{h}$$`
  );

  if (!(nodeCount !== undefined && nodeCount < X.length)) {
    logDataTable(logger, workingX, workingY);
  }

  // --- Bảng sai phân ---
  logger.section(`${SECTION_PREFIX}BẢNG SAI PHÂN TIẾN`);
  const delta = buildForwardDifferenceTable(workingY);
  const n = workingX.length - 1;
  logger.table(
    workingX.map((x, i) => {
      const row: Record<string, unknown> = {
        "$i$": `$${i}$`,
        "$x_i$": `$${fmtNum(x)}$`,
        "$y_i$": `$${fmtNum(workingY[i])}$`,
      };
      for (let order = 1; order <= n; order++) {
        row[`$\\Delta^{${order}}y$`] = i <= n - order ? `$${fmtNum(delta[i][order])}$` : "—";
      }
      return row;
    }),
  );

  const maxOrder = n - kLocal;
  const deltasFromK = Array.from({ length: maxOrder + 1 }, (_, order) => delta[kLocal][order]);
  logger.section(`${SECTION_PREFIX}SAI PHÂN XUẤT PHÁT TỪ MỐC $x_k$`);
  logger.table(
    deltasFromK.map((value, order) => ({
      "Cấp": order === 0 ? "$y_k$" : `$\\Delta^{${order}} y_k$`,
      "Giá trị": `$${fmtNum(value)}$`,
    })),
  );

  // --- Lặp ---
  const t0 = (yBar - workingY[kLocal]) / deltasFromK[1];
  const tol = eps / Math.abs(h);
  logger.section(`${SECTION_PREFIX}QUÁ TRÌNH LẶP TÌM THAM SỐ $t$`);
  logger.formula(
    `$$t_0 = \\frac{\\bar{y} - y_k}{\\Delta y_k} = \\frac{${fmtNum(yBar)} - ${fmtNum(workingY[kLocal])}}{${fmtNum(deltasFromK[1])}} = ${fmtNum(t0)}$$`
  );
  logger.formula(
    "$$S(t) = \\sum_{m=2}^{n-k} \\frac{\\Delta^m y_k}{m!} \\prod_{r=0}^{m-1}(t-r), \\qquad t_{j+1} = \\frac{\\bar{y} - y_k - S(t_j)}{\\Delta y_k}$$"
  );
  logger.formula(`$$\\text{Dừng khi } |t_{j+1} - t_j| < \\varepsilon / h = ${fmtNum(tol)}$$`);

  const rows: Record<string, unknown>[] = [];
  let t = t0;
  let next = t0;
  let converged = false;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    const s = evalAuxiliaryS(deltasFromK, t);
    next = (yBar - workingY[kLocal] - s) / deltasFromK[1];
    const diff = Math.abs(next - t);
    const stop = diff < tol;
    rows.push({
      "$j$": `$${iter}$`,
      "$t_j$": `$${fmtNum(t)}$`,
      "$S(t_j)$": `$${fmtNum(s)}$`,
      "$t_{j+1}$": `$${fmtNum(next)}$`,
      "$|\\Delta t|$": `$${fmtNum(diff)}$`,
      "So sánh": stop ? `$< ${fmtNum(tol)}$ ✅` : `$\\ge ${fmtNum(tol)}$`,
    });
    if (stop) { converged = true; break; }
    t = next;
  }
  logger.table(rows);

  if (!converged) {
    logger.warn(`${SECTION_PREFIX}Không hội tụ sau ${MAX_ITERS} vòng lặp. Thử tăng số mốc hoặc dùng nodeCount để thu hẹp bảng sai phân.`);
  }

  const xBar = workingX[kLocal] + next * h;
  logger.section(`${SECTION_PREFIX}KẾT QUẢ`);
  logger.result(
    `$$\\bar{x} = x_k + t_{j+1} \\cdot h = ${fmtNum(workingX[kLocal])} + (${fmtNum(next)}) \\times ${fmtNum(h)} = ${fmtNum(xBar)}$$`
  );
  return { converged, xBar };
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

  // --- Parse nodeCount ---
  let nodeCount: number | undefined;
  if (params.nodeCount && params.nodeCount.trim() !== "") {
    const parsedN = parseInt(params.nodeCount, 10);
    if (isNaN(parsedN) || parsedN < 2) {
      logger.error("Số mốc cần lấy phải là số nguyên $\\ge 2$.");
      return;
    }
    if (parsedN > X.length) {
      logger.error(`Số mốc yêu cầu $n_{mốc} = ${parsedN}$ vượt quá tổng số mốc dữ liệu ($${X.length}$).`);
      return;
    }
    nodeCount = parsedN;
  }

  // --- Tìm tất cả khoảng cách ly ---
  const found = isolationIntervals(X, Y, yBar);
  if (found.length === 0) {
    logger.error("Không tìm được khoảng cách ly chứa $\\bar{y}$. Kiểm tra lại dữ liệu và giá trị $\\bar{y}$.");
    return;
  }

  // --- Xác định danh sách khoảng sẽ giải ---
  let intervalsToSolve: { index: number; d: number }[];
  const kRaw = Number.parseInt(params.k, 10);
  const kSpecified = Number.isInteger(kRaw) && !Number.isNaN(kRaw);

  if (kSpecified) {
    // Người dùng chỉ định k cụ thể → chỉ giải khoảng đó
    if (kRaw < 0 || kRaw >= X.length - 1) {
      logger.error(`Chỉ số $k$ phải thuộc $\\{0,1,\\ldots,${X.length - 2}\\}$.`);
      return;
    }
    const inFound = found.some((item) => item.index === kRaw);
    if (!inFound) {
      logger.warn(`$\\bar{y}$ không nằm trong khoảng $[x_{${kRaw}}, x_{${kRaw + 1}}] = [${fmtNum(X[kRaw])}, ${fmtNum(X[kRaw + 1])}]$. Thuật toán vẫn chạy theo $k$ đã nhập.`);
    }
    intervalsToSolve = [{ index: kRaw, d: (Y[kRaw] - yBar) * (Y[kRaw + 1] - yBar) }];
  } else {
    // Không chỉ định k → giải tất cả khoảng cách ly
    intervalsToSolve = found.filter((item) => Math.abs(Y[item.index + 1] - Y[item.index]) > ZERO);
    if (intervalsToSolve.length === 0) {
      logger.error("Tất cả khoảng cách ly đều có $\\Delta y_k = 0$, không thể lập công thức lặp.");
      return;
    }
  }

  // --- Section tổng quan đầu vào ---
  logger.section("ĐẦU VÀO");
  logger.info(`Tổng số mốc: $N = ${X.length}$, bước lưới $h = ${fmtNum(h)}$, $\\bar{y} = ${fmtNum(yBar)}$, $\\varepsilon = ${fmtNum(eps)}$.`);
  if (found.length > 1) {
    logger.info(
      `Phát hiện $${found.length}$ khoảng cách ly: ` +
      found.map((f) => `$[${fmtNum(X[f.index])},\\,${fmtNum(X[f.index + 1])}]$`).join(", ") + "."
    );
    if (!kSpecified) {
      logger.info(`Sẽ giải tất cả $${intervalsToSolve.length}$ khoảng hợp lệ.`);
    }
  }
  logger.separator();

  // --- Giải từng khoảng ---
  const results: { xBar: number; converged: boolean }[] = [];
  for (let i = 0; i < intervalsToSolve.length; i++) {
    const { index: kGlobal } = intervalsToSolve[i];
    if (intervalsToSolve.length > 1) {
      logger.separator();
      logger.info(`### Khoảng ${i + 1}/${intervalsToSolve.length}: $[x_{${kGlobal}}, x_{${kGlobal + 1}}] = [${fmtNum(X[kGlobal])}, ${fmtNum(X[kGlobal + 1])}]$`);
      logger.separator();
    }
    const res = solveOneIterationInterval(
      X, Y, yBar, eps, h, kGlobal, nodeCount, logger,
      i + 1, intervalsToSolve.length,
    );
    results.push(res);
  }

  // --- Tổng kết (khi nhiều khoảng) ---
  if (results.length > 1) {
    logger.separator();
    logger.section("TỔNG KẾT — TẤT CẢ NGHIỆM");
    const convergedResults = results.filter((r) => r.converged && Number.isFinite(r.xBar));
    if (convergedResults.length === 0) {
      logger.warn("Tất cả các khoảng đều không hội tụ.");
    } else {
      logger.table(
        convergedResults.map((r, i) => ({
          "Nghiệm": `$x_{${i + 1}}$`,
          "$\\bar{x}$": `$${fmtNum(r.xBar)}$`,
          "Trạng thái": r.converged ? "✅ Hội tụ" : "⚠️ Không hội tụ",
        }))
      );
      logger.result(
        convergedResults
          .map((r, i) => `$$\\bar{x}_{${i + 1}} \\approx ${fmtNum(r.xBar)}$$`)
          .join("\n")
      );
    }
  }
}
