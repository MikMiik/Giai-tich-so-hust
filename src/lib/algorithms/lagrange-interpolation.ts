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

  logger.section("1. BẢNG DỮ LIỆU ĐẦU VÀO");
  logger.info(`Số mốc nội suy: $N = ${numPoints}$ (Bậc đa thức tối đa $n = ${n}$)`);

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
    `$$\\text{Dạng tổng quát: } P_n(x) = \\sum_{i=0}^{${n}} y_i L_i(x) = \\sum_{i=0}^{${n}} y_i \\frac{\\prod_{j \\ne i} (x - x_j)}{D_i} = \\sum_{i=0}^{${n}} A_i \\prod_{j \\ne i} (x - x_j)$$`,
  );

  // 2. Tính mẫu số D_i và hệ số A_i = y_i / D_i
  logger.section("2. BẢNG TÍNH MẪU SỐ D_i VÀ HỆ SỐ A_i");

  const D: number[] = [];
  const A: number[] = [];
  const diffsTable: Record<string, unknown>[] = [];

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

    diffsTable.push({
      "$i$": `$${i}$`,
      "$x_i$": `$${fmtNum(X[i])}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "Các hiệu $(x_i - x_j)$": `$${diffTerms.join(" \\cdot ")}$`,
      "$D_i = \\prod (x_i - x_j)$": `$${fmtNum(di, 5)}$`,
      "$A_i = \\frac{y_i}{D_i}$": `**$${fmtNum(ai, 4)}$**`,
    });
  }

  logger.table(diffsTable);

  // 3. Biểu diễn dạng tường minh của Lagrange
  logger.section("3. ĐA THỨC LAGRANGE DẠNG TƯỜNG MINH");

  const explicitLines: string[] = [];
  for (let i = 0; i < numPoints; i++) {
    const ai = A[i];
    const aiAbs = Math.abs(ai);
    const sign = i === 0 ? (ai < 0 ? "-" : "") : ai < 0 ? "- " : "+ ";

    const factorTerms: string[] = [];
    for (let j = 0; j < numPoints; j++) {
      if (j === i) continue;
      const xj = X[j];
      const xjFmt = fmtNum(xj);
      factorTerms.push(xj >= 0 ? `(x - ${xjFmt})` : `(x + ${fmtNum(Math.abs(xj))})`);
    }

    explicitLines.push(`${sign}${fmtNum(aiAbs, 4)}${factorTerms.join("")}`);
  }

  logger.formula(`$$P_{${n}}(x) = ${explicitLines.join(" \\\\ ")}$$`);
  logger.separator();

  // 4. Khai triển thành dạng chính tắc P_n(x) = a_n x^n + ... + a_0
  // Bước 4.1: Tính w_{n+1}(x) = \prod_{k=0}^n (x - x_k)
  // w = [w_{n+1}, w_n, ..., w_0]
  let w: number[] = [1]; // Bắt đầu từ đa thức 1
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

  // Bước 4.2: Với mỗi i, chia Horner w(x) cho (x - x_i) để tìm tử số L_i_num(x), sau đó nhân A_i và cộng dồn
  // P_coeffs có bậc n, mảng [p_n, p_{n-1}, ..., p_0]
  const P_coeffs: number[] = Array(numPoints).fill(0);

  for (let i = 0; i < numPoints; i++) {
    const xi = X[i];
    const ai = A[i];

    // Chia Horner w(x) cho (x - xi)
    // w có bậc n+1, hệ số w[0] = 1, w[1], ..., w[n+1]
    const qCoeffs: number[] = Array(numPoints).fill(0);
    qCoeffs[0] = w[0];
    for (let j = 1; j < numPoints; j++) {
      qCoeffs[j] = qCoeffs[j - 1] * xi + w[j];
    }

    // Cộng dồn vào P_coeffs: P_coeffs[j] += ai * qCoeffs[j]
    for (let j = 0; j < numPoints; j++) {
      P_coeffs[j] += ai * qCoeffs[j];
    }
  }

  logger.section("4. ĐA THỨC KHAI TRIỂN CHÍNH TẮC");
  logger.success("✔ Hoàn thành khai triển đa thức nội suy Lagrange.");
  logger.result(
    `$$\\{a_{${n}}, a_{${n - 1}}, \\dots, a_0\\} = \\{${P_coeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`,
  );
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(P_coeffs)}$$`);

  // 5. Nếu người dùng nhập điểm x*, tính giá trị ước lượng P_n(x*)
  if (xValStr && xValStr.trim() !== "") {
    const xStar = parseFraction(xValStr);
    if (!isNaN(xStar)) {
      logger.section("5. TÍNH GIÁ TRỊ TẠI ĐIỂM ƯỚC LƯỢNG");
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
