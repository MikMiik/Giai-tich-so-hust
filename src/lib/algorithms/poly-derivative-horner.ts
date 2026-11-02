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

  // Khởi tạo mảng b_j với j = 0 .. n (tương ứng b[0] = a_0, b[n] = a_n)
  // Trong đó aCoeffs[0] = a_n, aCoeffs[n] = a_0 => b[j] = aCoeffs[n - j]
  const b: number[] = [];
  for (let j = 0; j <= n; j++) {
    b[j] = aCoeffs[n - j];
  }

  logger.section("LẶP SƠ ĐỒ HORNER");
  logger.info(`Dãy khởi tạo: $$[b_0, \\ldots, b_n] = [${b.map((value) => fmtNum(value)).join(", ")}]$$`);
  logger.formula(
    `$$b_j \\leftarrow b_{j+1} \\cdot c + b_j \\quad (m=0,\\ldots,${k}; \\ j=n-1,\\ldots,m)$$`,
  );

  // Thuật toán Horner liên tiếp tính đạo hàm cấp k:
  // Khai triển Taylor: P(x) = sum_{m=0}^n d_m * (x - c)^m, với d_m = P^(m)(c) / m!
  // Mỗi tầng m (từ 0 đến k): thực hiện chia thương cho (x - c), j chạy từ n - 1 lùi về m.
  // Tại tầng m, phần tử b_m thu được chính là d_m.
  for (let m = 0; m <= k; m++) {
    logger.step(`Tầng $m = ${m}$ (tương ứng đạo hàm cấp $${m}$)`);
    const tableStep: Record<string, unknown>[] = [];

    for (let j = n - 1; j >= m; j--) {
      const prevVal = b[j];
      const upperVal = b[j + 1];
      const prod = upperVal * c;
      b[j] = prod + prevVal;

      tableStep.push({
        "Hệ số": `$b_${j}$`,
        "Tính": `$b_${j} = (${fmtNum(upperVal)}) \\cdot (${cFmt}) + (${fmtNum(prevVal)}) = ${fmtNum(b[j])}$`,
      });
    }

    if (tableStep.length > 0) {
      logger.table(tableStep);
    } else {
      logger.info(`Tầng $m = ${m} = n$: giữ nguyên $b_${m} = ${fmtNum(b[m])}$.`);
    }
  }
  logger.separator();

  logger.section("KẾT QUẢ");

  const kFact = factorial(k);
  const bTarget = b[k];
  const derivValue = kFact * bTarget;
  logger.formula(
    `$$P_n^{(${k})}(${cFmt}) = ${k}! \\cdot b_{${k}} = ${kFact} \\cdot (${fmtNum(bTarget)}) = ${fmtNum(derivValue)}$$`,
  );
  logger.result(`$$P_n^{(${k})}(${cFmt}) = ${fmtNum(derivValue)}$$`);
}
