import type { Logger } from "@/types/solver";
import { compileDerivative, compileExpression } from "./expression-evaluator";
import { fmtNum, parseFraction } from "./math-utils";

const MAX_SUBINTERVALS = 5_000_000;
const TABLE_ROW_LIMIT = 200;

interface IntegrationSetup {
  f: (x: number) => number;
  a: number;
  b: number;
  eps: number;
  M: number;
  h: number;
  n: number;
}

function fmtSci(v: number, digits = 4): string {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0) return "0";
  if (Math.abs(v) >= 1e-4 && Math.abs(v) < 1e5) return fmtNum(v, 6);
  const [mantissa, exp] = v.toExponential(digits).split("e");
  return `${mantissa} \\times 10^{${Number(exp)}}`;
}

function maxAbsOnInterval(
  g: (x: number) => number,
  lo: number,
  hi: number,
  samples = 4000,
): { max: number; at: number } {
  let best = -Infinity;
  let bestX = lo;
  let step = (hi - lo) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = lo + i * step;
    const v = Math.abs(g(x));
    if (v > best) {
      best = v;
      bestX = x;
    }
  }
  for (let round = 0; round < 2; round++) {
    const l = Math.max(lo, bestX - step);
    const r = Math.min(hi, bestX + step);
    step = (r - l) / samples;
    for (let i = 0; i <= samples; i++) {
      const x = l + i * step;
      const v = Math.abs(g(x));
      if (v > best) {
        best = v;
        bestX = x;
      }
    }
  }
  return { max: best, at: bestX };
}

function prepareIntegration(
  params: Record<string, string>,
  logger: Logger,
  derivOrder: 2 | 4,
  computeN: (bMinusA: number, M: number, eps: number) => number,
  nFormulaLatex: string,
): IntegrationSetup | null {
  const fStr = params.fStr?.trim() ?? "";
  const a = parseFraction(params.a ?? "");
  const b = parseFraction(params.b ?? "");
  const eps = parseFraction(params.epsilon ?? "");
  const mManualStr = params.mBound?.trim() ?? "";

  if (!fStr) {
    logger.error("Vui lòng nhập hàm số $f(x)$.");
    return null;
  }
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) {
    logger.error("Cần nhập cận $a < b$ hợp lệ.");
    return null;
  }
  if (!Number.isFinite(eps) || eps <= 0) {
    logger.error("Sai số $\\varepsilon$ phải là số dương.");
    return null;
  }

  let f: (x: number) => number;
  try {
    f = compileExpression(fStr);
    f(a);
    f(b);
    f((a + b) / 2);
  } catch (e) {
    logger.error(`Lỗi cú pháp hoặc miền xác định của $f(x)$: ${(e as Error).message}`);
    return null;
  }

  logger.section("1. XÁC ĐỊNH CẬN ĐẠO HÀM VÀ SỐ KHOẢNG CHIA $n$");
  logger.info(
    `Hàm: $f(x) = ${fStr}$, đoạn $[a, b] = [${fmtNum(a)}, ${fmtNum(b)}]$, sai số $\\varepsilon = ${fmtSci(eps)}$.`,
  );

  let M: number;
  if (mManualStr !== "") {
    const parsedM = parseFraction(mManualStr);
    if (!Number.isFinite(parsedM) || parsedM < 0) {
      logger.error(`Giá trị $M_${derivOrder}$ phải là số không âm.`);
      return null;
    }
    M = parsedM;
    logger.info(`Dùng $M_${derivOrder} = ${fmtNum(M, 6)}$ do người dùng nhập.`);
  } else {
    try {
      const { fn: dfn, tex } = compileDerivative(fStr, derivOrder);
      if (tex.length <= 300) {
        logger.formula(`$$f^{(${derivOrder})}(x) = ${tex}$$`);
      }
      const { max, at } = maxAbsOnInterval(dfn, a, b);
      M = max;
      logger.result(
        `$$M_${derivOrder} = \\max_{x \\in [${fmtNum(a)}, ${fmtNum(b)}]} |f^{(${derivOrder})}(x)| \\approx ${fmtNum(M, 6)} \\quad (\\text{tại } x \\approx ${fmtNum(at, 4)})$$`,
      );
    } catch (e) {
      logger.error(
        `Không tính được $M_${derivOrder}$ tự động: ${(e as Error).message}. Hãy nhập $M_${derivOrder}$ thủ công.`,
      );
      return null;
    }
  }

  const n = computeN(b - a, M, eps);
  logger.formula(nFormulaLatex);
  logger.info(`Số khoảng chia chọn: $n = ${n}$.`);

  if (n > MAX_SUBINTERVALS) {
    logger.error(
      `Số khoảng chia $n = ${n}$ quá lớn (vượt giới hạn ${MAX_SUBINTERVALS}). Hãy tăng $\\varepsilon$ hoặc kiểm tra lại đầu vào.`,
    );
    return null;
  }

  const h = (b - a) / n;
  logger.formula(`$$h = \\frac{b - a}{n} = \\frac{${fmtNum(b)} - ${fmtNum(a)}}{${n}} = ${fmtNum(h, 6)}$$`);
  logger.separator();

  return { f, a, b, eps, M, h, n };
}

