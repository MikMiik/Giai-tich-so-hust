import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";

export function runPolyMultiplyLinear(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { coeffs: coeffsStr, c: cStr } = params;

  // 1. Parse dãy hệ số B = [b_m, b_{m-1}, ..., b_0]
  const bCoeffs = parseCoeffs(coeffsStr);
  if (bCoeffs.length === 0) {
    logger.error("Vui lòng nhập dãy hệ số đa thức $P(x)$ hợp lệ (ví dụ: `2 3 -1`).");
    return;
  }

  // 2. Parse hằng số c
  const c = parseFraction(cStr);
  if (isNaN(c)) {
    logger.error(`Hằng số $c = "${cStr}"$ không hợp lệ.`);
    return;
  }

  const m = bCoeffs.length - 1; // Bậc của đa thức P(x)
  const cFmt = fmtNum(c);
  const linearPolyStr = c >= 0 ? `(x - ${cFmt})` : `(x + ${fmtNum(Math.abs(c))})`;

  logger.section("1. ĐA THỨC ĐẦU VÀO VÀ THIẾT LẬP");
  logger.info(`Bậc của đa thức $P(x)$: $m = ${m}$`);
  logger.formula(`$$P(x) = ${fmtPoly(bCoeffs)}$$`);
  logger.info(`Đa thức bậc nhất: $Q_1(x) = ${linearPolyStr}$ (với $c = ${cFmt}$)`);
  logger.formula(
    `$$\\text{Mục tiêu: Tính } A(x) = ${linearPolyStr} \\cdot P(x) = a_{${m + 1}} x^{${m + 1}} + a_{${m}} x^{${m}} + \\dots + a_0$$`,
  );

  // 3. Thực hiện thuật toán
  logger.section("2. QUÁ TRÌNH TÍNH TOÁN CÁC HỆ SỐ a_i");

  // Dãy b có m+1 phần tử: bCoeffs[0] = b_m, bCoeffs[1] = b_{m-1}, ..., bCoeffs[m] = b_0
  // Đặt b_arr: b_arr[k] là hệ số của x^k trong P(x) (0 <= k <= m)
  const bPow: number[] = [];
  for (let i = 0; i <= m; i++) {
    bPow[m - i] = bCoeffs[i]; // bPow[k] là hệ số của x^k
  }

  // a có m+2 phần tử từ a_{m+1} đến a_0
  const aPow: number[] = Array(m + 2).fill(0);
  const tableData: Record<string, unknown>[] = [];

  // a_{m+1} = b_m
  aPow[m + 1] = bPow[m];
  tableData.push({
    "Bậc $i$": `$x^{${m + 1}}$`,
    "Hệ số $a_i$": `$a_{${m + 1}}$`,
    "Công thức": `$b_{${m}}$`,
    "Phép tính": `$${fmtNum(bPow[m])}$`,
    "Giá trị $a_i$": `$${fmtNum(aPow[m + 1])}$`,
  });

  // a_i = b_{i-1} - c * b_i (với i = m lùi về 1)
  for (let i = m; i >= 1; i--) {
    const term1 = bPow[i - 1];
    const term2 = c * bPow[i];
    aPow[i] = term1 - term2;

    const term2Sign = c * bPow[i] >= 0 ? `- ${fmtNum(term2)}` : `+ ${fmtNum(Math.abs(term2))}`;
    tableData.push({
      "Bậc $i$": `$x^{${i}}$`,
      "Hệ số $a_i$": `$a_{${i}}$`,
      "Công thức": `$b_{${i - 1}} - c \\cdot b_{${i}}$`,
      "Phép tính": `$${fmtNum(term1)} ${term2Sign}$`,
      "Giá trị $a_i$": `$${fmtNum(aPow[i])}$`,
    });
  }

  // a_0 = -c * b_0
  aPow[0] = -c * bPow[0];
  tableData.push({
    "Bậc $i$": `$x^0$`,
    "Hệ số $a_i$": `$a_0$`,
    "Công thức": `$-c \\cdot b_0$`,
    "Phép tính": `$-(${cFmt}) \\cdot (${fmtNum(bPow[0])})$`,
    "Giá trị $a_i$": `$${fmtNum(aPow[0])}$`,
  });

  logger.table(tableData);
  logger.separator();

  // 4. Tổng hợp kết quả
  logger.section("3. KẾT QUẢ ĐA THỨC TÍCH A(x)");
  const aCoeffs: number[] = [];
  for (let i = m + 1; i >= 0; i--) {
    aCoeffs.push(aPow[i]);
  }

  logger.success("✔ Hoàn thành phép nhân đa thức.");
  logger.result(`$$\\{a_{${m + 1}}, a_{${m}}, \\dots, a_0\\} = \\{${aCoeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`);
  logger.result(`$$A(x) = ${fmtPoly(aCoeffs)}$$`);
}
