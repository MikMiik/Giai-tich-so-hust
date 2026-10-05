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

  logger.section("1. THIẾT LẬP BÀI TOÁN TÍCH NHIỀU ĐA THỨC");
  logger.info(`Số lượng nhân tử bậc nhất: $n = ${n}$`);
  logger.info(`Dãy nghiệm: $c = [${cValues.map((v) => fmtNum(v)).join(", ")}]$`);
  logger.formula(`$$P(x) = \\prod_{k=1}^{${n}} (x - c_k) = ${productFormula}$$`);
  logger.formula(
    `$$\\text{Mục tiêu: Khai triển } P(x) = a_{${n}} x^{${n}} + a_{${n - 1}} x^{${n - 1}} + \\dots + a_1 x + a_0$$`,
  );

  // 2. Thực hiện thuật toán nhân dồn
  logger.section("2. BẢNG TÍNH TOÁN NHÂN DỒN TỪNG BƯỚC");

  // Khởi tạo mảng A độ dài n + 1: A = [0, 0, ..., 0, 1]
  // Vị trí i = 0 tương ứng x^n, i = 1 tương ứng x^(n-1), ..., i = n tương ứng x^0 (hệ số tự do 1)
  let A: number[] = Array(n + 1).fill(0);
  A[n] = 1;

  const tableData: Record<string, unknown>[] = [];

  // Hàng khởi tạo (k = 0)
  const initRow: Record<string, unknown> = {
    "$c_k$": "—",
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
      "$c_k$": fmtNum(ck),
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

  // 3. Tổng hợp kết quả
  logger.section("3. KẾT QUẢ ĐA THỨC KHAI TRIỂN");
  const aCoeffs = [...A]; // [a_n, a_{n-1}, ..., a_0]

  logger.success(`✔ Khai triển thành công tích ${n} đa thức bậc nhất.`);
  logger.result(
    `$$\\{a_{${n}}, a_{${n - 1}}, \\dots, a_0\\} = \\{${aCoeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`,
  );
  logger.result(`$$P(x) = ${fmtPoly(aCoeffs)}$$`);
  logger.info(`Đẳng thức hoàn chỉnh: $$${productFormula} = ${fmtPoly(aCoeffs)}$$`);
}
