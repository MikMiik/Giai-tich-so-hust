import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  factorial,
  logCentralDifferenceTable,
  parseCentralInput,
} from "./central-difference";

export function runStirlingInterpolation(
  params: Record<string, string>,
  logger: Logger,
): void {
  const input = parseCentralInput(params, logger, "centerIndex");
  if (!input) return;
  const { X, Y, xStar, center, h } = input;

  if (X.length % 2 === 0 || center !== Math.floor(X.length / 2)) {
    logger.error("Sterling yêu cầu số mốc lẻ và mốc trung tâm là phần tử chính giữa của bảng.");
    return;
  }

  const m = Math.floor(X.length / 2);
  const t = (xStar - X[center]) / h;
  if (Math.abs(t) > 0.5) logger.warn("Sterling cho kết quả tốt nhất khi x* nằm gần mốc trung tâm.");

  logger.section("ĐẦU VÀO");
  logger.formula(`$$x_0=${fmtNum(X[center])}, \\quad h=${fmtNum(h)}, \\quad t=\\frac{x^*-x_0}{h}=${fmtNum(t)}$$`);

  const delta = buildForwardDifferenceTable(Y);
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  logCentralDifferenceTable(logger, X, Y, delta, center);

  logger.section("HỆ SỐ CHẴN VÀ LẺ");
  logger.formula("$$C_{\\text{lẻ},i}=\\frac{\\Delta^{2i-1}y_{-i+1}+\\Delta^{2i-1}y_{-i}}{2(2i-1)!}, \\quad C_{\\text{chẵn},i}=\\frac{\\Delta^{2i}y_{-i}}{(2i)!}$$");
  const even = [Y[center]];
  const odd = [0];
  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$y_0$",
    "$C_{\\text{chẵn},0}$": `$${fmtNum(Y[center])}$`,
    "$C_{\\text{lẻ},0}$": "—",
  }];
  for (let i = 1; i <= m; i++) {
    const oddLeft = delta[center - i][2 * i - 1];
    const oddRight = delta[center - i + 1][2 * i - 1];
    const oddValue = (oddLeft + oddRight) / (2 * factorial(2 * i - 1));
    const evenValue = delta[center - i][2 * i] / factorial(2 * i);
    odd.push(oddValue);
    even.push(evenValue);
    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\Delta^{${2 * i}}y_{${-i}},\\quad \\frac{\\Delta^{${2 * i - 1}}y_{${1 - i}}+\\Delta^{${2 * i - 1}}y_{${-i}}}{2}$`,
      "$C_{\\text{chẵn},i}$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ},i}$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);

  let evenValue = even[0];
  let oddValue = 0;
  let evenDerivative = 0;
  let oddDerivative = 0;
  let base = 1;
  let baseDerivative = 0;
  const evenTerms = [fmtNum(even[0])];
  const oddTerms: string[] = [];

  for (let i = 1; i <= m; i++) {
    if (i > 1) {
      const shift = i - 1;
      const factor = t * t - shift * shift;
      const factorDerivative = 2 * t;
      baseDerivative = baseDerivative * factor + base * factorDerivative;
      base *= factor;
    }
    const evenBasis = base * t * t;
    const evenBasisDerivative = baseDerivative * t * t + base * 2 * t;
    const oddBasis = base * t;
    const oddBasisDerivative = baseDerivative * t + base;
    evenValue += even[i] * evenBasis;
    oddValue += odd[i] * oddBasis;
    evenDerivative += even[i] * evenBasisDerivative;
    oddDerivative += odd[i] * oddBasisDerivative;

    const baseLabel = i === 1 ? "" : Array.from({ length: i - 1 }, (_, index) => `(t^2-${(index + 1) ** 2})`).join("");
    evenTerms.push(`+ ${fmtNum(even[i])}t^2${baseLabel}`);
    oddTerms.push(`+ ${fmtNum(odd[i])}t${baseLabel}`);
  }

  logger.section("ĐA THỨC STERLING");
  logger.formula(`$$P_{\\text{chẵn}}(t) = ${evenTerms.join(" ")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(t) = ${oddTerms.length ? oddTerms.join(" ").replace("+ ", "") : "0"}$$`);
  logger.formula(`$$P(t) = P_{\\text{chẵn}}(t) + P_{\\text{lẻ}}(t)$$`);

  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(t)})=${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(t)})=${fmtNum(oddValue)}$$`);
  logger.result(`$$P(${fmtNum(xStar)})=${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{P'(t)}{h}=${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
