import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";

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

  // Kiểm tra các mốc x_i có đôi một khác nhau không
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

  // ── 1. Bảng dữ liệu đầu vào ──────────────────────────────
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

  logger.formula(`$$P_n(x) = \\sum_{i=0}^{${n}} T_i \\prod_{\\substack{0 \\le j \\le ${n} \\\\ j \\ne i}}(x-x_j), \\qquad T_i = \\frac{y_i}{D_i}$$`);

  // ── 2. Hệ số T_i và D_i ──────────────────────────────────
  logger.section("HỆ SỐ $D_i$ VÀ $T_i$");

  const D: number[] = [];
  const A: number[] = [];
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
    const ai = Y[i] / di;
    A.push(ai);

    coefficientTable.push({
      "$i$": `$${i}$`,
      "$D_i = \\prod_{j \\ne i}(x_i-x_j)$": `$${diffTerms.join(" \\times ")} = ${fmtNum(di, 5)}$`,
      "$T_i = y_i / D_i$": `$\\frac{${fmtNum(Y[i])}}{${fmtNum(di, 5)}} = ${fmtNum(ai, 4)}$`,
    });
  }

  logger.table(coefficientTable);

  // ── 3. Tích cơ sở w_{n+1}(x) ─────────────────────────────
  logger.section("TÍCH CƠ SỞ $w_{n+1}(x)$");

  // Xây dựng w_{n+1}(x) = prod_{k=0}^n (x - x_k)
  // w[j] = hệ số của x^{n+1-j}  (w[0]=1 là hệ số bậc n+1)
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
  logger.formula(`$$w_{${n + 1}}(x) = \\prod_{j=0}^{${n}}(x-x_j) = ${fmtPoly(w)}$$`);
  logger.info(
    `Hệ số lưu theo thứ tự giảm dần bậc: $[w_{${n+1}}, w_n, \\ldots, w_0] = [${w.map((v) => fmtNum(v)).join(", ")}]$`,
  );

  // ── 4. Quá trình cộng dồn Horner ─────────────────────────
  logger.section("QUÁ TRÌNH CỘNG DỒN HORNER");
  logger.info(
    "Với mỗi mốc $i$: chia $w_{n+1}(x)$ cho $(x - x_i)$ bằng sơ đồ Horner thu thương $q_i(x)$, " +
    "rồi cộng $T_i \\cdot q_i(x)$ vào tích lũy $P_j$. " +
    "Bảng dưới hiển thị **giá trị tích lũy** $P_j$ sau mỗi bước $i$:",
  );

  // Cột header: P_n, P_{n-1}, ..., P_0
  const P_coeffs: number[] = Array(numPoints).fill(0);

  // Hàng khởi tạo
  const initRow: Record<string, unknown> = {
    "$i$": "Khởi tạo",
    "$T_i$": "—",
  };
  for (let j = n; j >= 0; j--) initRow[`$P_{${j}}$`] = "$0$";
  const hornerRows: Record<string, unknown>[] = [initRow];

  for (let i = 0; i < numPoints; i++) {
    const xi = X[i];
    const ai = A[i];

    // Chia Horner w(x) cho (x - xi) → thương q_i(x)
    // qCoeffs[j] = hệ số của x^{n-j} trong q_i(x)
    const qCoeffs: number[] = Array(numPoints).fill(0);
    qCoeffs[0] = w[0]; // = 1
    for (let j = 1; j < numPoints; j++) {
      qCoeffs[j] = qCoeffs[j - 1] * xi + w[j];
    }

    // Cộng dồn T_i * q_i vào P_coeffs
    for (let j = 0; j < numPoints; j++) {
      P_coeffs[j] += ai * qCoeffs[j];
    }

    // Log hàng tích lũy sau bước i
    const row: Record<string, unknown> = {
      "$i$": `$${i}$`,
      "$T_i$": `$${fmtNum(ai, 4)}$`,
    };
    for (let j = 0; j < numPoints; j++) {
      // P_coeffs[j] = hệ số x^{n-j}  => cột P_{n-j}
      row[`$P_{${n - j}}$`] = `$${fmtNum(P_coeffs[j])}$`;
    }
    hornerRows.push(row);
  }

  logger.table(hornerRows);
  logger.info(
    "Hàng cuối cùng ($i = " + n + "$) chính là tập hệ số $\\{P_n, P_{n-1}, \\ldots, P_0\\}$ của đa thức Lagrange.",
  );

  // ── 5. Kết quả ──────────────────────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(P_coeffs)}$$`);

  // 6. Nếu người dùng nhập điểm x*, tính giá trị ước lượng P_n(x*)
  if (xValStr && xValStr.trim() !== "") {
    const xStar = parseFraction(xValStr);
    if (!isNaN(xStar)) {
      logger.section("GIÁ TRỊ NỘI SUY");
      // Tính giá trị P(xStar) bằng lược đồ Horner
      let valStar = P_coeffs[0];
      for (let j = 1; j < numPoints; j++) {
        valStar = valStar * xStar + P_coeffs[j];
      }
      logger.formula(`$$x^* = ${fmtNum(xStar)}$$`);
      logger.result(`$$P_{${n}}(${fmtNum(xStar)}) = ${fmtNum(valStar)}$$`);
    }
  }
}
