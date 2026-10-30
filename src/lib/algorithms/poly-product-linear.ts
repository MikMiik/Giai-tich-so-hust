import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs } from "./math-utils";

export function runPolyProductLinear(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { cList: cListStr } = params;

  // 1. Parse dãy nghiệm c_1, c_2, ..., c_n
  const cValues = parseCoeffs(cListStr);
  if (cValues.length === 0) {
    logger.error(
      "Vui lòng nhập dãy nghiệm $c_k$ hợp lệ (ví dụ: `1.2 1.5 1.7 2.1`).",
    );
    return;
  }

  const n = cValues.length; // Số nhân tử / Bậc đa thức kết quả

  // Biểu diễn dạng tích các nhân tử
  const factorStrings = cValues.map((c) => {
    const cFmt = fmtNum(c);
    return c >= 0 ? `(x - ${cFmt})` : `(x + ${fmtNum(Math.abs(c))})`;
  });
  const productFormula = factorStrings.join(" \\cdot ");

  logger.section("ĐẦU VÀO");
  logger.formula(`$$P(x) = \\prod_{k=1}^{${n}} (x - c_k) = ${productFormula}$$`);

  // Khởi tạo và cập nhật theo từng nhân tử như trong thuật toán.
  logger.section("NHÂN DỒN HỆ SỐ");

  // Khởi tạo mảng A độ dài n + 1: A = [0, 0, ..., 0, 1]
  // Vị trí i = 0 tương ứng x^n, i = 1 tương ứng x^(n-1), ..., i = n tương ứng x^0 (hệ số tự do 1)
  let A: number[] = Array(n + 1).fill(0);
  A[n] = 1;
  logger.info(`Khởi tạo: $$A^{(0)} = [${A.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.formula(
    `$$B_i = A_{i+1} - c_k \\cdot A_i \\quad (i=n,\\ldots,0), \\qquad A_{n+1}=0, \\qquad A \\leftarrow B$$`,
  );

  const tableData: Record<string, unknown>[] = [];

  const initRow: Record<string, unknown> = {
    "Bước": "$A^{(0)}$",
    "Nhân tử": "—",
  };
  for (let i = 0; i <= n; i++) {
    const power = n - i;
    const colHeader = power === 0 ? "$1$" : power === 1 ? "$x$" : `$x^{${power}}$`;
    initRow[colHeader] = fmtNum(A[i]);
  }
  tableData.push(initRow);

  // Lặp k = 1 .. n (tương ứng với mỗi nghiệm c_k)
  for (let k = 1; k <= n; k++) {
    const ck = cValues[k - 1];
    const B: number[] = Array(n + 1).fill(0);

    for (let i = n; i >= 0; i--) {
      const prevA = i === n ? 0 : A[i + 1];
      B[i] = prevA - ck * A[i];
    }

    A = B;

    // Thêm hàng vào bảng
    const rowObj: Record<string, unknown> = {
      "Bước": `$A^{(${k})}$`,
      "Nhân tử": `$${factorStrings[k - 1]}$`,
    };
    for (let i = 0; i <= n; i++) {
      const power = n - i;
      const colHeader = power === 0 ? "$1$" : power === 1 ? "$x$" : `$x^{${power}}$`;
      rowObj[colHeader] = fmtNum(A[i]);
    }
    tableData.push(rowObj);
  }

  logger.table(tableData);
  logger.separator();

  logger.section("KẾT QUẢ");
  const aCoeffs = [...A]; // [a_n, a_{n-1}, ..., a_0]

  logger.result(`$$P(x) = ${fmtPoly(aCoeffs)}$$`);
}
