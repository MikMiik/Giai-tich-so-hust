import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  factorial,
  logCentralDifferenceTable,
  parseCentralInput,
} from "./central-difference";

export function runBesselInterpolation(
  params: Record<string, string>,
  logger: Logger,
): void {
  const input = parseCentralInput(params, logger, "centerLeftIndex");
  if (!input) return;
  const { X, Y, xStar, center, h } = input;

  if (X.length % 2 !== 0 || center !== X.length / 2 - 1) {
    logger.error("Bessel yêu cầu số mốc chẵn và chỉ số mốc trái của cặp trung tâm.");
    return;
  }

  const m = X.length / 2;
  const t = (xStar - X[center]) / h;
  const u = t - 0.5;
  if (Math.abs(u) > 0.5) logger.warn("Bessel cho kết quả tốt nhất khi x* nằm gần trung điểm của hai mốc trung tâm.");

  logger.section("ĐẦU VÀO");
  logger.formula(`$$x_0=${fmtNum(X[center])}, \\quad h=${fmtNum(h)}, \\quad t=${fmtNum(t)}, \\quad u=t-\\frac12=${fmtNum(u)}$$`);

  const delta = buildForwardDifferenceTable(Y);
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  logCentralDifferenceTable(logger, X, Y, delta, center);

  logger.section("HỆ SỐ CHẴN VÀ LẺ");
  logger.formula("$$C_{\\text{chẵn},i}=\\frac{\\Delta^{2i}y_{-i}+\\Delta^{2i}y_{-i+1}}{2(2i)!}, \\quad C_{\\text{lẻ},i}=\\frac{\\Delta^{2i+1}y_{-i}}{(2i+1)!}$$");
  const even = [(Y[center] + Y[center + 1]) / 2];
  const odd: number[] = [];
  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$\\frac{y_0+y_1}{2},\\quad \\Delta y_0$",
    "$C_{\\text{chẵn},0}$": `$${fmtNum(even[0])}$`,
    "$C_{\\text{lẻ},0}$": `$${fmtNum(delta[center][1])}$`,
  }];
  odd.push(delta[center][1]);
  for (let i = 1; i < m; i++) {
    const evenValue = (delta[center - i][2 * i] + delta[center - i + 1][2 * i]) / (2 * factorial(2 * i));
    const oddValue = delta[center - i][2 * i + 1] / factorial(2 * i + 1);
    even.push(evenValue);
    odd.push(oddValue);
    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\frac{\\Delta^{${2 * i}}y_{${-i}}+\\Delta^{${2 * i}}y_{${1 - i}}}{2},\\quad \\Delta^{${2 * i + 1}}y_{${-i}}$`,
      "$C_{\\text{chẵn},i}$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ},i}$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);

  let evenValue = even[0];
  let oddValue = odd[0] * u;
  let evenDerivative = 0;
  let oddDerivative = odd[0];
  let base = 1;
  let baseDerivative = 0;
  const evenTerms = [fmtNum(even[0])];
  const oddTerms = [`${fmtNum(odd[0])}u`];

  for (let i = 1; i < m; i++) {
    const shift = (2 * i - 1) / 2;
    const factor = u * u - shift * shift;
    const factorDerivative = 2 * u;
    baseDerivative = baseDerivative * factor + base * factorDerivative;
    base *= factor;
    evenValue += even[i] * base;
    oddValue += odd[i] * base * u;
    evenDerivative += even[i] * baseDerivative;
    oddDerivative += odd[i] * (baseDerivative * u + base);

    const baseLabel = Array.from({ length: i }, (_, index) => `(u^2-\\frac{${(2 * index + 1) ** 2}}{4})`).join("");
    evenTerms.push(`+ ${fmtNum(even[i])}${baseLabel}`);
    oddTerms.push(`+ ${fmtNum(odd[i])}u${baseLabel}`);
  }

  logger.section("ĐA THỨC BESSEL");
  logger.formula(`$$P_{\\text{chẵn}}(u) = ${evenTerms.join(" ")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(u) = ${oddTerms.join(" ")}$$`);
  logger.formula(`$$P(u) = P_{\\text{chẵn}}(u) + P_{\\text{lẻ}}(u)$$`);

  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(u)})=${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(u)})=${fmtNum(oddValue)}$$`);
  logger.result(`$$P(${fmtNum(xStar)})=${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{P'(u)}{h}=${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
