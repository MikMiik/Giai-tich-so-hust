import type { Logger } from "@/types/solver";
import { fmtNum, parseFraction } from "./math-utils";
import { compileDerivative, compileExpression } from "./expression-evaluator";

export interface InterpolationErrorInput {
  /** Toàn bộ mốc nội suy thực sự dùng để dựng P_n */
  X: number[];
  /** Điểm cần ước lượng (nếu có) */
  xStar: number | null;
  /** Giá trị P_n(x*) đã tính (nếu có) – dùng để đối chiếu sai số thực */
  pAtXStar: number | null;
  /** Biểu thức f(x) (tùy chọn) – dùng để tự tính M_{n+1} */
  errFx?: string;
  /** Giá trị M_{n+1} cho trước (tùy chọn, ưu tiên hơn errFx) */
  errM?: string;
  /** Tiêu đề section (cho phép đánh số theo từng thuật toán) */
  sectionTitle?: string;
  /** Mốc cách đều: bước lưới h, để hiển thị w = h^{n+1} t(t-1)...(t-n) */
  uniformStep?: number;
}

/** Định dạng số rất nhỏ dưới dạng a × 10^b (LaTeX) */
function fmtSci(v: number, digits = 4): string {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0) return "0";
  if (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e4) return fmtNum(v, 6);
  const [mantissa, exp] = v.toExponential(digits).split("e");
  return `${mantissa} \\times 10^{${Number(exp)}}`;
}

