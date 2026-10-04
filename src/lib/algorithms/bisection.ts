import type { Logger } from "@/types/solver";
import { getPrecisionByEpsilon, parseFraction, fmtNum } from "./math-utils";

export function runBisection(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { fStr, a: aIn, b: bIn, epsilon } = params;

  let f: (x: number) => number;
  try {
    f = new Function("x", `"use strict"; return (${fStr});`) as (
      x: number,
    ) => number;
    f(0);
  } catch (e) {
    logger.error("Lỗi cú pháp hàm f(x): " + (e as Error).message);
    return;
  }

  const a_num = parseFraction(aIn);
  const b_num = parseFraction(bIn);
  const hasEpsilon = epsilon !== undefined && epsilon.trim() !== "";
  let eps = 0;
  if (hasEpsilon) {
    eps = parseFraction(epsilon);
    if (isNaN(eps) || eps <= 0) {
      logger.error("Epsilon phải là số dương.");
      return;
    }
  }

  bisectionMethod(f, a_num, b_num, eps, 200, logger, hasEpsilon);
}

function roundBySignificantDigits(value: number, significantDigits: number) {
  if (!Number.isFinite(value)) return value;
  if (Math.abs(value) < 1e-15) return 0;
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimalPlaces = significantDigits - exponent - 1;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

function bisectionMethod(
  f: (x: number) => number,
  a: number,
  b: number,
  epsilon: number,
  maxIter: number,
  logger: Logger,
  hasEpsilon: boolean = true,
) {
  let fa = f(a);
  let fb = f(b);

  logger.section("KIỂM TRA ĐIỀU KIỆN ĐẦU VÀO");
  logger.info(`$$f(a) = f(${a}) = ${fa.toFixed(8)}$$`);
  logger.info(`$$f(b) = f(${b}) = ${fb.toFixed(8)}$$`);
  logger.info(`$$f(a) \\cdot f(b) = ${(fa * fb).toExponential(4)}$$`);

  if (fa * fb >= 0) {
    logger.error("f(a) và f(b) phải trái dấu. Khoảng $[a, b]$ không hợp lệ.");
    return;
  }
  logger.success("✔ $$f(a) \\cdot f(b) < 0$$ — khoảng hợp lệ.");

  const prec = getPrecisionByEpsilon(hasEpsilon ? epsilon : undefined);
  const generalDecimals = prec.generalDecimals;
  const reliableDigits = prec.reliableDigits;

  let n = 0;
  let c = 0;
  let z = 0;
  let diff = Math.abs(b - a);
  const tableData: Record<string, unknown>[] = [];

  logger.section("QUÁ TRÌNH LẶP");
  logger.formula(`Công thức: $$c = \\frac{a + b}{2}$$`);
  if (hasEpsilon) {
    logger.formula(
      `Điều kiện dừng: $$|b - a| < \\varepsilon = ${epsilon.toExponential(4)}$$`,
    );
  } else {
    logger.formula(`Lặp đúng $N_{\\max} = ${maxIter}$ lần`);
  }

  while (n < maxIter) {
    n++;
    c = (a + b) / 2.0;
    z = f(c);
    diff = Math.abs(b - a);

    tableData.push({
      n,
      a: fmtNum(a, generalDecimals),
      b: fmtNum(b, generalDecimals),
      "c (nghiệm)": fmtNum(c, generalDecimals),
      "f(c)": fmtNum(z, generalDecimals),
      "|b-a|": fmtNum(diff, generalDecimals),
    });

    if (z === 0 || (hasEpsilon && diff < epsilon)) break;

    if (fa * z < 0) {
      b = c;
      fb = z;
    } else {
      a = c;
      fa = z;
    }
  }

  logger.table(tableData);
  logger.separator();

  if (hasEpsilon) {
    logger.text(
      `Ngưỡng sai số yêu cầu: $$\\varepsilon = ${epsilon.toExponential(4)}$$`,
    );
    if (diff < epsilon || z === 0) {
      logger.success(`✔ Thỏa mãn điều kiện dừng tại bước lặp n = ${n}.`);
      const xReliable = roundBySignificantDigits(c, reliableDigits);
      logger.result(
        `Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): $$x \\approx ${xReliable}$$`,
      );
    } else {
      logger.warn(
        `Dừng lặp sau ${maxIter} vòng do đạt giới hạn, chưa thỏa mãn sai số.`,
      );
      logger.result(
        `Nghiệm xấp xỉ thu được: $$x \\approx ${fmtNum(c, generalDecimals)}$$`,
      );
    }
  } else {
    logger.success(`✔ Hoàn thành quá trình lặp tại bước n = ${n}.`);
    logger.result(
      `Nghiệm xấp xỉ thu được: $$x \\approx ${fmtNum(c, generalDecimals)}$$`,
    );
  }
}
