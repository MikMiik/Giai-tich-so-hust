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

  logger.section("ĐẦU VÀO");
  logger.formula(`$$P_n(x) = ${fmtPoly(aCoeffs)}, \\qquad D(x) = ${linearPolyStr}$$`);
  logger.section("SƠ ĐỒ HORNER");
  logger.formula(
    n === 0
      ? "$$r = a_0$$"
      : `$$b_n = a_n, \\qquad b_i = c b_{i+1} + a_i \\ (i=n-1,\\ldots,1), \\qquad r = c b_1 + a_0$$`,
  );

  // b_arr chứa [b_n, b_{n-1}, ..., b_1, r] (độ dài n + 1)
  const bList: number[] = [];
  const stepTableData: Record<string, unknown>[] = [];

  let currentB = aCoeffs[0];
  bList.push(currentB);
  if (n === 0) {
    stepTableData.push({
      "Hệ số": "$r$",
      "Tính": `$r = a_0 = ${fmtNum(currentB)}$`,
    });
  } else {
    stepTableData.push({
      "Hệ số": `$b_${n}$`,
      "Tính": `$b_${n} = a_${n} = ${fmtNum(currentB)}$`,
    });
  }

  // Các bước tiếp theo: b_i = b_{i+1} * c + a_i (từ a_{n-1} đến a_0)
  for (let idx = 1; idx <= n; idx++) {
    const power = n - idx;
    const ai = aCoeffs[idx];
    const prevB = currentB;
    const prod = prevB * c;
    currentB = prod + ai;
    bList.push(currentB);

    const isRemainder = idx === n;
    stepTableData.push({
      "Hệ số": isRemainder ? "$r$" : `$b_${power}$`,
      "Tính": isRemainder
        ? `$r = (${cFmt}) \\cdot (${fmtNum(prevB)}) + (${fmtNum(ai)}) = ${fmtNum(currentB)}$`
        : `$b_${power} = (${cFmt}) \\cdot (${fmtNum(prevB)}) + (${fmtNum(ai)}) = ${fmtNum(currentB)}$`,
    });
  }

  logger.table(stepTableData);
  logger.separator();

  logger.section("KẾT QUẢ");
  const qCoeffs = bList.slice(0, n); // [b_n, b_{n-1}, ..., b_1]
  const remainder = bList[n];

  if (qCoeffs.length > 0) {
    logger.result(`$$Q(x) = ${fmtPoly(qCoeffs)}$$`);
  } else {
    logger.result("$$Q(x) = 0$$");
  }
  logger.result(`$$r = P_n(${cFmt}) = ${fmtNum(remainder)}$$`);

  // Biểu diễn đẳng thức chia
  const qStr = qCoeffs.length > 0 ? `(${fmtPoly(qCoeffs)})` : "0";
  const rSign = remainder >= 0 ? `+ ${fmtNum(remainder)}` : `- ${fmtNum(Math.abs(remainder))}`;
  logger.info(
    `Đẳng thức hoàn chỉnh: $$P_n(x) = ${linearPolyStr} \\cdot ${qStr} ${rSign}$$`,
  );
}
