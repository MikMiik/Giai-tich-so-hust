import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  factorial,
  logCentralDifferenceTable,
  parseCentralInput,
} from "./central-difference";

// Định dạng hạng tử đa thức không bị "+ -3t" khi âm
function fmtTerm(coeff: number, varPart: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-14) return "";
  const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
  return `${sign}${fmtNum(Math.abs(coeff))}${varPart}`;
}

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
  if (Math.abs(t) > 0.5) logger.warn("Sterling cho kết quả tốt nhất khi $x^*$ nằm gần mốc trung tâm ($|t| \\le 0.5$).");

  // ── 1. Đầu vào ──────────────────────────────────────────
  logger.section("ĐẦU VÀO");
  logger.formula(`$$x_0=${fmtNum(X[center])}, \\quad h=${fmtNum(h)}, \\quad t=\\frac{x^*-x_0}{h}=\\frac{${fmtNum(xStar)}-${fmtNum(X[center])}}{${fmtNum(h)}}=${fmtNum(t)}$$`);

  // ── 2. Bảng sai phân hữu hạn ────────────────────────────
  const delta = buildForwardDifferenceTable(Y);
  logger.section("BẢNG SAI PHÂN HỮU HẠN $\\Delta^k y$");
  logCentralDifferenceTable(logger, X, Y, delta, center);

  // ── 3. Hệ số Stirling ───────────────────────────────────
  logger.section("HỆ SỐ STIRLING (Tách Chẵn - Lẻ)");
  logger.formula("$$C_{\\text{lẻ},i}=\\frac{\\Delta^{2i-1}y_{-i+1}+\\Delta^{2i-1}y_{-i}}{2(2i-1)!}, \\quad C_{\\text{chẵn},i}=\\frac{\\Delta^{2i}y_{-i}}{(2i)!}$$");

  const even = [Y[center]];
  const odd: number[] = [0]; // C_odd[0] không dùng, P_odd khởi tạo = 0
  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$\\Delta^0 y_0 = y_0$",
    "$C_{\\text{chẵn},i}$": `$${fmtNum(Y[center])}$`,
    "$C_{\\text{lẻ},i}$": "—",
  }];

  for (let i = 1; i <= m; i++) {
    const oddLeft  = delta[center - i + 1][2 * i - 1];
    const oddRight = delta[center - i][2 * i - 1];
    const oddValue = (oddLeft + oddRight) / (2 * factorial(2 * i - 1));
    const evenValue = delta[center - i][2 * i] / factorial(2 * i);
    odd.push(oddValue);
    even.push(evenValue);
    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\Delta^{${2*i}}y_{${-i}},\\quad \\frac{\\Delta^{${2*i-1}}y_{${1-i}}+\\Delta^{${2*i-1}}y_{${-i}}}{2}$`,
      "$C_{\\text{chẵn},i}$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ},i}$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);

  // ── 4. Tính tích lũy hai thành phần ─────────────────────
  // P_even = C_even[0] + sum_{i=1..m} C_even[i]*W*t^2
  // P_odd  = 0         + sum_{i=1..m} C_odd[i]*W*t
  // W = 1, nếu i>1: W *= (t^2 - (i-1)^2)
  let evenValue = even[0];
  let oddValue  = 0;
  let evenDerivative = 0;
  let oddDerivative  = 0;
  let base = 1;
  let baseDerivative = 0;

  const evenTerms: string[] = [fmtNum(even[0])];
  const oddTerms:  string[] = [];

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
    const oddBasis  = base * t;
    const oddBasisDerivative  = baseDerivative * t + base;

    evenValue += even[i] * evenBasis;
    oddValue  += odd[i]  * oddBasis;
    evenDerivative += even[i] * evenBasisDerivative;
    oddDerivative  += odd[i]  * oddBasisDerivative;

    // LaTeX display (không có "+ -3t" khi âm)
    const baseLabel = i === 1
      ? ""
      : Array.from({ length: i - 1 }, (_, idx) => `(t^2-${(idx + 1) ** 2})`).join("");
    const evenTerm = fmtTerm(even[i], `t^2${baseLabel}`, false);
    if (evenTerm) evenTerms.push(evenTerm);
    const oddTerm  = fmtTerm(odd[i],  `t${baseLabel}`,   oddTerms.length === 0);
    if (oddTerm) oddTerms.push(oddTerm);
  }

  // ── 5. Đa thức Stirling ──────────────────────────────────
  logger.section("ĐA THỨC STIRLING");
  logger.formula(`$$P_{\\text{chẵn}}(t) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(t) = ${oddTerms.length ? oddTerms.join("") : "0"}$$`);
  logger.formula(`$$P(t) = P_{\\text{chẵn}}(t) + P_{\\text{lẻ}}(t)$$`);

  // ── 6. Kết quả ──────────────────────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(t)})=${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(t)})=${fmtNum(oddValue)}$$`);
  logger.result(`$$P(${fmtNum(xStar)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{P'(t)}{h}=${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
