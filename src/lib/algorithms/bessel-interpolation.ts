import type { Logger } from "@/types/solver";
import { fmtNum } from "./math-utils";
import {
  buildForwardDifferenceTable,
  factorial,
  logCentralDifferenceTable,
  parseCentralInput,
} from "./central-difference";

// Định dạng hạng tử đa thức không bị "+ -3u" khi âm
function fmtTerm(coeff: number, varPart: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-14) return "";
  const sign = isFirst ? (coeff < 0 ? "-" : "") : coeff < 0 ? " - " : " + ";
  return `${sign}${fmtNum(Math.abs(coeff))}${varPart}`;
}

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
  if (Math.abs(u) > 0.5) logger.warn("Bessel cho kết quả tốt nhất khi $x^*$ nằm gần trung điểm của hai mốc trung tâm ($|u| \\le 0.5$).");

  // ── 1. Đầu vào ──────────────────────────────────────────
  logger.section("ĐẦU VÀO");
  logger.formula(`$$x_0=${fmtNum(X[center])},\\; x_1=${fmtNum(X[center+1])},\\; h=${fmtNum(h)}$$`);
  logger.formula(`$$t=\\frac{x^*-x_0}{h}=${fmtNum(t)}, \\quad u=t-\\frac{1}{2}=${fmtNum(u)}$$`);

  // ── 2. Bảng sai phân hữu hạn ────────────────────────────
  const delta = buildForwardDifferenceTable(Y);
  logger.section("BẢNG SAI PHÂN HỮU HẠN");
  logCentralDifferenceTable(logger, X, Y, delta, center);

  // ── 3. Hệ số Bessel ─────────────────────────────────────
  logger.section("HỆ SỐ BESSEL (Tách Chẵn - Lẻ)");
  logger.formula("$$C_{\\text{chẵn},i}=\\frac{\\Delta^{2i}y_{-i}+\\Delta^{2i}y_{-i+1}}{2(2i)!}, \\quad C_{\\text{lẻ},i}=\\frac{\\Delta^{2i+1}y_{-i}}{(2i+1)!}$$");

  // C_even[0] = (y0+y1)/2 ; C_odd[0] = Delta_{0,1} / 1!
  const even: number[] = [(Y[center] + Y[center + 1]) / 2];
  const odd: number[]  = [delta[center][1]]; // = Delta_{0,1} / 1!

  const rows: Record<string, unknown>[] = [{
    "$i$": "$0$",
    "Sai phân được lấy": "$\\frac{y_0+y_1}{2},\\quad \\Delta y_0$",
    "$C_{\\text{chẵn},0}$": `$${fmtNum(even[0])}$`,
    "$C_{\\text{lẻ},0}$": `$${fmtNum(odd[0])}$`,
  }];

  for (let i = 1; i < m; i++) {
    const evenValue = (delta[center - i][2 * i] + delta[center - i + 1][2 * i]) / (2 * factorial(2 * i));
    const oddValue  = delta[center - i][2 * i + 1] / factorial(2 * i + 1);
    even.push(evenValue);
    odd.push(oddValue);
    rows.push({
      "$i$": `$${i}$`,
      "Sai phân được lấy": `$\\frac{\\Delta^{${2*i}}y_{${-i}}+\\Delta^{${2*i}}y_{${1-i}}}{2},\\quad \\Delta^{${2*i+1}}y_{${-i}}$`,
      "$C_{\\text{chẵn},i}$": `$${fmtNum(evenValue)}$`,
      "$C_{\\text{lẻ},i}$": `$${fmtNum(oddValue)}$`,
    });
  }
  logger.table(rows);

  // ── 4. Tính tích lũy hai thành phần ─────────────────────
  // P_even = C_even[0] + sum_{i=1..m-1} C_even[i] * W_even
  // P_odd  = C_odd[0]*u + sum_{i=1..m-1} C_odd[i]  * W_odd
  // W_even = W_odd = 1 khởi tạo; sau đó nhân với (u^2 - ((2i-1)/2)^2) mỗi bước

  let evenValue = even[0];
  let oddValue  = odd[0] * u;
  let evenDerivative = 0;
  let oddDerivative  = odd[0]; // d/du [C_odd[0]*u] = C_odd[0]
  let base = 1;
  let baseDerivative = 0;

  const evenTerms: string[] = [fmtNum(even[0])];
  const oddTerms:  string[] = [
    fmtTerm(odd[0], "u", true) || "0",
  ];

  for (let i = 1; i < m; i++) {
    const shift = (2 * i - 1) / 2;
    const factor = u * u - shift * shift;
    const factorDerivative = 2 * u;
    baseDerivative = baseDerivative * factor + base * factorDerivative;
    base *= factor;

    evenValue += even[i] * base;
    oddValue  += odd[i]  * base * u;
    evenDerivative += even[i] * baseDerivative;
    oddDerivative  += odd[i]  * (baseDerivative * u + base);

    // LaTeX display (không có "+ -3u" khi âm)
    const baseLabel = Array.from({ length: i }, (_, idx) =>
      `\\left(u^2-\\frac{${(2 * idx + 1) ** 2}}{4}\\right)`
    ).join("");
    const evenTerm = fmtTerm(even[i], baseLabel, false);
    if (evenTerm) evenTerms.push(evenTerm);
    const oddTerm  = fmtTerm(odd[i], `u${baseLabel}`, false);
    if (oddTerm) oddTerms.push(oddTerm);
  }

  // ── 5. Đa thức Bessel ────────────────────────────────────
  logger.section("ĐA THỨC BESSEL");
  logger.formula(`$$P_{\\text{chẵn}}(u) = ${evenTerms.join("")}$$`);
  logger.formula(`$$P_{\\text{lẻ}}(u) = ${oddTerms.join("")}$$`);
  logger.formula(`$$P(u) = P_{\\text{chẵn}}(u) + P_{\\text{lẻ}}(u)$$`);

  // ── 6. Kết quả ──────────────────────────────────────────
  logger.section("KẾT QUẢ");
  logger.result(`$$P_{\\text{chẵn}}(${fmtNum(u)})=${fmtNum(evenValue)}, \\quad P_{\\text{lẻ}}(${fmtNum(u)})=${fmtNum(oddValue)}$$`);
  logger.result(`$$P(${fmtNum(xStar)}) = ${fmtNum(evenValue)} + ${fmtNum(oddValue)} = ${fmtNum(evenValue + oddValue)}$$`);
  logger.result(`$$f'(${fmtNum(xStar)}) \\approx \\frac{P'(u)}{h}=${fmtNum((evenDerivative + oddDerivative) / h)}$$`);
}
