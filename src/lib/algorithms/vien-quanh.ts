import type { Logger } from "@/types/solver";
import { getPrecisionByEpsilon, fmtNum, fmtVec, fmtMat } from "./math-utils";

type Mat = number[][];

function parseMatrix(raw: string): Mat {
  return raw
    .trim()
    .split("\n")
    .map((row) =>
      row
        .trim()
        .split(/[\s,]+/)
        .map((v) => {
          const n = parseFloat(v);
          if (isNaN(n)) throw new Error(`Giá trị không hợp lệ: "${v}"`);
          return n;
        }),
    );
}

function transpose(A: Mat): Mat {
  const m = A.length, n = A[0].length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => A[j][i]),
  );
}

function matMul(A: Mat, B: Mat): Mat {
  const m = A.length, k = A[0].length, n = B[0].length;
  return Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      Array.from({ length: k }, (_, p) => A[i][p] * B[p][j]).reduce(
        (a, b) => a + b,
        0,
      ),
    ),
  );
}

// Matrix * column vector
function matVecMul(A: Mat, x: number[]): number[] {
  return A.map((row) => row.reduce((sum, aij, j) => sum + aij * x[j], 0));
}

// Row vector * Matrix
function vecMatMul(v: number[], A: Mat): number[] {
  const m = A.length, n = A[0].length;
  const res = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      res[j] += v[i] * A[i][j];
    }
  }
  return res;
}

// Inner product (row * col)
function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

// Outer product (col * row)
function outerProduct(col: number[], row: number[]): Mat {
  return col.map((c) => row.map((r) => c * r));
}

function subMat(A: Mat, B: Mat): Mat {
  return A.map((row, i) => row.map((val, j) => val - B[i][j]));
}



function scaleVec(v: number[], s: number): number[] {
  return v.map((x) => x * s);
}

function borderingInverse(A: Mat, matrixDecimals: number, generalDecimals: number, logger: Logger, matrixName: string = "A"): Mat | null {
  const n = A.length;
  
  if (Math.abs(A[0][0]) < 1e-12) {
    logger.warn(`Phần tử $a_{11} = 0$, không thể khởi tạo nghịch đảo cấp 1 cho ${matrixName}.`);
    return null;
  }

  let Ainv: Mat = [[1 / A[0][0]]];
  logger.step(`**Khởi tạo (k = 1)**`);
  logger.formula(`$$${matrixName}_1 = \\begin{bmatrix} ${fmtNum(A[0][0], generalDecimals)} \\end{bmatrix}$$`);
  logger.formula(`$$${matrixName}_1^{-1} = \\begin{bmatrix} ${fmtNum(Ainv[0][0], generalDecimals)} \\end{bmatrix}$$`);

  for (let k = 2; k <= n; k++) {
    logger.step(`**Lặp viền quanh cấp k = ${k}**`);
    
    // Extract block elements
    const akk = A[k - 1][k - 1];
    const u = new Array(k - 1); // column vector \alpha_{k-1,1}
    const v = new Array(k - 1); // row vector \alpha_{1,k-1}
    
    for (let i = 0; i < k - 1; i++) {
      u[i] = A[i][k - 1];
      v[i] = A[k - 1][i];
    }
    
    logger.text(`- Trích xuất ma trận viền ${matrixName}_${k}:`);
    logger.formula(`$$\\alpha_{${k-1},1} = \\begin{bmatrix} ${fmtVec(u, generalDecimals)} \\end{bmatrix}^T, \\quad \\alpha_{1,${k-1}} = \\begin{bmatrix} ${fmtVec(v, generalDecimals)} \\end{bmatrix}, \\quad a_{${k}${k}} = ${fmtNum(akk, generalDecimals)}$$`);

    // m = akk - v * Ainv * u
    const Ainv_u = matVecMul(Ainv, u);
    const v_Ainv_u = dot(v, Ainv_u);
    const m = akk - v_Ainv_u;
    
    logger.formula(`$$m_${k} = a_{${k}${k}} - \\alpha_{1,${k-1}} ${matrixName}_{${k-1}}^{-1} \\alpha_{${k-1},1} = ${fmtNum(akk, generalDecimals)} - ${fmtNum(v_Ainv_u, generalDecimals)} = ${fmtNum(m, generalDecimals)}$$`);

    if (Math.abs(m) < 1e-12) {
      logger.error(`Định thức con $m_{${k}} \\approx 0$. Phương pháp viền quanh thất bại trên ma trận này.`);
      return null;
    }

    const b_kk = 1 / m;
    const beta_col = scaleVec(Ainv_u, -b_kk); // \beta_{k-1,1}
    
    const v_Ainv = vecMatMul(v, Ainv);
    const beta_row = scaleVec(v_Ainv, -b_kk); // \beta_{1,k-1}
    
    // B_{k-1} = Ainv - beta_col * (\alpha_{1,k-1} * Ainv) = Ainv - beta_col * v_Ainv
    const beta_vAinv = outerProduct(beta_col, v_Ainv);
    const B_k1 = subMat(Ainv, beta_vAinv);

    logger.text(`- Tính các khối con của $${matrixName}_${k}^{-1}$:`);
    logger.formula(`$$b_{${k}${k}} = \\frac{1}{m_${k}} = ${fmtNum(b_kk, generalDecimals)}$$`);
    logger.formula(`$$\\beta_{${k-1},1} = -b_{${k}${k}} ${matrixName}_{${k-1}}^{-1} \\alpha_{${k-1},1} = \\begin{bmatrix} ${fmtVec(beta_col, generalDecimals)} \\end{bmatrix}^T$$`);
    logger.formula(`$$\\beta_{1,${k-1}} = -b_{${k}${k}} \\alpha_{1,${k-1}} ${matrixName}_{${k-1}}^{-1} = \\begin{bmatrix} ${fmtVec(beta_row, generalDecimals)} \\end{bmatrix}$$`);
    logger.formula(`$$B_{${k-1}} = ${matrixName}_{${k-1}}^{-1} - \\beta_{${k-1},1} \\alpha_{1,${k-1}} ${matrixName}_{${k-1}}^{-1} = ${fmtMat(B_k1, matrixDecimals)}$$`);

    // Assemble A_k^{-1}
    const nextAinv: Mat = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < k - 1; i++) {
      for (let j = 0; j < k - 1; j++) {
        nextAinv[i][j] = B_k1[i][j];
      }
      nextAinv[i][k - 1] = beta_col[i];
      nextAinv[k - 1][i] = beta_row[i];
    }
    nextAinv[k - 1][k - 1] = b_kk;
    
    Ainv = nextAinv;
    
    logger.text(`- Ghép thành ma trận nghịch đảo cấp ${k}:`);
    logger.formula(`$$${matrixName}_${k}^{-1} = ${fmtMat(Ainv, matrixDecimals)}$$`);
  }

  return Ainv;
}

