import type { Logger } from "@/types/solver";
import { getPrecisionByEpsilon, parseFraction, fmtNum as fmt } from "./math-utils";
import { compileExpression } from "./expression-evaluator";
export function runLapDon(params: Record<string, string>, logger: Logger): void {
  const { phiStr, x0: x0In, q: qIn, epsilon } = params;
  try {
    const phi = compileExpression(phiStr);
    phi(0);
    const x0=parseFraction(x0In), q=parseFraction(qIn);
    if([x0,q].some(isNaN)){ logger.error("Tham số x₀ hoặc q không hợp lệ."); return; }
    if(q>=1 || q<=0){ logger.error("Hệ số co q phải nằm trong khoảng (0, 1)."); return; }

    const hasEpsilon = epsilon !== undefined && epsilon.trim() !== "";
    let eps = 0;
    if (hasEpsilon) {
      eps = parseFraction(epsilon);
      if (isNaN(eps) || eps <= 0) { logger.error("Epsilon phải là số dương."); return; }
    }

    fixedPoint1D(phi, x0, q, eps, 100, logger);
  } catch (e) {
    logger.error("Lỗi cú pháp hàm φ(x): " + (e as Error).message);
    return;
  }
}


function rnd(v: number, sig: number) {
  if(!Number.isFinite(v)) return v;
  if(Math.abs(v)<1e-15) return 0;
  const e=Math.floor(Math.log10(Math.abs(v)));
  return Math.round(v*Math.pow(10,sig-e-1))/Math.pow(10,sig-e-1);
}



function fixedPoint1D(phi: (x: number) => number, x0: number, q: number, epsilon: number, maxIter: number, logger: Logger) {
  const hasEpsilon = epsilon > 0;
  const eps0 = hasEpsilon ? ((1-q)/q)*epsilon : 0;
  const prec = getPrecisionByEpsilon(hasEpsilon ? epsilon : undefined);
  const generalDecimals = prec.generalDecimals;
  const reliableDigits = prec.reliableDigits;

  logger.section("THÔNG TIN KHỞI ĐẦU");
  logger.info(`$$x_0 = ${x0}$$`);
  logger.info(`$$q = ${q}$$ (hệ số co)`);
  if (hasEpsilon) {
    logger.info(`$$\\varepsilon = ${epsilon.toExponential(4)}$$`);
    logger.info(`$$\\varepsilon_0 = \\frac{1-q}{q}\\varepsilon = ${eps0.toExponential(4)}$$ (ngưỡng dừng)`);
  }
  logger.formula("Công thức: $$x_{n+1} = \\varphi(x_n)$$");
  if (hasEpsilon) {
    logger.formula("Điều kiện dừng: $$|x_n - x_{n-1}| < \\varepsilon_0$$");
  } else {
    logger.formula(`Lặp đúng $N_{\\max} = ${maxIter}$ lần`);
  }

  let x_prev=x0, x_curr=x0, n=0, diff=0;
  const tableData: Record<string,unknown>[] = [];
  tableData.push({ n:0, xₙ:fmt(x0,generalDecimals), "|xₙ - xₙ₋₁|":"—" });

  logger.section("QUÁ TRÌNH LẶP");

  while(n<maxIter){
    n++;
    x_curr=phi(x_prev);
    diff=Math.abs(x_curr-x_prev);
    tableData.push({ n, xₙ:fmt(x_curr,generalDecimals), "|xₙ - xₙ₋₁|":fmt(diff,generalDecimals) });
    if(hasEpsilon && diff<eps0) break;
    x_prev=x_curr;
  }

  logger.table(tableData);
  logger.separator();
  
  if (hasEpsilon) {
    logger.text(`Ngưỡng dừng $$\\varepsilon_0 = ${eps0.toExponential(4)}$$`);
    if(diff<eps0){
      logger.success(`✔ Thỏa mãn điều kiện dừng tại bước n = ${n}.`);
      logger.result(`Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): $$x \\approx ${rnd(x_curr,reliableDigits)}$$`);
    } else {
      logger.warn(`Dừng lặp sau ${maxIter} vòng do đạt giới hạn, chưa thỏa mãn sai số.`);
      logger.result(`Nghiệm xấp xỉ thu được: $$x \\approx ${fmt(x_curr,generalDecimals)}$$`);
    }
  } else {
    logger.success(`✔ Hoàn thành quá trình lặp tại bước n = ${n}.`);
    logger.result(`Nghiệm xấp xỉ thu được: $$x \\approx ${fmt(x_curr,generalDecimals)}$$`);
  }
}
