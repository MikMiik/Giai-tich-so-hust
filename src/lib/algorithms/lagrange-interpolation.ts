import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";
import { logInterpolationErrorEstimate } from "./interpolation-error";

export function runLagrangeInterpolation(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { xList: xListStr, yList: yListStr, xVal: xValStr } = params;

  // 1. Parse mảng X và Y
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

  const numPoints = X.length;
  const n = numPoints - 1; // Bậc đa thức Lagrange tối đa

  if (n < 1) {
    logger.error("Cần ít nhất 2 điểm mốc để xây dựng đa thức nội suy ($n \\ge 1$).");
    return;
  }

  // Kiểm tra các mốc x_i đôi một khác nhau
  for (let i = 0; i < numPoints; i++) {
    for (let j = i + 1; j < numPoints; j++) {
      if (Math.abs(X[i] - X[j]) < 1e-12) {
        logger.error(
          `Các mốc $x_i$ phải đôi một khác nhau. Phát hiện trùng lặp: $x_{${i}} = x_{${j}} = ${fmtNum(X[i])}$.`,
        );
        return;
      }
    }
  }

  // ── 1. Đầu vào ──────────────────────────────────────────
  logger.section("ĐẦU VÀO");

  const inputTable: Record<string, unknown>[] = [];
  for (let i = 0; i < numPoints; i++) {
    inputTable.push({
      "Điểm $i$": `$${i}$`,
      "Mốc $x_i$": `$${fmtNum(X[i])}$`,
      "Giá trị $y_i$": `$${fmtNum(Y[i])}$`,
    });
  }
  logger.table(inputTable);

  logger.formula(
    `$$P_{${n}}(x) = \\sum_{i=0}^{${n}} y_i L_i(x) = \\sum_{i=0}^{${n}} T_i \\prod_{\\substack{j=0 \\\\ j \\ne i}}^{${n}}(x-x_j), \\qquad T_i = \\frac{y_i}{D_i}$$`,
  );
  logger.separator();

  // ── 2. Bảng mẫu số D_i và hệ số T_i ──────────────────────
  logger.section("BẢNG MẪU SỐ D VÀ HỆ SỐ TỶ LỆ T");

  const D: number[] = [];
  const T: number[] = [];
  const coefficientTable: Record<string, unknown>[] = [];

  for (let i = 0; i < numPoints; i++) {
    let di = 1;
    const diffTerms: string[] = [];
    for (let j = 0; j < numPoints; j++) {
      if (j === i) continue;
      const diff = X[i] - X[j];
      di *= diff;
      diffTerms.push(`(${fmtNum(diff)})`);
    }

    D.push(di);
    const ti = Y[i] / di;
    T.push(ti);

    coefficientTable.push({
      "$i$": `$${i}$`,
      "$x_i$": `$${fmtNum(X[i])}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "Các hiệu $(x_i - x_j)$": `$${diffTerms.join(" \\cdot ")}$`,
      "$D_i = \\prod(x_i - x_j)$": `$${fmtNum(di, 5)}$`,
      "$T_i = y_i / D_i$": `**$${fmtNum(ti, 4)}$**`,
    });
  }

  logger.table(coefficientTable);

  // Dạng tường minh của đa thức từ bảng
  const explicitTerms = T.map((ti, i) => {
    const factors = X.filter((_, j) => j !== i).map(
      (xj) => `(x - ${fmtNum(xj)})`,
    );
    const sign = ti >= 0 && i > 0 ? "+ " : "";
    return `${sign}${fmtNum(ti, 4)}${factors.join("")}`;
  });
  logger.formula(`$$P_{${n}}(x) = \\sum_{i=0}^{${n}} T_i \\prod_{\\substack{j=0 \\\\ j \\ne i}}^{${n}} (x - x_j)$$`);
  logger.formula(`$$= ${explicitTerms.join(" \\\\ ")}$$`);
  logger.separator();

  // ── 3. Tích cơ sở w_{n+1}(x) ─────────────────────────────
  logger.section("TÍCH CƠ SỞ W(x)");
  logger.formula(
    `$$w_{${n + 1}}(x) = \\prod_{k=0}^{${n}}(x-x_k) = [w_{${n + 1}}, w_{${n}}, \\ldots, w_0]$$`,
  );

  // Xây dựng w_{n+1}(x) = prod_{k=0}^n (x - x_k)
  // w lưu theo thứ tự giảm dần bậc: w[0] = hệ số x^{n+1}, ..., w[n+1] = hệ số tự do
  let w: number[] = [1];
  for (let k = 0; k < numPoints; k++) {
    const xk = X[k];
    const nextW: number[] = Array(w.length + 1).fill(0);
    nextW[0] = w[0];
    for (let j = 1; j < w.length; j++) {
      nextW[j] = w[j] - xk * w[j - 1];
    }
    nextW[w.length] = -xk * w[w.length - 1];
    w = nextW;
  }
  logger.result(`$$w_{${n + 1}}(x) = ${fmtPoly(w)}$$`);
  logger.result(`$$w = [${w.map((v) => fmtNum(v)).join(", ")}]$$`);
  logger.separator();

  // ── 4. Sơ đồ Horner và cộng dồn hệ số P ─────────────────
  logger.section("CHIA HORNER VÀ CỘNG DỒN HỆ SỐ P");
  logger.formula(
    `$$c = w_{${n+1}}, \\quad P_{${n}} \\leftarrow P_{${n}} + T_i \\cdot c$$`,
  );
  logger.formula(
    `$$c \\leftarrow c \\cdot x_i + w_{j+1}, \\quad P_j \\leftarrow P_j + T_i \\cdot c \\quad (j = ${n - 1}, \\ldots, 0)$$`,
  );

  const P_coeffs: number[] = Array(numPoints).fill(0);

  // Bảng theo dõi giá trị P_j tích lũy qua từng bước lặp
  const initRow: Record<string, unknown> = {
    "Bước": "Khởi tạo",
    "$x_i$": "—",
    "$T_i$": "—",
  };
  for (let j = n; j >= 0; j--) initRow[`$P_{${j}}$`] = "$0$";
  const hornerRows: Record<string, unknown>[] = [initRow];

  for (let i = 0; i < numPoints; i++) {
    const xi = X[i];
    const ti = T[i];

    // Chia Horner w(x) cho (x - xi)
    // qCoeffs[j] = hệ số của x^{n-j} trong thương q_i(x)
    const qCoeffs: number[] = Array(numPoints).fill(0);
    qCoeffs[0] = w[0];
    for (let j = 1; j < numPoints; j++) {
      qCoeffs[j] = qCoeffs[j - 1] * xi + w[j];
    }

    // Cộng dồn T_i * q_i vào P_coeffs
    for (let j = 0; j < numPoints; j++) {
      P_coeffs[j] += ti * qCoeffs[j];
    }

    const row: Record<string, unknown> = {
      "Bước": `$i = ${i}$`,
      "$x_i$": `$${fmtNum(xi)}$`,
      "$T_i$": `$${fmtNum(ti, 4)}$`,
    };
    for (let j = 0; j < numPoints; j++) {
      row[`$P_{${n - j}}$`] = `$${fmtNum(P_coeffs[j])}$`;
    }
    hornerRows.push(row);
  }

  logger.table(hornerRows);
  logger.separator();

  // ── 5. Kết quả ──────────────────────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P = [${P_coeffs.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(P_coeffs)}$$`);

  // ── 6. Giá trị nội suy (nếu có) ─────────────────────────
  let xStarForError: number | null = null;
  let pStarForError: number | null = null;
  if (xValStr && xValStr.trim() !== "") {
    const xStar = parseFraction(xValStr);
    if (!isNaN(xStar)) {
      logger.separator();
      logger.section("GIÁ TRỊ NỘI SUY");
      let valStar = P_coeffs[0];
      for (let j = 1; j < numPoints; j++) {
        valStar = valStar * xStar + P_coeffs[j];
      }
      logger.formula(`$$x^* = ${fmtNum(xStar)}$$`);
      logger.result(`$$P_{${n}}(${fmtNum(xStar)}) = ${fmtNum(valStar)}$$`);
      xStarForError = xStar;
      pStarForError = valStar;
    }
  }

  // ── 7. Đánh giá sai số (nếu đề yêu cầu) ─────────────────
  if ((params.errFx ?? "").trim() !== "" || (params.errM ?? "").trim() !== "") {
    logger.separator();
    logInterpolationErrorEstimate(logger, {
      X,
      xStar: xStarForError,
      pAtXStar: pStarForError,
      errFx: params.errFx,
      errM: params.errM,
    });
  }
}
