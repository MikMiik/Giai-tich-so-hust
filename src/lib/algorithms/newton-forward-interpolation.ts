import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";

export function runNewtonForwardInterpolation(
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
  const n = numPoints - 1; // Bậc đa thức Newton tối đa

  if (n < 1) {
    logger.error("Cần ít nhất 2 điểm mốc để xây dựng đa thức nội suy ($n \\ge 1$).");
    return;
  }

  // Kiểm tra trùng lặp mốc x_i
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
    `$$\\text{Dạng tổng quát: } P_n(x) = c_0 + \\sum_{k=1}^{${n}} c_k \\prod_{j=0}^{k-1} (x - x_j) \\quad \\text{với } c_k = f[x_0, x_1, \\dots, x_k]$$`,
  );

  // 2. Tính bảng tỷ sai phân (Divided Differences)
  logger.section("2. BẢNG TỶ SAI PHÂN");

  // dd[i][j]: tỷ sai phân cấp j kết thúc tại điểm i (i >= j)
  const dd: number[][] = Array.from({ length: numPoints }, () =>
    Array(numPoints).fill(0),
  );

  for (let i = 0; i < numPoints; i++) {
    dd[i][0] = Y[i];
  }

  for (let j = 1; j < numPoints; j++) {
    for (let i = j; i < numPoints; i++) {
      const denom = X[i] - X[i - j];
      dd[i][j] = (dd[i][j - 1] - dd[i - 1][j - 1]) / denom;
    }
  }

  // Dãy hệ số Newton tiến c_k = dd[k][k]
  const c: number[] = [];
  for (let k = 0; k < numPoints; k++) {
    c.push(dd[k][k]);
  }

  // Hiển thị bảng tỷ sai phân trực quan
  const diffTableData: Record<string, unknown>[] = [];
  for (let i = 0; i < numPoints; i++) {
    const rowObj: Record<string, unknown> = {
      "$x_i$": `$${fmtNum(X[i])}$`,
      "$y_i$": i === 0 ? `**$${fmtNum(Y[i])}$**` : `$${fmtNum(Y[i])}$`,
    };

    for (let j = 1; j < numPoints; j++) {
      const colTitle = `Cấp ${j}`;
      if (j <= i) {
        const val = dd[i][j];
        rowObj[colTitle] = i === j ? `**$${fmtNum(val)}$**` : `$${fmtNum(val)}$`;
      } else {
        rowObj[colTitle] = "—";
      }
    }
    diffTableData.push(rowObj);
  }
  logger.table(diffTableData);
  logger.info("💡 **Ghi chú:** Các số in đậm trên đường chéo chính là các hệ số Newton tiến: $c_k = f[x_0, \\dots, x_k]$.");
  logger.separator();

  // 3. Biểu diễn dạng tường minh Newton tiến
  logger.section("3. ĐA THỨC NEWTON TIẾN DẠNG PHÂN TÍCH (TƯỜNG MINH)");

  const explicitTerms: string[] = [];
  explicitTerms.push(fmtNum(c[0]));

  for (let k = 1; k < numPoints; k++) {
    const ck = c[k];
    const ckAbs = Math.abs(ck);
    const sign = ck >= 0 ? "+ " : "- ";

    const factorTerms: string[] = [];
    for (let j = 0; j < k; j++) {
      const xj = X[j];
      factorTerms.push(xj >= 0 ? `(x - ${fmtNum(xj)})` : `(x + ${fmtNum(Math.abs(xj))})`);
    }

    explicitTerms.push(`${sign}${fmtNum(ckAbs)}${factorTerms.join("")}`);
  }

  logger.formula(`$$P_{${n}}(x) = ${explicitTerms.join(" \\\\ ")}$$`);
  logger.separator();

  // 4. Khai triển về dạng chính tắc P_n(x) = a_n x^n + ... + a_0
  // Nhân dồn đa thức cơ sở W_k(x) = \prod_{j=0}^{k-1} (x - x_j) và cộng dồn c_k * W_k(x)
  let W: number[] = [1]; // Bậc 0: W_0(x) = 1
  // P_coeffs biểu diễn từ bậc cao đến bậc 0: [a_n, a_{n-1}, ..., a_0]
  // Để thuận tiện cộng dồn theo bậc từ 0 đến n:
  const polyPow: number[] = Array(numPoints).fill(0); // polyPow[p] là hệ số của x^p
  polyPow[0] = c[0];

  for (let k = 1; k < numPoints; k++) {
    const xPrev = X[k - 1];
    // Nhân W với (x - xPrev)
    // W hiện có bậc k-1 (k phần tử: [w_{k-1}, ..., w_0])
    const nextW: number[] = Array(W.length + 1).fill(0);
    nextW[0] = W[0];
    for (let j = 1; j < W.length; j++) {
      nextW[j] = W[j] - xPrev * W[j - 1];
    }
    nextW[W.length] = -xPrev * W[W.length - 1];
    W = nextW;

    // Cộng dồn c[k] * W vào polyPow
    // nextW có bậc k, nextW[j] là hệ số của x^{k-j}
    for (let j = 0; j <= k; j++) {
      const power = k - j;
      polyPow[power] += c[k] * nextW[j];
    }
  }

  const standardCoeffs: number[] = [];
  for (let power = n; power >= 0; power--) {
    standardCoeffs.push(polyPow[power]);
  }

  logger.section("4. ĐA THỨC KHAI TRIỂN CHÍNH TẮC");
  logger.success("✔ Hoàn thành khai triển đa thức nội suy Newton tiến.");
  logger.result(
    `$$\\{a_{${n}}, a_{${n - 1}}, \\dots, a_0\\} = \\{${standardCoeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`,
  );
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(standardCoeffs)}$$`);

  // 5. Nếu người dùng nhập điểm x*, tính giá trị ước lượng P_n(x*)
  if (xValStr && xValStr.trim() !== "") {
    const xStar = parseFraction(xValStr);
    if (!isNaN(xStar)) {
      logger.section("5. TÍNH GIÁ TRỊ TẠI ĐIỂM ƯỚC LƯỢNG");
      // Tính theo công thức Newton tiến: P_n(x*) = c_0 + c_1(x* - x_0) + ...
      let valStar = c[0];
      let termProd = 1;
      for (let k = 1; k < numPoints; k++) {
        termProd *= (xStar - X[k - 1]);
        valStar += c[k] * termProd;
      }
      logger.formula(`$$x^* = ${fmtNum(xStar)}$$`);
      logger.result(`$$P_{${n}}(${fmtNum(xStar)}) = ${fmtNum(valStar)}$$`);
    }
  }
}
