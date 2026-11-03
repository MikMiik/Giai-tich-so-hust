import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";
import { logInterpolationErrorEstimate } from "./interpolation-error";

interface UniformErrorParams {
  errFx?: string;
  errM?: string;
}

// ---------------------------------------------------------------------------
// Helper: Lập bảng sai phân lùi
// nabla[i][0] = Y[i]
// nabla[i][j] = nabla[i][j-1] - nabla[i-1][j-1] với i = n, n-1, ..., j
// ---------------------------------------------------------------------------
function buildBackwardDiffTable(Y: number[]): number[][] {
  const n = Y.length;
  const d: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) d[i][0] = Y[i];
  for (let j = 1; j < n; j++) {
    for (let i = n - 1; i >= j; i--) {
      d[i][j] = d[i][j - 1] - d[i - 1][j - 1];
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// Helper: Hiển thị bảng sai phân lùi với in đậm hàng cuối cùng c_k = d[n-1][k]
// ---------------------------------------------------------------------------
function logBackwardDiffTable(
  logger: Logger,
  X: number[],
  Y: number[],
  d: number[][],
  numPoints: number,
  labelX = true,
): void {
  const n = numPoints - 1;
  const tableData: Record<string, unknown>[] = [];

  for (let i = 0; i < numPoints; i++) {
    const rowObj: Record<string, unknown> = {};
    if (labelX) rowObj["$x_i$"] = `$${fmtNum(X[i])}$`;
    rowObj["$y_i$"] = i === n ? `**$${fmtNum(Y[i])}$**` : `$${fmtNum(Y[i])}$`;

    for (let j = 1; j <= n; j++) {
      const colTitle = `$\\nabla^{${j}}y$`;
      if (i >= j) {
        const val = d[i][j];
        rowObj[colTitle] = i === n ? `**$${fmtNum(val)}$**` : `$${fmtNum(val)}$`;
      } else {
        rowObj[colTitle] = "—";
      }
    }
    tableData.push(rowObj);
  }
  logger.table(tableData);
  logger.info(
    "💡 **Ghi chú:** Các số in đậm ở hàng cuối cùng là hệ số Newton lùi: " +
      "$c_k = \\nabla^k y_n$.",
  );
}

// ---------------------------------------------------------------------------
// Helper: Tính giá trị P_n(t) theo biến chuẩn hóa t (lùi từ mốc x_n)
// P_n(t) = c₀ + (c₁/1!)t + (c₂/2!)t(t+1) + (c₃/3!)t(t+1)(t+2) + ...
// ---------------------------------------------------------------------------
function evalPnByT(c: number[], t: number): number {
  let result = c[0];
  let prod = 1;
  let factorial = 1;
  for (let k = 1; k < c.length; k++) {
    prod *= t + (k - 1);
    factorial *= k;
    result += (c[k] / factorial) * prod;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helper: Tính đạo hàm P'_n(t) theo biến chuẩn hóa t
// P'_n(t) = c₁ + c₂/2! * (2t + 1) + c₃/3! * d/dt[t(t+1)(t+2)] + ...
// ---------------------------------------------------------------------------
function evalPnDerivByT(c: number[], t: number): number {
  let result = 0;
  let factorial = 1;
  for (let k = 1; k < c.length; k++) {
    factorial *= k;
    let dProd = 0;
    for (let m = 0; m < k; m++) {
      let term = 1;
      for (let j = 0; j < k; j++) {
        if (j !== m) {
          term *= t + j;
        }
      }
      dProd += term;
    }
    result += (c[k] / factorial) * dProd;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helper: Xây biểu diễn LaTeX của P_n(t) dạng khai triển c_k/k! * t(t+1)...(t+k-1)
// ---------------------------------------------------------------------------
function buildPnTLatex(c: number[], n: number): string {
  const terms: string[] = [];
  terms.push(fmtNum(c[0]));

  let factorial = 1;
  for (let k = 1; k <= n; k++) {
    factorial *= k;
    const coeff = c[k] / factorial;
    if (Math.abs(coeff) < 1e-14) continue;

    const coeffAbs = Math.abs(coeff);
    const sign = coeff >= 0 ? "+ " : "- ";

    const factors: string[] = [];
    for (let j = 0; j < k; j++) {
      if (j === 0) {
        factors.push("t");
      } else {
        factors.push(`(t + ${j})`);
      }
    }

    terms.push(`${sign}${fmtNum(coeffAbs)} \\cdot ${factors.join("")}`);
  }
  return terms.join(" \\\\ ");
}

// ---------------------------------------------------------------------------
// Helper: Khai triển P_n(t) về dạng chính tắc theo x
// Thay t = (x - x_n) / h vào từng hạng tử c_k/k! * t(t+1)...(t+k-1)
// Mỗi hạng tử: c_k/k! * (1/h^k) * (x - x_n)(x - x_n + h)...(x - x_n + (k-1)h)
// Nghiệm của các nhân tử là root_j = x_n - j*h = x_{n-j}
// ---------------------------------------------------------------------------
function expandToStandardCoeffs(
  c: number[],
  xn: number,
  h: number,
  n: number,
): number[] {
  const polyPow: number[] = Array(n + 1).fill(0);
  polyPow[0] = c[0];

  let factorial = 1;
  for (let k = 1; k <= n; k++) {
    factorial *= k;
    const ck_over_k_fact = c[k] / factorial;

    if (Math.abs(ck_over_k_fact) < 1e-14) continue;

    let W: number[] = [1];

    for (let j = 0; j < k; j++) {
      const root = xn - j * h; // root of factor (x - (xn - j*h)) = (x - x_{n-j})
      const nextW: number[] = Array(W.length + 1).fill(0);
      nextW[0] = W[0];
      for (let p = 1; p < W.length; p++) {
        nextW[p] = W[p] - root * W[p - 1];
      }
      nextW[W.length] = -root * W[W.length - 1];
      W = nextW;
    }

    const scale = ck_over_k_fact / Math.pow(h, k);

    for (let p = 0; p <= k; p++) {
      polyPow[p] += scale * W[p];
    }
  }

  const standardCoeffs: number[] = [];
  for (let power = n; power >= 0; power--) {
    standardCoeffs.push(polyPow[power]);
  }
  return standardCoeffs;
}

// ---------------------------------------------------------------------------
// CORE: Chạy Newton lùi mốc cách đều cho mảng Xsub, Ysub
// ---------------------------------------------------------------------------
function runCoreUniformBackward(
  logger: Logger,
  Xsub: number[],
  Ysub: number[],
  xStar: number | null,
  sectionOffset = 0,
  errorParams: UniformErrorParams = {},
): void {
  const numPoints = Xsub.length;
  const n = numPoints - 1;
  const xn = Xsub[n];
  const h = Xsub[1] - Xsub[0];

  const sIdx = (i: number) => i + sectionOffset;

  // --- Bảng sai phân lùi ---
  logger.section(`${sIdx(1)}. BẢNG SAI PHÂN LÙI ($\\nabla^k y$)`);
  const d = buildBackwardDiffTable(Ysub);
  logBackwardDiffTable(logger, Xsub, Ysub, d, numPoints);
  logger.separator();

  // Hệ số c_k = d[n][k] (hàng cuối cùng)
  const c: number[] = [];
  for (let k = 0; k <= n; k++) {
    c.push(d[n][k]);
  }

  logger.section(`${sIdx(2)}. HỆ SỐ NEWTON LÙI`);
  const coeffRows: Record<string, unknown>[] = c.map((ck, k) => ({
    $k$: `$${k}$`,
    "$c_k = \\nabla^k y_n$": `$${fmtNum(ck)}$`,
    "$c_k / k!$": `$${fmtNum(ck / factorial(k))}$`,
  }));
  logger.table(coeffRows);
  logger.separator();

  // --- Dạng đa thức theo t ---
  logger.section(`${sIdx(3)}. ĐA THỨC NEWTON LÙI THEO BIẾN $t$`);
  logger.formula(`$$t = \\frac{x - ${fmtNum(xn)}}{${fmtNum(h)}}$$`);
  logger.formula(`$$P_{${n}}(t) = ${buildPnTLatex(c, n)}$$`);
  logger.info(
    `Khai triển $P_{${n}}(t)$ rồi thay $t = \\frac{x - ${fmtNum(xn)}}{${fmtNum(h)}}$ để ra dạng chính tắc theo $x$.`,
  );
  logger.separator();

  // --- Khai triển chính tắc theo x ---
  logger.section(`${sIdx(4)}. ĐA THỨC KHAI TRIỂN CHÍNH TẮC THEO $x$`);
  const standardCoeffs = expandToStandardCoeffs(c, xn, h, n);
  logger.success(
    `✔ Hoàn thành khai triển đa thức nội suy Newton lùi (cách đều).`,
  );
  logger.result(
    `$$\\{a_{${n}}, \\dots, a_0\\} = \\{${standardCoeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`,
  );
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(standardCoeffs)}$$`);

  // --- Tính giá trị và đạo hàm tại x* ---
  let valStarForError: number | null = null;
  if (xStar !== null) {
    logger.section(`${sIdx(5)}. TÍNH GIÁ TRỊ VÀ ĐẠO HÀM TẠI ĐIỂM ƯỚC LƯỢNG`);
    const tStar = (xStar - xn) / h;
    logger.formula(
      `$$t^* = \\frac{x^* - ${fmtNum(xn)}}{${fmtNum(h)}} = \\frac{${fmtNum(xStar)} - ${fmtNum(xn)}}{${fmtNum(h)}} = ${fmtNum(tStar)}$$`,
    );
    const valStar = evalPnByT(c, tStar);
    const dValStarT = evalPnDerivByT(c, tStar);
    const dValStarX = dValStarT / h;
    logger.result(
      `$$P_{${n}}(${fmtNum(xStar)}) = P_{${n}}(t^* = ${fmtNum(tStar)}) = ${fmtNum(valStar)}$$`,
    );
    logger.result(
      `$$P'_{${n}}(t^* = ${fmtNum(tStar)}) = ${fmtNum(dValStarT)} \\implies f'(${fmtNum(xStar)}) \\approx \\frac{1}{h} P'_{${n}}(t^*) = \\frac{${fmtNum(dValStarT)}}{${fmtNum(h)}} = ${fmtNum(dValStarX)}$$`,
    );
    valStarForError = valStar;
  }

  // --- Đánh giá sai số (nếu đề yêu cầu) ---
  if (
    (errorParams.errFx ?? "").trim() !== "" ||
    (errorParams.errM ?? "").trim() !== ""
  ) {
    logInterpolationErrorEstimate(logger, {
      X: Xsub,
      xStar,
      pAtXStar: valStarForError,
      errFx: errorParams.errFx,
      errM: errorParams.errM,
      sectionTitle: `${sIdx(6)}. ĐÁNH GIÁ SAI SỐ NỘI SUY`,
      uniformStep: h,
    });
  }
}

function factorial(k: number): number {
  if (k <= 1) return 1;
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function runNewtonUniformBackward(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { mode, xList: xListStr, yList: yListStr, xVal: xValStr } = params;

  const X = parseCoeffs(xListStr);
  const Y = parseCoeffs(yListStr);

  if (X.length === 0) {
    logger.error("Vui lòng nhập danh sách các mốc $x_i$ hợp lệ.");
    return;
  }
  if (Y.length === 0) {
    logger.error("Vui lòng nhập danh sách các giá trị $y_i$ hợp lệ.");
    return;
  }
  if (X.length !== Y.length) {
    logger.error(
      `Số lượng mốc $x$ (${X.length}) và giá trị $y$ (${Y.length}) phải bằng nhau.`,
    );
    return;
  }
  if (X.length < 2) {
    logger.error("Cần ít nhất 2 điểm mốc để xây dựng đa thức nội suy.");
    return;
  }

  // Kiểm tra cách đều
  const h0 = X[1] - X[0];
  if (Math.abs(h0) < 1e-12) {
    logger.error(
      "Bước lưới $h = x_1 - x_0 = 0$. Các mốc phải đôi một khác nhau.",
    );
    return;
  }
  for (let i = 2; i < X.length; i++) {
    const hi = X[i] - X[i - 1];
    if (Math.abs(hi - h0) / Math.abs(h0) > 1e-6) {
      logger.error(
        `Các mốc $x_i$ không cách đều. Thuật toán này yêu cầu bước lưới $h$ không đổi. ` +
          `Phát hiện $h_{${i - 1}} = ${fmtNum(hi)} \\neq h_0 = ${fmtNum(h0)}$.`,
      );
      return;
    }
  }

  const isAlgo2 = mode === "algo2";

  if (!isAlgo2) {
    // =====================================================================
    // THUẬT TOÁN 1 — Toàn bộ bảng
    // =====================================================================
    const N = X.length;
    const n = N - 1;

    logger.section("1. BẢNG DỮ LIỆU ĐẦU VÀO");
    logger.info(
      `Số mốc nội suy: $N = ${N}$ (Bậc đa thức tối đa $n = ${n}$) — Bước lưới $h = ${fmtNum(h0)}$`,
    );

    const inputTable: Record<string, unknown>[] = X.map((xi, i) => ({
      $i$: `$${i}$`,
      $x_i$: `$${fmtNum(xi)}$`,
      $y_i$: `$${fmtNum(Y[i])}$`,
    }));
    logger.table(inputTable);

    logger.formula(
      `$$t = \\frac{x - x_n}{h} = \\frac{x - ${fmtNum(X[n])}}{${fmtNum(h0)}}$$`,
    );
    logger.formula(
      `$$P_n(t) = c_0 + \\frac{c_1}{1!}t + \\frac{c_2}{2!}t(t+1) + \\cdots + \\frac{c_n}{n!}t(t+1)\\cdots(t+n-1)$$`,
    );
    logger.separator();

    const xStar =
      xValStr && xValStr.trim() !== "" ? parseFraction(xValStr) : null;
    const xStarValid = xStar !== null && !isNaN(xStar);

    runCoreUniformBackward(logger, X, Y, xStarValid ? xStar : null, 1, params);
  } else {
    // =====================================================================
    // THUẬT TOÁN 2 — Tự động chọn mốc tối ưu quanh x*
    // =====================================================================
    const xStar = parseFraction(xValStr ?? "");
    if (isNaN(xStar)) {
      logger.error("Thuật toán 2 yêu cầu nhập điểm cần tính $x^*$ hợp lệ.");
      return;
    }

    const N = X.length; // Tổng số mốc (index 0..N-1)

    if (xStar < X[0] || xStar > X[N - 1]) {
      logger.warn(
        `Điểm $x^* = ${fmtNum(xStar)}$ nằm ngoài phạm vi mốc $[${fmtNum(X[0])}, ${fmtNum(X[N - 1])}]$ (Ngoại suy). Độ chính xác có thể giảm.`,
      );
    }

    logger.section("1. BẢNG DỮ LIỆU ĐẦU VÀO (Toàn bộ)");
    logger.info(
      `Tổng số mốc: $N_{total} = ${N}$, bước lưới $h = ${fmtNum(h0)}$. Điểm cần tính $x^* = ${fmtNum(xStar)}$.`,
    );
    const inputTable: Record<string, unknown>[] = X.map((xi, i) => ({
      $i$: `$${i}$`,
      $x_i$: `$${fmtNum(xi)}$`,
      $y_i$: `$${fmtNum(Y[i])}$`,
    }));
    logger.table(inputTable);
    logger.separator();

    // Bước 1: K, n
    logger.section("2. XÁC ĐỊNH SỐ MỐC VÀ MỐC BẮT ĐẦU TỐI ƯU");
    const K = Math.max(1, Math.round(1 / Math.abs(h0)));
    const n = Math.max(2, K + 1); // số mốc cần chọn (tối thiểu 2 mốc)
    logger.info(
      `$K = \\max\\left(1, \\text{round}\\left(\\frac{1}{|h|}\\right)\\right) = \\max\\left(1, \\text{round}\\left(\\frac{1}{${fmtNum(Math.abs(h0))}}\\right)\\right) = ${K}$ khoảng`,
    );
    logger.info(
      `Số mốc cần chọn: $n = K + 1 = ${n}$ mốc (bậc đa thức $= n - 1 = ${n - 1}$)`,
    );

    if (n > N) {
      logger.error(
        `Số mốc cần thiết $n = ${n}$ vượt quá tổng số mốc $N = ${N}$. Cần thêm dữ liệu hoặc tăng bước lưới.`,
      );
      return;
    }

    // Bước 2: pos, idx
    const pos = Math.floor((xStar - X[0]) / h0);
    let idx = Math.max(0, pos - Math.floor(n / 2));
    if (idx + n - 1 > N - 1) idx = N - n;
    if (idx < 0) idx = 0;

    logger.formula(
      `$$pos = \\left\\lfloor \\frac{x^* - x_0}{h} \\right\\rfloor = \\left\\lfloor \\frac{${fmtNum(xStar)} - ${fmtNum(X[0])}}{${fmtNum(h0)}} \\right\\rfloor = ${pos}$$`,
    );
    logger.formula(
      `$$idx = \\max\\left(0,\\; pos - \\left\\lfloor \\frac{n}{2} \\right\\rfloor\\right) = \\max\\left(0,\\; ${pos} - ${Math.floor(n / 2)}\\right) = ${idx}$$`,
    );
    logger.info(
      `Kiểm tra biên: $idx + n - 1 = ${idx + n - 1}$ (kích thước bảng $N - 1 = ${N - 1}$) → ${idx + n - 1 <= N - 1 ? "✅ Không tràn biên" : `⚠️ Tràn biên → điều chỉnh idx = ${idx}`}`,
    );
    logger.separator();

    // Bước 3: Mảng con
    const Xsub = X.slice(idx, idx + n);
    const Ysub = Y.slice(idx, idx + n);

    logger.section("3. MẢNG CON ĐÃ CHỌN");
    logger.info(
      `Chọn $${n}$ mốc từ chỉ số $idx = ${idx}$ đến $${idx + n - 1}$ (mốc kết thúc $x_n = ${fmtNum(Xsub[n - 1])}$):`,
    );
    const subTable: Record<string, unknown>[] = Xsub.map((xi, i) => ({
      "$i_{sub}$": `$${i}$`,
      "$i_{gốc}$": `$${idx + i}$`,
      $x_i$: `$${fmtNum(xi)}$`,
      $y_i$: `$${fmtNum(Ysub[i])}$`,
    }));
    logger.table(subTable);
    logger.separator();

    // Bước 4-5: Áp core lên mảng con
    runCoreUniformBackward(logger, Xsub, Ysub, xStar, 3, params);
  }
}

