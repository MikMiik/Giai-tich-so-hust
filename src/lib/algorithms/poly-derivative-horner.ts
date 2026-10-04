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

  logger.section("1. THIẾT LẬP BÀI TOÁN");
  logger.info(`Đa thức bậc $n = ${n}$: $$P_n(x) = ${fmtPoly(aCoeffs)}$$`);
  logger.info(`Điểm tính đạo hàm: $c = ${cFmt}$`);
  logger.info(`Cấp đạo hàm cần tính: $k = ${k}$`);

  // Trường hợp k > n: Đạo hàm cấp lớn hơn bậc đa thức luôn bằng 0
  if (k > n) {
    logger.section("2. KẾT QUẢ");
    logger.warn(`Cấp đạo hàm $k = ${k}$ lớn hơn bậc của đa thức ($n = ${n}$).`);
    logger.result(`$$P_n^{(${k})}(${cFmt}) = 0$$`);
    return;
  }

  // Khởi tạo mảng b_j với j = 0 .. n (tương ứng b[0] = a_0, b[n] = a_n)
  // Trong đó aCoeffs[0] = a_n, aCoeffs[n] = a_0 => b[j] = aCoeffs[n - j]
  const b: number[] = [];
  for (let j = 0; j <= n; j++) {
    b[j] = aCoeffs[n - j];
  }

  logger.section("2. QUÁ TRÌNH LẶP SƠ ĐỒ HORNER TÍNH ĐẠO HÀM");

  // Lưu lịch sử từng tầng để vẽ bảng tổng hợp
  const history: { m: number; row: number[] }[] = [];
  history.push({ m: 0, row: [...b] });

  // Thuật toán:
  // Lặp m = 1 .. k
  //   Lặp j = n - 1 lùi về m - 1:
  //     b_j = b_{j+1} * c + b_j
  for (let m = 1; m <= k; m++) {
    logger.step(`Tầng lặp Horner $m = ${m}$ (tương ứng đạo hàm cấp ${m})`);
    const tableStep: Record<string, unknown>[] = [];

    for (let j = n - 1; j >= m - 1; j--) {
      const prevVal = b[j];
      const upperVal = b[j + 1];
      const prod = upperVal * c;
      b[j] = prod + prevVal;

      tableStep.push({
        "Vị trí $j$": `$j = ${j}$`,
        "$b_{j+1} \\cdot c$": `$(${fmtNum(upperVal)}) \\cdot (${cFmt}) = ${fmtNum(prod)}$`,
        "$b_j$ (cũ)": `$${fmtNum(prevVal)}$`,
        "$b_j$ (mới)": `$${fmtNum(prod)} + (${fmtNum(prevVal)}) = ${fmtNum(b[j])}$`,
      });
    }

    logger.table(tableStep);
    history.push({ m, row: [...b] });
  }

  // Bảng tổng hợp các tầng Horner
  logger.section("BẢNG TỔNG HỢP CÁC TẦNG HORNER (KHAI TRIỂN TAYLOR)");
  const summaryTable: Record<string, unknown>[] = [];
  for (const item of history) {
    const rowObj: Record<string, unknown> = {
      "Tầng $m$": item.m === 0 ? "Gốc ($m=0$)" : `$m = ${item.m}$`,
    };
    for (let j = n; j >= 0; j--) {
      const isTarget = item.m > 0 && j === item.m - 1;
      const valStr = fmtNum(item.row[j]);
      rowObj[`$b_{${j}}$ ($x^{${j}}$)`] = isTarget ? `**${valStr}**` : valStr;
    }
    summaryTable.push(rowObj);
  }
  logger.table(summaryTable);
  logger.separator();

  // 3. Tính giá trị đạo hàm cuối cùng
  logger.section("3. KẾT QUẢ ĐẠO HÀM");

  const kFact = factorial(k);
  let derivValue = 0;

  if (k === 0) {
    derivValue = b[0];
    logger.formula(`$$P_n^{(0)}(${cFmt}) = P_n(${cFmt}) = b_0 = ${fmtNum(derivValue)}$$`);
  } else {
    const bTarget = b[k - 1];
    derivValue = kFact * bTarget;
    logger.formula(`$$k! = ${k}! = ${kFact}$$`);
    logger.formula(`$$b_{k-1} = b_{${k - 1}} = ${fmtNum(bTarget)}$$`);
    logger.formula(
      `$$P_n^{(${k})}(${cFmt}) = k! \\cdot b_{k-1} = ${kFact} \\cdot (${fmtNum(bTarget)}) = ${fmtNum(derivValue)}$$`,
    );
  }

  logger.success(`✔ Tính toán thành công đạo hàm cấp ${k} tại $x = ${cFmt}$.`);
  logger.result(`$$P_n^{(${k})}(${cFmt}) = ${fmtNum(derivValue)}$$`);
}
