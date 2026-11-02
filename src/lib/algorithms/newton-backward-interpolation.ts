import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";
import { logInterpolationErrorEstimate } from "./interpolation-error";

export function runNewtonBackwardInterpolation(
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

  logger.formula(`$$P_n(x) = \\sum_{k=0}^{${n}} c_k \\prod_{j=0}^{k-1}(x-x_{n-j})$$`);

  logger.section("TỶ SAI PHÂN VÀ VECTOR C");
  logger.formula(`$$D_{i,j} = \\frac{D_{i,j-1}-D_{i-1,j-1}}{x_i-x_{i-j}}, \\qquad c_k = D_{${n},k}$$`);

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

  // Dãy hệ số Newton lùi: b_k = dd[n][k] = f[x_{n-k}, ..., x_n] (hàng cuối cùng i = n)
  const b: number[] = [];
  for (let k = 0; k < numPoints; k++) {
    b.push(dd[n][k]);
  }

  // Hiển thị bảng tỷ sai phân trực quan
  const diffTableData: Record<string, unknown>[] = [];
  for (let i = 0; i < numPoints; i++) {
    const isLastRow = i === n;
    const rowObj: Record<string, unknown> = {
      "$x_i$": isLastRow ? `**$${fmtNum(X[i])}$**` : `$${fmtNum(X[i])}$`,
      "$y_i$": isLastRow ? `**$${fmtNum(Y[i])}$**` : `$${fmtNum(Y[i])}$`,
    };

    for (let j = 1; j < numPoints; j++) {
      const colTitle = `Cấp ${j}`;
      if (j <= i) {
        const val = dd[i][j];
        rowObj[colTitle] = isLastRow ? `**$${fmtNum(val)}$**` : `$${fmtNum(val)}$`;
      } else {
        rowObj[colTitle] = "—";
      }
    }
    diffTableData.push(rowObj);
  }
  logger.table(diffTableData);
  logger.result(`$$C = [${b.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.separator();

  logger.section("MA TRẬN ĐA THỨC CƠ SỞ LÙI A");
  logger.formula(`$$A_{0}=[0,\\ldots,0,1], \\qquad A_{k,i}=A_{k-1,i+1}-x_{n-k+1}A_{k-1,i}$$`);

  const basisRows: number[][] = [Array(numPoints).fill(0)];
  basisRows[0][n] = 1;
  for (let k = 1; k <= n; k++) {
    const previous = basisRows[k - 1];
    const current = Array(numPoints).fill(0);
    const xNode = X[n - k + 1];
    for (let i = n; i >= 0; i--) {
      const next = i === n ? 0 : previous[i + 1];
      current[i] = next - xNode * previous[i];
    }
    basisRows.push(current);
  }
  logger.table(basisRows.map((row, k) => ({
    "Hàng": `$A_${k}$`,
    "Hệ số": `$[${row.map((value) => fmtNum(value)).join(", ")}]$`,
  })));

  logger.section("KHAI TRIỂN P = C × A");
  logger.formula(`$$P_j = \\sum_{k=0}^{${n}} C_k A_{k,j}$$`);
  const standardCoeffs: number[] = [];
  for (let j = 0; j <= n; j++) {
    standardCoeffs.push(b.reduce((sum, ck, k) => sum + ck * basisRows[k][j], 0));
  }
  logger.result(`$$P = [${standardCoeffs.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.separator();

  logger.section("KẾT QUẢ");
  logger.result(`$$P_{${n}}(x) = ${fmtPoly(standardCoeffs)}$$`);

  // 5. Nếu người dùng nhập điểm x*, tính giá trị ước lượng P_n(x*)
  let xStarForError: number | null = null;
  let pStarForError: number | null = null;
  if (xValStr && xValStr.trim() !== "") {
    const xStar = parseFraction(xValStr);
    if (!isNaN(xStar)) {
      logger.section("GIÁ TRỊ NỘI SUY");
      // Tính theo công thức Newton lùi: P_n(x*) = b_0 + b_1(x* - x_n) + b_2(x* - x_n)(x* - x_{n-1}) + ...
      let valStar = b[0];
      let termProd = 1;
      for (let k = 1; k < numPoints; k++) {
        termProd *= (xStar - X[n - k + 1]);
        valStar += b[k] * termProd;
      }
      logger.formula(`$$x^* = ${fmtNum(xStar)}$$`);
      logger.result(`$$P_{${n}}(${fmtNum(xStar)}) = ${fmtNum(valStar)}$$`);
      xStarForError = xStar;
      pStarForError = valStar;
    }
  }

  // 6. Đánh giá sai số (nếu đề yêu cầu)
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