export function runVienQuanh(params: Record<string, string>, logger: Logger): void {
  const { matA } = params;

  let A: Mat;
  try {
    A = parseMatrix(matA);
  } catch (e) {
    logger.error("Lỗi đọc dữ liệu: " + (e as Error).message);
    return;
  }

  if (A.length === 0 || A.length !== A[0].length) {
    logger.error("Phương pháp viền quanh yêu cầu ma trận vuông.");
    return;
  }

  const { generalDecimals, matrixDecimals } = getPrecisionByEpsilon();

  logger.section("THÔNG TIN ĐẦU VÀO");
  logger.formula(`$$A = ${fmtMat(A, matrixDecimals)}$$`);
  
  logger.section("THUẬT TOÁN VIỀN QUANH (TRỰC TIẾP)");
  let Ainv = borderingInverse(A, matrixDecimals, generalDecimals, logger, "A");

  if (Ainv === null) {
    logger.section("XỬ LÝ NGOẠI LỆ (A^T A)");
    logger.warn("Thuật toán trực tiếp thất bại. Chuyển sang tìm ma trận nghịch đảo thông qua $M = A^TA$.");
    
    const At = transpose(A);
    const M = matMul(At, A);
    logger.step("**Bước 1: Tính ma trận đối xứng M = A^T A**");
    logger.formula(`$$M = A^T A = ${fmtMat(M, matrixDecimals)}$$`);
    
    logger.step("**Bước 2: Chạy viền quanh trên M**");
    const Minv = borderingInverse(M, matrixDecimals, generalDecimals, logger, "M");
    
    if (Minv === null) {
      logger.error("Ma trận M cũng bị suy biến hoặc lỗi số trị. Không thể tìm nghịch đảo.");
      return;
    }
    
    logger.step("**Bước 3: Tính kết quả A^{-1} = M^{-1} A^T**");
    Ainv = matMul(Minv, At);
    logger.formula(`$$A^{-1} = M^{-1} A^T = ${fmtMat(Ainv, matrixDecimals)}$$`);
  } else {
    logger.section("KẾT QUẢ CUỐI CÙNG");
    logger.formula(`$$A^{-1} = ${fmtMat(Ainv, matrixDecimals)}$$`);
  }
}
