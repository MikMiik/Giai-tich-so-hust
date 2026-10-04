import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";

export function runPolyDivideHorner(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { coeffs: coeffsStr, c: cStr } = params;

  // 1. Parse dãy hệ số A = [a_n, a_{n-1}, ..., a_0]
  const aCoeffs = parseCoeffs(coeffsStr);
  if (aCoeffs.length === 0) {
    logger.error("Vui lòng nhập dãy hệ số đa thức $P_n(x)$ hợp lệ (ví dụ: `1 -2 1 -3`).");
    return;
  }

  // 2. Parse hằng số c
  const c = parseFraction(cStr);
  if (isNaN(c)) {
    logger.error(`Hằng số $c = "${cStr}"$ không hợp lệ.`);
    return;
  }

  const n = aCoeffs.length - 1; // Bậc đa thức
  const cFmt = fmtNum(c);
  const linearPolyStr = c >= 0 ? `(x - ${cFmt})` : `(x + ${fmtNum(Math.abs(c))})`;

  logger.section("1. THIẾT LẬP PHÉP CHIA THEO SƠ ĐỒ HORNER");
  logger.info(`Đa thức bị chia bậc $n = ${n}$: $$P_n(x) = ${fmtPoly(aCoeffs)}$$`);
  logger.info(`Đa thức chia: $$D(x) = ${linearPolyStr} \\quad (c = ${cFmt})$$`);
  logger.formula(
    `$$\\text{Dạng khai triển: } P_n(x) = ${linearPolyStr} \\cdot Q(x) + r, \\quad Q(x) = b_n x^{${Math.max(0, n - 1)}} + \\dots + b_1$$`,
  );

  // 3. Thực hiện sơ đồ Horner
  logger.section("2. QUÁ TRÌNH TÍNH TOÁN THEO SƠ ĐỒ HORNER");

  // b_arr chứa [b_n, b_{n-1}, ..., b_1, r] (độ dài n + 1)
  const bList: number[] = [];
  const stepTableData: Record<string, unknown>[] = [];

  // Bước khởi tạo: b_n = a_n
  let currentB = aCoeffs[0];
  bList.push(currentB);

  stepTableData.push({
    "Bậc": `$x^{${n}}$`,
    "Hệ số $a_i$": `$a_{${n}} = ${fmtNum(aCoeffs[0])}$`,
    "Tích $c \\cdot b_{i+1}$": "—",
    "Kết quả": `$b_{${n}} = a_{${n}} = ${fmtNum(currentB)}$`,
  });

  // Các bước tiếp theo: b_i = b_{i+1} * c + a_i (từ a_{n-1} đến a_0)
  for (let idx = 1; idx <= n; idx++) {
    const power = n - idx;
    const ai = aCoeffs[idx];
    const prevB = currentB;
    const prod = prevB * c;
    currentB = prod + ai;
    bList.push(currentB);

    const isRemainder = idx === n;
    const targetLabel = isRemainder ? `$r = P_n(${cFmt})$` : `$b_{${power + 1}}$`;

    stepTableData.push({
      "Bậc": isRemainder ? "$x^0$ (Số dư)" : `$x^{${power}}$`,
      "Hệ số $a_i$": `$a_{${power}} = ${fmtNum(ai)}$`,
      "Tích $c \\cdot b_{i+1}$": `$(${cFmt}) \\cdot (${fmtNum(prevB)}) = ${fmtNum(prod)}$`,
      "Kết quả": `${targetLabel} $= ${fmtNum(prod)} + (${fmtNum(ai)}) = ${fmtNum(currentB)}$`,
    });
  }

  logger.table(stepTableData);

  // Hiển thị bảng sơ đồ Horner 2 dòng kinh điển
  logger.section("BẢNG SƠ ĐỒ HORNER RÚT GỌN");
  const hornerHeaders: Record<string, unknown> = {
    "$c$": `$c = ${cFmt}$`,
  };
  const hornerRowA: Record<string, unknown> = {
    "$c$": "$a_i$",
  };
  const hornerRowB: Record<string, unknown> = {
    "$c$": "$b_i, r$",
  };

  for (let i = 0; i <= n; i++) {
    const power = n - i;
    const key = `$a_{${power}}$`;
    hornerHeaders[key] = power === 0 ? "Dư $r$" : `$x^{${power}}$`;
    hornerRowA[key] = `$${fmtNum(aCoeffs[i])}$`;
    hornerRowB[key] = `$${fmtNum(bList[i])}$`;
  }

  logger.table([hornerRowA, hornerRowB]);
  logger.separator();

  // 4. Tổng hợp kết quả
  logger.section("3. KẾT QUẢ PHÉP CHIA & PHẦN DƯ");
  const qCoeffs = bList.slice(0, n); // [b_n, b_{n-1}, ..., b_1]
  const remainder = bList[n];

  logger.success("✔ Hoàn thành phép chia đa thức.");
  if (qCoeffs.length > 0) {
    logger.result(`$$\\text{Đa thức thương: } Q(x) = ${fmtPoly(qCoeffs)}$$`);
  } else {
    logger.result(`$$\\text{Đa thức thương: } Q(x) = 0$$`);
  }
  logger.result(`$$\\text{Phần dư: } r = P_n(${cFmt}) = ${fmtNum(remainder)}$$`);

  // Biểu diễn đẳng thức chia
  const qStr = qCoeffs.length > 0 ? `(${fmtPoly(qCoeffs)})` : "0";
  const rSign = remainder >= 0 ? `+ ${fmtNum(remainder)}` : `- ${fmtNum(Math.abs(remainder))}`;
  logger.info(
    `Đẳng thức hoàn chỉnh: $$P_n(x) = ${linearPolyStr} \\cdot ${qStr} ${rSign}$$`,
  );
}