function logSampledTable(
  logger: Logger,
  rows: Record<string, unknown>[],
  totalCount: number,
): void {
  if (rows.length <= TABLE_ROW_LIMIT) {
    logger.table(rows);
    return;
  }
  const head = rows.slice(0, 10);
  const tail = rows.slice(-10);
  const ellipsisRow: Record<string, unknown> = {};
  for (const key of Object.keys(rows[0])) {
    ellipsisRow[key] = "…";
  }
  logger.table([...head, ellipsisRow, ...tail]);
  logger.info(`💡 Bảng có ${totalCount} dòng, chỉ hiển thị 10 dòng đầu và 10 dòng cuối.`);
}

// ---------------------------------------------------------------------------
// 1. Phương pháp Điểm giữa (Midpoint Rule)
// ---------------------------------------------------------------------------
export function runIntegralMidpoint(
  params: Record<string, string>,
  logger: Logger,
): void {
  const setup = prepareIntegration(
    params,
    logger,
    2,
    (len, M2, eps) => Math.max(1, Math.ceil(Math.sqrt((len ** 3 * M2) / (24 * eps)))),
    `$$n = \\left\\lceil \\sqrt{\\frac{(b-a)^3 M_2}{24\\varepsilon}} \\right\\rceil$$`,
  );
  if (!setup) return;

  const { f, a, b, M, h, n } = setup;

  logger.section("2. TÍNH TỔNG TẠI CÁC MỐC ĐIỂM GIỮA");
  logger.formula(`$$S = \\sum_{i=0}^{n-1} f\\big(a + (i + 0.5)h\\big), \\qquad I \\approx h \\cdot S$$`);

  let S = 0;
  const rows: Record<string, unknown>[] = [];
  const collectRows = n <= TABLE_ROW_LIMIT;

  for (let i = 0; i < n; i++) {
    const xi = a + (i + 0.5) * h;
    const fi = f(xi);
    S += fi;
    if (collectRows || i < 10 || i >= n - 10) {
      rows.push({
        $i$: `$${i}$`,
        "$x_{i+0.5} = a + (i+0.5)h$": `$${fmtNum(xi, 6)}$`,
        "$f(x_{i+0.5})$": `$${fmtNum(fi, 6)}$`,
      });
    }
  }

  logSampledTable(logger, rows, n);

  const I = h * S;
  const errBound = ((b - a) ** 3 / (24 * n * n)) * M;

  logger.section("3. KẾT QUẢ VÀ SAI SỐ LÝ THUYẾT");
  logger.result(`$$S = ${fmtNum(S, 6)}$$`);
  logger.result(`$$I \\approx h \\cdot S = ${fmtNum(I, 6)}$$`);
  logger.result(
    `$$|R_n| \\le \\frac{(b-a)^3}{24n^2} M_2 = ${fmtSci(errBound)}$$`,
  );
}

