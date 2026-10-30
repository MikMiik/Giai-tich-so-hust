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

  logger.section("ĐẦU VÀO");
  logger.formula(`$$P(x) = ${fmtPoly(bCoeffs)}, \\qquad A(x) = ${linearPolyStr}P(x)$$`);

  // Theo thuật toán, nối thêm hệ số 0 để cùng áp dụng một quy tắc cho
  // tất cả hệ số của tích: a_i = B_i - c · a_(i+1).
  const inputCoeffs = [...bCoeffs, 0];
  const aCoeffs: number[] = Array(m + 2).fill(0);
  const tableData: Record<string, unknown>[] = [];

  logger.section("TÍNH HỆ SỐ THEO THỨ TỰ GIẢM DẦN");
  logger.info(
    `Nối $0$ vào cuối dãy hệ số: $$B = [${inputCoeffs.map((value) => fmtNum(value)).join(", ")}]$$`,
  );
  logger.formula(
    `$$a_{${m + 1}} = b_${m}, \\qquad a_i = B_{${m + 1}-i} - c \\cdot a_{i + 1} \\quad (i = ${m}, \\ldots, 0)$$`,
  );

  aCoeffs[0] = bCoeffs[0];
  tableData.push({
    "Hệ số": `$a_{${m + 1}}$`,
    "Tính": `$a_{${m + 1}} = b_{${m}} = ${fmtNum(aCoeffs[0])}$`,
  });

  for (let index = 1; index <= m + 1; index++) {
    const power = m + 1 - index;
    const source = inputCoeffs[index];
    const previous = aCoeffs[index - 1];
    const product = c * previous;
    const value = source - product;
    aCoeffs[index] = value;

    tableData.push({
      "Hệ số": `$a_{${power}}$`,
      "Tính": `$a_{${power}} = ${fmtNum(source)} - (${cFmt}) \\cdot (${fmtNum(previous)}) = ${fmtNum(value)}$`,
    });
  }

  logger.table(tableData);
  logger.separator();

  logger.section("KẾT QUẢ");

  logger.result(`$$\\{a_{${m + 1}}, a_{${m}}, \\dots, a_0\\} = \\{${aCoeffs.map((v) => fmtNum(v)).join(", ")}\\}$$`);
  logger.result(`$$A(x) = ${fmtPoly(aCoeffs)}$$`);
}