/** Tìm max |g| trên [lo, hi] bằng lấy mẫu mịn + tinh chỉnh quanh điểm tốt nhất */
function maxAbsOnInterval(
  g: (x: number) => number,
  lo: number,
  hi: number,
  samples = 4000,
): { max: number; at: number } {
  if (hi - lo < 1e-14) return { max: Math.abs(g(lo)), at: lo };

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

  // Tinh chỉnh 2 lần quanh điểm tốt nhất
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

function factorialOf(k: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f;
}

/**
 * Đánh giá sai số nội suy đa thức (Định lý phần dư):
 *   |R(x)| <= M_{n+1} / (n+1)! * |w_{n+1}(x)|,  w_{n+1}(x) = prod (x - x_i),
 *   M_{n+1} = max_{[a,b]} |f^{(n+1)}(x)|.
 * Chỉ chạy khi người dùng nhập `errFx` hoặc `errM` (đề bài có yêu cầu).
 * Áp dụng chung cho Lagrange / Newton tiến-lùi (mốc bất kỳ & cách đều)
 * vì cùng là một đa thức nội suy duy nhất qua n+1 mốc.
 */
export function logInterpolationErrorEstimate(
  logger: Logger,
  input: InterpolationErrorInput,
): void {
  const errFx = (input.errFx ?? "").trim();
  const errMStr = (input.errM ?? "").trim();
  if (errFx === "" && errMStr === "") return;

  const { X, xStar, pAtXStar, uniformStep } = input;
  const n = X.length - 1;
  const factN1 = factorialOf(n + 1);

  logger.section(input.sectionTitle ?? "ĐÁNH GIÁ SAI SỐ NỘI SUY");

  // ── 1. Công thức ───────────────────────────────────────
  logger.formula(
    `$$|R(x)| = |f(x) - P_{${n}}(x)| \\le \\frac{M_{${n + 1}}}{${n + 1}!}\\,|w_{${n + 1}}(x)|, \\qquad w_{${n + 1}}(x) = \\prod_{i=0}^{${n}}(x - x_i), \\qquad M_{${n + 1}} = \\max_{[a,b]} |f^{(${n + 1})}(x)|$$`,
  );
  if (uniformStep !== undefined) {
    logger.formula(
      `$$x = x_0 + th \\implies |w_{${n + 1}}(x)| = h^{${n + 1}}\\,|t(t-1)\\cdots(t-${n})|, \\quad h = ${fmtNum(uniformStep)}$$`,
    );
  }

  // ── 2. Đoạn [a, b] ─────────────────────────────────────
  const a0 = Math.min(...X);
  const b0 = Math.max(...X);
  let a = a0;
  let b = b0;
  const extrapolating = xStar !== null && (xStar < a0 - 1e-12 || xStar > b0 + 1e-12);
  if (extrapolating && xStar !== null) {
    a = Math.min(a0, xStar);
    b = Math.max(b0, xStar);
    logger.warn(
      `$x^* = ${fmtNum(xStar)}$ nằm ngoài $[${fmtNum(a0)}, ${fmtNum(b0)}]$ (ngoại suy). ` +
        `$M_{${n + 1}}$ phải lấy trên đoạn chứa cả $x^*$ nên dùng $[a, b] = [${fmtNum(a)}, ${fmtNum(b)}]$; sai số ngoại suy thường lớn.`,
    );
  }
  logger.info(
    `$a = \\min x_i = ${fmtNum(a)}$, $b = \\max x_i = ${fmtNum(b)}$, $n + 1 = ${n + 1}$ nên cần $f^{(${n + 1})}(x)$.`,
  );

  // ── 3. Xác định M_{n+1} ────────────────────────────────
  let M: number | null = null;
  let fnTrue: ((x: number) => number) | null = null;

  if (errFx !== "") {
    try {
      fnTrue = compileExpression(errFx);
    } catch {
      fnTrue = null;
    }
  }

  if (errMStr !== "") {
    const parsed = parseFraction(errMStr);
    if (!Number.isFinite(parsed) || parsed < 0) {
      logger.error("Giá trị $M_{n+1}$ nhập vào không hợp lệ (cần số không âm).");
      return;
    }
    M = parsed;
    logger.info(`Dùng $M_{${n + 1}} = ${fmtNum(M, 6)}$ do đề bài cho trước.`);
  } else {
    try {
      const { fn: dfn, tex } = compileDerivative(errFx, n + 1);
      if (tex.length <= 300) {
        logger.formula(`$$f^{(${n + 1})}(x) = ${tex}$$`);
      }
      const { max, at } = maxAbsOnInterval(dfn, a, b);
      M = max;
      logger.result(
        `$$M_{${n + 1}} = \\max_{x \\in [${fmtNum(a)}, ${fmtNum(b)}]} |f^{(${n + 1})}(x)| \\approx ${fmtNum(M, 6)} \\quad (\\text{tại } x \\approx ${fmtNum(at, 4)})$$`,
      );
      logger.info(
        "$M_{n+1}$ được xác định bằng lấy mẫu mịn trên $[a, b]$ (xấp xỉ rất sát giá trị lớn nhất thật).",
      );
    } catch (e) {
      logger.error(
        `Không tính được $M_{${n + 1}}$ từ biểu thức $f(x)$: ${(e as Error).message} ` +
          "Hãy nhập trực tiếp giá trị $M_{n+1}$.",
      );
      return;
    }
  }

  // ── 4. Sai số tại x* ───────────────────────────────────
  if (xStar !== null) {
    const factors = X.map((xi) => `(${fmtNum(xStar)} - ${fmtNum(xi)})`).join("");
    let w = 1;
    for (const xi of X) w *= xStar - xi;
    logger.formula(`$$w_{${n + 1}}(x^*) = ${factors} = ${fmtSci(w)}$$`);
    const bound = (M / factN1) * Math.abs(w);
    logger.result(
      `$$|R(${fmtNum(xStar)})| \\le \\frac{${fmtNum(M, 6)}}{${n + 1}!}\\cdot |${fmtSci(w)}| = ${fmtSci(bound)}$$`,
    );

    if (fnTrue && pAtXStar !== null) {
      try {
        const fTrue = fnTrue(xStar);
        const actual = Math.abs(fTrue - pAtXStar);
        logger.info(
          `Đối chiếu: $f(x^*) = ${fmtNum(fTrue, 6)}$, $P_{${n}}(x^*) = ${fmtNum(pAtXStar, 6)}$ nên sai số thực $|f(x^*) - P_{${n}}(x^*)| = ${fmtSci(actual)}$ ` +
            (actual <= bound * (1 + 1e-9) + 1e-15
              ? "$\\le$ cận trên ✔"
              : "$>$ cận trên (kiểm tra lại $f(x)$ / $M$)"),
        );
      } catch {
        /* bỏ qua đối chiếu nếu f(x*) không tính được */
      }
    }
  } else {
    logger.info("Chưa nhập $x^*$ nên chỉ đánh giá sai số lớn nhất trên toàn đoạn.");
  }

  // ── 5. Sai số lớn nhất trên toàn đoạn [a, b] ───────────
  const wFn = (x: number) => X.reduce((p, xi) => p * (x - xi), 1);
  const { max: wMax, at: wAt } = maxAbsOnInterval(wFn, a, b);
  const globalBound = (M / factN1) * wMax;
  logger.formula(
    `$$\\|w_{${n + 1}}\\| = \\max_{[a,b]} |w_{${n + 1}}(x)| \\approx ${fmtSci(wMax)} \\quad (\\text{tại } x \\approx ${fmtNum(wAt, 4)})$$`,
  );
  logger.result(
    `$$\\|f - P_{${n}}\\| = \\max_{[a,b]}|f(x) - P_{${n}}(x)| \\le \\frac{M_{${n + 1}}}{${n + 1}!}\\,\\|w_{${n + 1}}\\| \\approx ${fmtSci(globalBound)}$$`,
  );
}

