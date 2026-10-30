import type { Logger } from "@/types/solver";
import { fmtNum, fmtPoly, parseCoeffs, parseFraction } from "./math-utils";

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function runPolyDerivativeHorner(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { coeffs: coeffsStr, k: kStr, c: cStr } = params;

  // 1. Parse dãy hệ số A = [a_n, a_{n-1}, ..., a_0]
  const aCoeffs = parseCoeffs(coeffsStr);
  if (aCoeffs.length === 0) {
    logger.error("Vui lòng nhập dãy hệ số đa thức $P_n(x)$ hợp lệ (ví dụ: `3 -2 5 -7`).");
    return;
  }

  // 2. Parse hằng số c
  const c = parseFraction(cStr);
  if (isNaN(c)) {
    logger.error(`Điểm $c = "${cStr}"$ không hợp lệ.`);
    return;
  }

  // 3. Parse cấp đạo hàm k
  const k = parseInt(kStr?.trim() || "", 10);
  if (isNaN(k) || k < 0) {
    logger.error("Cấp đạo hàm $k$ phải là một số nguyên không âm ($k \\ge 0$).");
    return;
  }

  const n = aCoeffs.length - 1; // Bậc đa thức
  const cFmt = fmtNum(c);

  logger.section("ĐẦU VÀO");
  logger.formula(`$$P_n(x) = ${fmtPoly(aCoeffs)}, \\qquad c = ${cFmt}, \\qquad k = ${k}$$`);

  // Trường hợp k > n: Đạo hàm cấp lớn hơn bậc đa thức luôn bằng 0
  if (k > n) {
    logger.section("KẾT QUẢ");
    logger.result(`$$P_n^{(${k})}(${cFmt}) = 0$$`);
    return;
  }

  if (k === 0) {
    let value = aCoeffs[0];
    for (let index = 1; index <= n; index++) {
      value = value * c + aCoeffs[index];
    }
    logger.section("KẾT QUẢ");
    logger.result(`$$P_n^{(0)}(${cFmt}) = P_n(${cFmt}) = ${fmtNum(value)}$$`);
    return;
  }

  // Khởi tạo mảng b_j với j = 0 .. n (tương ứng b[0] = a_0, b[n] = a_n)
  // Trong đó aCoeffs[0] = a_n, aCoeffs[n] = a_0 => b[j] = aCoeffs[n - j]
  const b: number[] = [];
  for (let j = 0; j <= n; j++) {
    b[j] = aCoeffs[n - j];
  }

  logger.section("LẶP SƠ ĐỒ HORNER");
  logger.info(`Dãy khởi tạo: $$[b_0, \\ldots, b_n] = [${b.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.formula(
    `$$b_j \\leftarrow b_{j+1} \\cdot c + b_j \\quad (m=1,\\ldots,${k}; \\ j=n-1,\\ldots,m-1)$$`,
  );

  // Thuật toán:
  // Lặp m = 1 .. k
  //   Lặp j = n - 1 lùi về m - 1:
  //     b_j = b_{j+1} * c + b_j
  for (let m = 1; m <= k; m++) {
    logger.step(`Tầng $m = ${m}$`);
    const tableStep: Record<string, unknown>[] = [];

    for (let j = n - 1; j >= m - 1; j--) {
      const prevVal = b[j];
      const upperVal = b[j + 1];
      const prod = upperVal * c;
      b[j] = prod + prevVal;

      tableStep.push({
        "Hệ số": `$b_${j}$`,
        "Tính": `$b_${j} = (${fmtNum(upperVal)}) \\cdot (${cFmt}) + (${fmtNum(prevVal)}) = ${fmtNum(b[j])}$`,
      });
    }

    logger.table(tableStep);
  }
  logger.separator();

  logger.section("KẾT QUẢ");

  const kFact = factorial(k);
  let derivValue = 0;

  const bTarget = b[k - 1];
  derivValue = kFact * bTarget;
  logger.formula(
    `$$P_n^{(${k})}(${cFmt}) = ${k}! \\cdot b_{${k - 1}} = ${kFact} \\cdot (${fmtNum(bTarget)}) = ${fmtNum(derivValue)}$$`,
  );
  logger.result(`$$P_n^{(${k})}(${cFmt}) = ${fmtNum(derivValue)}$$`);
}
