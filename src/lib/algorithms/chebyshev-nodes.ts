import type { Logger } from "@/types/solver";
import { fmtNum, parseFraction } from "./math-utils";

export function runChebyshevNodes(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { n: nStr, a: aStr, b: bStr } = params;

  // 1. Kiểm tra và parse số lượng mốc n
  const n = parseInt(nStr?.trim() || "", 10);
  if (isNaN(n) || n <= 0) {
    logger.error("Số lượng mốc $n$ phải là một số nguyên dương ($n \\ge 1$).");
    return;
  }

  if (n > 200) {
    logger.error(
      "Số lượng mốc $n$ quá lớn ($n \\le 200$). Vui lòng nhập giá trị nhỏ hơn.",
    );
    return;
  }

  // 2. Kiểm tra và parse hai đầu mút [a, b]
  const a = parseFraction(aStr);
  const b = parseFraction(bStr);

  if (isNaN(a)) {
    logger.error(`Đầu mút $a = "${aStr}"$ không hợp lệ.`);
    return;
  }

  if (isNaN(b)) {
    logger.error(`Đầu mút $b = "${bStr}"$ không hợp lệ.`);
    return;
  }

  if (a >= b) {
    logger.error(
      `Điều kiện đoạn $[a, b]$ không thỏa mãn ($a < b$). Hiện tại: $a = ${fmtNum(a)}, b = ${fmtNum(b)}$.`,
    );
    return;
  }

  // 3. Tính toán các đại lượng cơ bản
  const xc = (a + b) / 2.0;
  const r = (b - a) / 2.0;
  const length = b - a;

  logger.section("1. THÔNG SỐ CƠ BẢN VÀ CÔNG THỨC");
  logger.info(
    `Đoạn nội suy: $[a, b] = [${fmtNum(a)}, ${fmtNum(b)}]$, độ dài đoạn $L = b - a = ${fmtNum(length)}$`,
  );
  logger.info(`Số lượng mốc nội suy cần tìm: $n = ${n}$`);
  logger.formula(
    `$$x_c = \\frac{a + b}{2} = \\frac{${fmtNum(a)} + ${fmtNum(b)}}{2} = ${fmtNum(xc)}$$`,
  );
  logger.formula(
    `$$r = \\frac{b - a}{2} = \\frac{${fmtNum(b)} - ${fmtNum(a)}}{2} = ${fmtNum(r)}$$`,
  );
  logger.formula(
    `$$\\text{Công thức mốc Chebyshev tăng dần: } x_k = x_c - r \\cos\\left(\\frac{2k - 1}{2n}\\pi\\right), \\quad k = 1, 2, \\dots, ${n}$$`,
  );

  // 4. Tính từng mốc x_k
  logger.section("2. QUÁ TRÌNH TÍNH TOÁN CHI TIẾT");

  const nodes: {
    k: number;
    angleFraction: string;
    cosVal: number;
    xk: number;
  }[] = [];

  const tableData: Record<string, unknown>[] = [];

  for (let k = 1; k <= n; k++) {
    const num = 2 * k - 1;
    const den = 2 * n;
    const angleFraction = `\\frac{${num}\\pi}{${den}}`;
    const thetaRad = (num * Math.PI) / den;

    // Xử lý góc đặc biệt để tránh sai số dấu phẩy động
    let cosVal = Math.cos(thetaRad);
    if (Math.abs(cosVal) < 1e-15) cosVal = 0;
    if (Math.abs(cosVal - 1) < 1e-15) cosVal = 1;
    if (Math.abs(cosVal + 1) < 1e-15) cosVal = -1;

    let xk = xc - r * cosVal;
    if (Math.abs(xk) < 1e-15) xk = 0;

    nodes.push({
      k,
      angleFraction,
      cosVal,
      xk,
    });

    tableData.push({
      "$k$": `$${k}$`,
      "$\\theta_k$": `$${angleFraction}$`,
      "$\\cos(\\theta_k)$": `$${fmtNum(cosVal)}$`,
      "$x_k$": `$${fmtNum(xk)}$`,
    });
  }

  logger.table(tableData);
  logger.separator();

  // 5. Tổng hợp kết quả
  logger.section("3. KẾT QUẢ DÃY MỐC NỘI SUY TỐI ƯU");
  logger.success(
    `✔ Đã xác định thành công ${n} mốc nội suy Chebyshev tối ưu trên $[${fmtNum(a)}, ${fmtNum(b)}]$.`,
  );

  const nodesFormatted = nodes.map((item) => fmtNum(item.xk));
  logger.result(
    `$$\\{x_k\\}_{k=1}^{${n}} = \\left\\{ ${nodesFormatted.join(", ")} \\right\\}$$`,
  );

  // Bất đẳng thức sắp xếp
  const ineqStr =
    `$${fmtNum(a)} < ` +
    nodes.map((item) => `x_{${item.k}} (${fmtNum(item.xk)})`).join(" < ") +
    ` < ${fmtNum(b)}$`;
  logger.info(`Thứ tự tăng dần nghiêm ngặt: ${ineqStr}`);
}