// ---------------------------------------------------------------------------
// 2. Phương pháp Hình thang (Trapezoidal Rule)
// ---------------------------------------------------------------------------
export function runIntegralTrapezoid(
  params: Record<string, string>,
  logger: Logger,
): void {
  const setup = prepareIntegration(
    params,
    logger,
    2,
    (len, M2, eps) => Math.max(1, Math.ceil(Math.sqrt((len ** 3 * M2) / (12 * eps)))),
    `$$n = \\left\\lceil \\sqrt{\\frac{(b-a)^3 M_2}{12\\varepsilon}} \\right\\rceil$$`,
  );
  if (!setup) return;

  const { f, a, b, M, h, n } = setup;

  logger.section("2. TÍNH TỔNG HÌNH THANG");
  logger.formula(
    `$$S = \\frac{f(a) + f(b)}{2} + \\sum_{i=1}^{n-1} f(a + i \\cdot h), \\qquad I \\approx h \\cdot S$$`,
  );

  const fa = f(a);
  const fb = f(b);
  let S = (fa + fb) / 2;

  const rows: Record<string, unknown>[] = [];
  const collectRows = n + 1 <= TABLE_ROW_LIMIT;

  for (let i = 0; i <= n; i++) {
    const xi = a + i * h;
    const fi = i === 0 ? fa : i === n ? fb : f(xi);
    if (i >= 1 && i <= n - 1) {
      S += fi;
    }
    if (collectRows || i < 10 || i >= n - 9) {
      rows.push({
        $i$: `$${i}$`,
        $x_i$: `$${fmtNum(xi, 6)}$`,
        "$f(x_i)$": `$${fmtNum(fi, 6)}$`,
        "Trọng số": i === 0 || i === n ? "$1/2$" : "$1$",
      });
    }
  }

  logSampledTable(logger, rows, n + 1);

  const I = h * S;
  const errBound = ((b - a) ** 3 / (12 * n * n)) * M;

  logger.section("3. KẾT QUẢ VÀ SAI SỐ LÝ THUYẾT");
  logger.result(`$$S = ${fmtNum(S, 6)}$$`);
  logger.result(`$$I \\approx h \\cdot S = ${fmtNum(I, 6)}$$`);
  logger.result(
    `$$|R_n| \\le \\frac{(b-a)^3}{12n^2} M_2 = ${fmtSci(errBound)}$$`,
  );
}

// ---------------------------------------------------------------------------
// 3. Phương pháp Simpson (Simpson's 1/3 Rule)
// ---------------------------------------------------------------------------
export function runIntegralSimpson(
  params: Record<string, string>,
  logger: Logger,
): void {
  const setup = prepareIntegration(
    params,
    logger,
    4,
    (len, M4, eps) => {
      let n = Math.max(2, Math.ceil(Math.pow((len ** 5 * M4) / (180 * eps), 0.25)));
      if (n % 2 !== 0) n += 1;
      return n;
    },
    `$$n = \\left\\lceil \\sqrt[4]{\\frac{(b-a)^5 M_4}{180\\varepsilon}} \\right\\rceil \\quad (\\text{nếu lẻ thì } n \\leftarrow n + 1)$$`,
  );
  if (!setup) return;

  const { f, a, b, M, h, n } = setup;

  logger.section("2. PHÂN LOẠI MỐC VÀ CỘNG DỒN");
  logger.formula(
    `$$I \\approx \\frac{h}{3}\\Big[f(a) + f(b) + 4S_{\\text{lẻ}} + 2S_{\\text{chẵn}}\\Big]$$`,
  );

  const fa = f(a);
  const fb = f(b);
  let sOdd = 0;
  let sEven = 0;

  const rows: Record<string, unknown>[] = [];
  const collectRows = n + 1 <= TABLE_ROW_LIMIT;

  for (let i = 0; i <= n; i++) {
    const xi = a + i * h;
    const fi = i === 0 ? fa : i === n ? fb : f(xi);
    let weight = "$1$";
    if (i >= 1 && i <= n - 1) {
      if (i % 2 !== 0) {
        sOdd += fi;
        weight = "$4$ (lẻ)";
      } else {
        sEven += fi;
        weight = "$2$ (chẵn)";
      }
    }
    if (collectRows || i < 10 || i >= n - 9) {
      rows.push({
        $i$: `$${i}$`,
        $x_i$: `$${fmtNum(xi, 6)}$`,
        "$f(x_i)$": `$${fmtNum(fi, 6)}$`,
        "Hệ số": weight,
      });
    }
  }

  logSampledTable(logger, rows, n + 1);

  const I = (h / 3) * (fa + fb + 4 * sOdd + 2 * sEven);
  const errBound = ((b - a) ** 5 / (180 * n ** 4)) * M;

  logger.section("3. KẾT QUẢ VÀ SAI SỐ LÝ THUYẾT");
  logger.result(
    `$$S_{\\text{lẻ}} = ${fmtNum(sOdd, 6)}, \\qquad S_{\\text{chẵn}} = ${fmtNum(sEven, 6)}$$`,
  );
  logger.result(`$$I \\approx ${fmtNum(I, 6)}$$`);
  logger.result(
    `$$|R_n| \\le \\frac{(b-a)^5}{180n^4} M_4 = ${fmtSci(errBound)}$$`,
  );
}
