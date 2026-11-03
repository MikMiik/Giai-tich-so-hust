import { all, create } from "mathjs";
import type { Logger } from "@/types/solver";
import { fmtMat, fmtNum, parseCoeffs } from "./math-utils";
import { solveLinearSystem } from "./linear-solve";

const math = create(all);
export type FitType = "general" | "exponential" | "power" | "logarithmic";

function readBasis(expressions: string): { raw: string; evaluate: (x: number) => number }[] {
  return expressions
    .split(/\r?\n|;/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((raw) => {
      const compiled = math.compile(raw);
      return { raw, evaluate: (x: number) => Number(compiled.evaluate({ x })) };
    });
}

function vector(values: number[]): string {
  return `\\begin{bmatrix}${values.map((value) => fmtNum(value)).join(" \\\\ ")}\\end{bmatrix}`;
}

export function runLeastSquares(params: Record<string, string>, logger: Logger): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const type = (params.fitType || "general") as FitType;

  if (X.length < 2 || X.length !== Y.length) {
    logger.error("Hai dãy X và Y phải cùng độ dài và có ít nhất 2 điểm thực nghiệm.");
    return;
  }

  const n = X.length;

  // =========================================================================
  // I. THUẬT TOÁN TỔNG QUÁT: g(x) = sum_{j=1}^m a_j * phi_j(x)
  // =========================================================================
  if (type === "general") {
    let basis: { raw: string; evaluate: (x: number) => number }[];
    try {
      basis = readBasis(params.basis || "");
      if (!basis.length) throw new Error("Cần nhập ít nhất một hàm cơ sở φⱼ(x).");
    } catch (error) {
      logger.error((error as Error).message);
      return;
    }

    const m = basis.length;
    if (m > n) {
      logger.error(`Số hàm cơ sở m = ${m} không được vượt quá số điểm thực nghiệm n = ${n}.`);
      return;
    }

    let phi: number[][];
    try {
      phi = X.map((x) => basis.map((item) => item.evaluate(x)));
      if (phi.flat().some((value) => !Number.isFinite(value))) {
        throw new Error("Hàm cơ sở không cho giá trị hữu hạn tại các mốc X.");
      }
    } catch (error) {
      logger.error(`Lỗi tính hàm cơ sở: ${(error as Error).message}`);
      return;
    }

    // 1. Dữ liệu và hàm cơ sở
    logger.section("DỮ LIỆU VÀ HỆ HÀM CƠ SỞ");
    logger.info(`Mô hình tuyến tính: $g(x) = \\sum_{j=1}^{${m}} a_j \\varphi_j(x)$`);
    logger.formula(`$$n = ${n}, \\quad m = ${m}, \\quad \\{\\varphi_j(x)\\}_{j=1}^{${m}} = \\{${basis.map((item) => item.raw).join(", ")}\\}$$`);

    // 2. Ma trận thiết kế Phi
    logger.section("MA TRẬN THIẾT KẾ PHI");
    logger.formula(`$$\\Phi_{i, j} = \\varphi_j(x_i) \\implies \\Phi_{${n} \\times ${m}} = ${fmtMat(phi)}$$`);

    // 3. Ma trận Gram M và vector d
    const M = Array.from({ length: m }, (_, row) =>
      Array.from({ length: m }, (_, col) => phi.reduce((sum, values) => sum + values[row] * values[col], 0)),
    );
    const d = Array.from({ length: m }, (_, col) => phi.reduce((sum, values, row) => sum + values[col] * Y[row], 0));

    logger.section("HỆ PHƯƠNG TRÌNH CHUẨN M a = d");
    logger.formula(`$$M = \\Phi^T \\Phi = ${fmtMat(M)}, \\quad d = \\Phi^T Y = ${vector(d)}$$`);

    let a: number[];
    try {
      a = solveLinearSystem(M, d);
    } catch (error) {
      logger.error(`Không giải được hệ phương trình chuẩn: ${(error as Error).message}`);
      return;
    }
    logger.formula(`$$\\mathbf{a} = M^{-1} d = ${vector(a)}$$`);

    // 4. Đánh giá độ chính xác
    const yHat = phi.map((values) => values.reduce((sum, val, idx) => sum + val * a[idx], 0));
    const residuals = yHat.map((val, idx) => val - Y[idx]);
    const ssd = residuals.reduce((sum, e) => sum + e * e, 0);
    const rmse = Math.sqrt(ssd / n);

    logger.section("HÀM XẤP XỈ VÀ ĐÁNH GIÁ ĐỘ CHÍNH XÁC");
    const polyTerms = a.map((val, idx) => {
      const sign = val >= 0 && idx > 0 ? "+ " : "";
      return `${sign}${fmtNum(val)} \\cdot (${basis[idx].raw})`;
    }).join(" ");
    logger.result(`$$g(x) = ${polyTerms}$$`);

    const evalTable = X.map((x, i) => ({
      "$i$": `$${i + 1}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "$\\hat{y}_i$": `$${fmtNum(yHat[i])}$`,
      "$e_i = \\hat{y}_i - y_i$": `$${fmtNum(residuals[i])}$`,
      "$e_i^2$": `$${fmtNum(residuals[i] ** 2)}$`,
    }));
    logger.table(evalTable);

    logger.result(`$$S = E^T E = \\sum_{i=1}^{${n}} e_i^2 = ${fmtNum(ssd)}$$`);
    logger.result(`$$\\sigma = \\sqrt{\\frac{S}{n}} = ${fmtNum(rmse)}$$`);
    return;
  }

  // =========================================================================
  // II.1. DẠNG HÀM MŨ TỔNG QUÁT: y = a * exp(sum_{j=1}^m b_j * phi_j(x))
  // =========================================================================
  if (type === "exponential") {
    // Kiểm tra y_i cùng dấu và khác 0
    const allPositive = Y.every((y) => y > 0);
    const allNegative = Y.every((y) => y < 0);
    if (!allPositive && !allNegative) {
      logger.error("Dạng hàm mũ yêu cầu tất cả giá trị $y_i$ phải cùng dấu (cùng dương hoặc cùng âm) và khác 0.");
      return;
    }

    let nonlinBasis: { raw: string; evaluate: (x: number) => number }[];
    try {
      nonlinBasis = readBasis(params.basis || "");
      if (!nonlinBasis.length) throw new Error("Cần nhập ít nhất một hàm cơ sở φⱼ(x) trên số mũ.");
    } catch (error) {
      logger.error((error as Error).message);
      return;
    }

    // Tự động loại bỏ hàm hằng 1 nếu người dùng nhập trong basis, vì phi_0 = 1 được thêm tự động làm hệ số tự do a_0 = ln|a|
    const filteredBasis = nonlinBasis.filter((item) => {
      const raw = item.raw.trim();
      if (raw === "1") return false;
      try {
        if (
          Math.abs(item.evaluate(1) - 1) < 1e-12 &&
          Math.abs(item.evaluate(2) - 1) < 1e-12
        ) {
          return false;
        }
      } catch {}
      return true;
    });

    if (filteredBasis.length < nonlinBasis.length) {
      logger.info(
        "💡 **Ghi chú:** Đã tự động lược bỏ hàm hằng $1$ trong hệ cơ sở $\\varphi_j(x)$ vì mô hình hàm mũ đã tự động bao gồm hệ số tự do $\\varphi_0(x) = 1$ (tương ứng với $a_0 = \\ln |a|$).",
      );
      nonlinBasis = filteredBasis;
    }

    if (!nonlinBasis.length) {
      logger.error(
        "Cần nhập ít nhất một hàm cơ sở $\\varphi_j(x)$ (khác hàm hằng 1) trên số mũ.",
      );
      return;
    }

    const m = nonlinBasis.length;
    if (n < m + 1) {
      logger.error(`Số điểm thực nghiệm n = ${n} phải lớn hơn hoặc bằng m + 1 = ${m + 1}.`);
      return;
    }

    // Tuyến tính hóa dữ liệu
    const signY = allPositive ? 1 : -1;
    const Ystar = Y.map((y) => Math.log(signY * y));

    // Hệ cơ sở mở rộng: phi_0 = 1, phi_1, ..., phi_m
    const fullBasis = [{ raw: "1", evaluate: () => 1 }, ...nonlinBasis];
    let phi: number[][];
    try {
      phi = X.map((x) => fullBasis.map((item) => item.evaluate(x)));
      if (phi.flat().some((val) => !Number.isFinite(val))) {
        throw new Error("Hàm cơ sở không cho giá trị hữu hạn tại các mốc X.");
      }
    } catch (error) {
      logger.error(`Lỗi tính hàm cơ sở: ${(error as Error).message}`);
      return;
    }

    logger.section("DỮ LIỆU VÀ MÔ HÌNH HÀM MŨ");
    logger.info(`Mô hình: $y = a e^{\\sum_{j=1}^{${m}} b_j \\varphi_j(x)}$`);
    logger.formula(`$$n = ${n}, \\quad m = ${m}, \\quad \\{\\varphi_j(x)\\}_{j=1}^{${m}} = \\{${nonlinBasis.map((item) => item.raw).join(", ")}\\}$$`);

    logger.section("TUYẾN TÍNH HÓA DỮ LIỆU");
    if (allPositive) {
      logger.formula("$$y_i > 0, \\forall i \\implies Y^* = [\\ln y_1, \\dots, \\ln y_n]^T, \\quad a_0 = \\ln a \\implies a = e^{a_0}$$");
    } else {
      logger.formula("$$y_i < 0, \\forall i \\implies Y^* = [\\ln(-y_1), \\dots, \\ln(-y_n)]^T, \\quad a_0 = \\ln(-a) \\implies a = -e^{a_0}$$");
    }
    logger.formula(`$$\\ln |y| = a_0 + \\sum_{j=1}^{${m}} b_j \\varphi_j(x)$$`);
    logger.formula(`$$Y^* = ${vector(Ystar)}$$`);

    logger.section("MA TRẬN THIẾT KẾ PHI");
    logger.formula(`$$\\Phi_{i, 1} = 1, \\quad \\Phi_{i, j+1} = \\varphi_j(x_i) \\implies \\Phi_{${n} \\times ${m + 1}} = ${fmtMat(phi)}$$`);

    // Hệ phương trình chuẩn M a = d
    const totalCols = m + 1;
    const M = Array.from({ length: totalCols }, (_, row) =>
      Array.from({ length: totalCols }, (_, col) => phi.reduce((sum, values) => sum + values[row] * values[col], 0)),
    );
    const d = Array.from({ length: totalCols }, (_, col) => phi.reduce((sum, values, row) => sum + values[col] * Ystar[row], 0));

    logger.section("HỆ PHƯƠNG TRÌNH CHUẨN M a = d");
    logger.formula(`$$M = \\Phi^T \\Phi = ${fmtMat(M)}, \\quad d = \\Phi^T Y^* = ${vector(d)}$$`);

    let sol: number[];
    try {
      sol = solveLinearSystem(M, d);
    } catch (error) {
      logger.error(`Không giải được hệ phương trình chuẩn: ${(error as Error).message}`);
      return;
    }

    const a0 = sol[0];
    const b = sol.slice(1);
    const a = signY * Math.exp(a0);

    logger.formula(`$$\\mathbf{a} = [a_0, b_1, \\dots, b_{${m}}]^T = ${vector(sol)}$$`);
    logger.formula(`$$a = ${signY > 0 ? "e^{a_0}" : "-e^{a_0}"} = ${fmtNum(a)}$$`);

    // Đánh giá trên Y gốc
    const expPower = (x: number) => nonlinBasis.reduce((sum, item, idx) => sum + b[idx] * item.evaluate(x), 0);
    const yHat = X.map((x) => a * Math.exp(expPower(x)));
    const residuals = yHat.map((val, idx) => val - Y[idx]);
    const ssd = residuals.reduce((sum, e) => sum + e * e, 0);
    const rmse = Math.sqrt(ssd / n);

    logger.section("HÀM XẤP XỈ VÀ ĐÁNH GIÁ ĐỘ CHÍNH XÁC");
    const bTerms = b.map((val, idx) => {
      const sign = val >= 0 && idx > 0 ? "+ " : "";
      return `${sign}${fmtNum(val)} \\cdot (${nonlinBasis[idx].raw})`;
    }).join(" ");
    logger.result(`$$g(x) = ${fmtNum(a)} \\cdot e^{${bTerms}}$$`);

    const evalTable = X.map((x, i) => ({
      "$i$": `$${i + 1}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "$\\hat{y}_i$": `$${fmtNum(yHat[i])}$`,
      "$e_i = \\hat{y}_i - y_i$": `$${fmtNum(residuals[i])}$`,
      "$e_i^2$": `$${fmtNum(residuals[i] ** 2)}$`,
    }));
    logger.table(evalTable);

    logger.result(`$$S = E^T E = \\sum_{i=1}^{${n}} e_i^2 = ${fmtNum(ssd)}$$`);
    logger.result(`$$\\sigma = \\sqrt{\\frac{S}{n}} = ${fmtNum(rmse)}$$`);
    return;
  }

  // =========================================================================
  // II.2. DẠNG HÀM LŨY THỪA: y = a * x^b
  // =========================================================================
  if (type === "power") {
    if (X.some((x) => x <= 0)) {
      logger.error("Dạng hàm lũy thừa yêu cầu tất cả các mốc $x_i > 0$.");
      return;
    }

    const allPositive = Y.every((y) => y > 0);
    const allNegative = Y.every((y) => y < 0);
    if (!allPositive && !allNegative) {
      logger.error("Dạng hàm lũy thừa yêu cầu tất cả giá trị $y_i$ phải cùng dấu và khác 0.");
      return;
    }

    const signY = allPositive ? 1 : -1;
    const Xstar = X.map((x) => Math.log(x));
    const Ystar = Y.map((y) => Math.log(signY * y));

    logger.section("DỮ LIỆU VÀ MÔ HÌNH HÀM LŨY THỪA");
    logger.info("Mô hình: $y = a x^b$");
    logger.formula(`$$n = ${n}, \\quad x_i > 0, \\quad y_i \\text{ cùng dấu}$$`);

    logger.section("TUYẾN TÍNH HÓA DỮ LIỆU");
    logger.formula("$$X^* = [\\ln x_1, \\dots, \\ln x_n]^T$$");
    if (allPositive) {
      logger.formula("$$y_i > 0 \\implies Y^* = [\\ln y_1, \\dots, \\ln y_n]^T, \\quad a_0 = \\ln a \\implies a = e^{a_0}$$");
    } else {
      logger.formula("$$y_i < 0 \\implies Y^* = [\\ln(-y_1), \\dots, \\ln(-y_n)]^T, \\quad a_0 = \\ln(-a) \\implies a = -e^{a_0}$$");
    }
    logger.formula("$$\\ln |y| = a_0 + b \\ln x$$");

    // Ma trận Phi: cot 1 là 1, cot 2 là ln(x_i)
    const phi = X.map((_, i) => [1, Xstar[i]]);
    logger.section("MA TRẬN THIẾT KẾ PHI");
    logger.formula(`$$\\Phi_{i, 1} = 1, \\quad \\Phi_{i, 2} = \\ln x_i \\implies \\Phi_{${n} \\times 2} = ${fmtMat(phi)}$$`);

    const M = [
      [phi.reduce((sum, r) => sum + r[0] * r[0], 0), phi.reduce((sum, r) => sum + r[0] * r[1], 0)],
      [phi.reduce((sum, r) => sum + r[1] * r[0], 0), phi.reduce((sum, r) => sum + r[1] * r[1], 0)],
    ];
    const d = [
      phi.reduce((sum, r, i) => sum + r[0] * Ystar[i], 0),
      phi.reduce((sum, r, i) => sum + r[1] * Ystar[i], 0),
    ];

    logger.section("HỆ PHƯƠNG TRÌNH CHUẨN M a = d");
    logger.formula(`$$M = \\Phi^T \\Phi = ${fmtMat(M)}, \\quad d = \\Phi^T Y^* = ${vector(d)}$$`);

    let sol: number[];
    try {
      sol = solveLinearSystem(M, d);
    } catch (error) {
      logger.error(`Không giải được hệ phương trình chuẩn: ${(error as Error).message}`);
      return;
    }

    const a0 = sol[0];
    const b = sol[1];
    const a = signY * Math.exp(a0);

    logger.formula(`$$\\mathbf{a} = [a_0, b]^T = ${vector(sol)}$$`);
    logger.formula(`$$a = ${signY > 0 ? "e^{a_0}" : "-e^{a_0}"} = ${fmtNum(a)}, \\quad b = ${fmtNum(b)}$$`);

    // Đánh giá độ chính xác trên Y gốc
    const yHat = X.map((x) => a * Math.pow(x, b));
    const residuals = yHat.map((val, idx) => val - Y[idx]);
    const ssd = residuals.reduce((sum, e) => sum + e * e, 0);
    const rmse = Math.sqrt(ssd / n);

    logger.section("HÀM XẤP XỈ VÀ ĐÁNH GIÁ ĐỘ CHÍNH XÁC");
    logger.result(`$$g(x) = ${fmtNum(a)} \\cdot x^{${fmtNum(b)}}$$`);

    const evalTable = X.map((x, i) => ({
      "$i$": `$${i + 1}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "$\\hat{y}_i$": `$${fmtNum(yHat[i])}$`,
      "$e_i = \\hat{y}_i - y_i$": `$${fmtNum(residuals[i])}$`,
      "$e_i^2$": `$${fmtNum(residuals[i] ** 2)}$`,
    }));
    logger.table(evalTable);

    logger.result(`$$S = E^T E = \\sum_{i=1}^{${n}} e_i^2 = ${fmtNum(ssd)}$$`);
    logger.result(`$$\\sigma = \\sqrt{\\frac{S}{n}} = ${fmtNum(rmse)}$$`);
    return;
  }

  // =========================================================================
  // II.3. DẠNG HÀM LOGARIT: y = ln(sum_{j=1}^m b_j * phi_j(x))
  // =========================================================================
  if (type === "logarithmic") {
    let basis: { raw: string; evaluate: (x: number) => number }[];
    try {
      basis = readBasis(params.basis || "");
      if (!basis.length) throw new Error("Cần nhập ít nhất một hàm cơ sở φⱼ(x) bên trong logarit.");
    } catch (error) {
      logger.error((error as Error).message);
      return;
    }

    const m = basis.length;
    if (n < m) {
      logger.error(`Số điểm thực nghiệm n = ${n} phải lớn hơn hoặc bằng m = ${m}.`);
      return;
    }

    // Tuyến tính hóa dữ liệu: e^y = sum b_j * phi_j(x) => Y* = [e^y1, ..., e^yn]^T
    const Ystar = Y.map((y) => Math.exp(y));

    let phi: number[][];
    try {
      phi = X.map((x) => basis.map((item) => item.evaluate(x)));
      if (phi.flat().some((val) => !Number.isFinite(val))) {
        throw new Error("Hàm cơ sở không cho giá trị hữu hạn tại các mốc X.");
      }
    } catch (error) {
      logger.error(`Lỗi tính hàm cơ sở: ${(error as Error).message}`);
      return;
    }

    logger.section("DỮ LIỆU VÀ MÔ HÌNH HÀM LOGARIT");
    logger.info(`Mô hình: $y = \\ln\\left(\\sum_{j=1}^{${m}} b_j \\varphi_j(x)\\right)$`);
    logger.formula(`$$n = ${n}, \\quad m = ${m}, \\quad \\{\\varphi_j(x)\\}_{j=1}^{${m}} = \\{${basis.map((item) => item.raw).join(", ")}\\}$$`);

    logger.section("TUYẾN TÍNH HÓA DỮ LIỆU");
    logger.formula("$$e^y = \\sum_{j=1}^m b_j \\varphi_j(x) \\implies Y^* = [e^{y_1}, \\dots, e^{y_n}]^T$$");
    logger.formula(`$$Y^* = ${vector(Ystar)}$$`);

    logger.section("MA TRẬN THIẾT KẾ PHI");
    logger.formula(`$$\\Phi_{i, j} = \\varphi_j(x_i) \\implies \\Phi_{${n} \\times ${m}} = ${fmtMat(phi)}$$`);

    const M = Array.from({ length: m }, (_, row) =>
      Array.from({ length: m }, (_, col) => phi.reduce((sum, values) => sum + values[row] * values[col], 0)),
    );
    const d = Array.from({ length: m }, (_, col) => phi.reduce((sum, values, row) => sum + values[col] * Ystar[row], 0));

    logger.section("HỆ PHƯƠNG TRÌNH CHUẨN M b = d");
    logger.formula(`$$M = \\Phi^T \\Phi = ${fmtMat(M)}, \\quad d = \\Phi^T Y^* = ${vector(d)}$$`);

    let b: number[];
    try {
      b = solveLinearSystem(M, d);
    } catch (error) {
      logger.error(`Không giải được hệ phương trình chuẩn: ${(error as Error).message}`);
      return;
    }
    logger.formula(`$$\\mathbf{b} = [b_1, \\dots, b_{${m}}]^T = ${vector(b)}$$`);

    // Đánh giá trên Y gốc: z_i = sum b_j * phi_j(x_i)
    const z = phi.map((row) => row.reduce((sum, val, idx) => sum + val * b[idx], 0));
    const nonPositiveCount = z.filter((zi) => zi <= 0).length;

    const yHat = z.map((zi) => (zi > 0 ? Math.log(zi) : NaN));
    const residuals = yHat.map((val, idx) => (Number.isFinite(val) ? val - Y[idx] : NaN));
    const validResiduals = residuals.filter((r) => Number.isFinite(r));

    if (validResiduals.length === 0) {
      logger.error("Tất cả các điểm thực nghiệm đều có $z_i \\le 0$, biểu thức trong logarit không xác định.");
      return;
    }

    const ssd = validResiduals.reduce((sum, e) => sum + e * e, 0);
    const rmse = Math.sqrt(ssd / n); // Chia đúng cho tổng số điểm n theo lý thuyết

    if (nonPositiveCount > 0) {
      logger.warn(
        `Phát hiện ${nonPositiveCount}/${n} điểm có $z_i = \\sum b_j \\varphi_j(x_i) \\le 0$ (biểu thức trong $\\ln$ không xác định). ` +
          `Theo lý thuyết hàm logarit đòi hỏi $z_i > 0, \\forall i$. ` +
          `Sai số $\\sigma$ chuẩn dưới đây được tính chia cho $n = ${n}$ mốc: $\\sigma = \\sqrt{S / ${n}} = ${fmtNum(rmse)}$. ` +
          `Nếu chỉ tính chia trên ${validResiduals.length} điểm hợp lệ: $\\sigma_{\\text{hợp lệ}} = \\sqrt{S / ${validResiduals.length}} = ${fmtNum(Math.sqrt(ssd / validResiduals.length))}$.`,
      );
    }

    logger.section("HÀM XẤP XỈ VÀ ĐÁNH GIÁ ĐỘ CHÍNH XÁC");
    const bTerms = b.map((val, idx) => {
      const sign = val >= 0 && idx > 0 ? "+ " : "";
      return `${sign}${fmtNum(val)} \\cdot (${basis[idx].raw})`;
    }).join(" ");
    logger.result(`$$g(x) = \\ln\\left(${bTerms}\\right)$$`);

    const evalTable = X.map((x, i) => ({
      "$i$": `$${i + 1}$`,
      "$x_i$": `$${fmtNum(x)}$`,
      "$y_i$": `$${fmtNum(Y[i])}$`,
      "$z_i = e^{\\hat{y}_i}$": `$${fmtNum(z[i])}$`,
      "$\\hat{y}_i$": Number.isFinite(yHat[i]) ? `$${fmtNum(yHat[i])}$` : "Không xác định",
      "$e_i = \\hat{y}_i - y_i$": Number.isFinite(residuals[i]) ? `$${fmtNum(residuals[i])}$` : "—",
      "$e_i^2$": Number.isFinite(residuals[i]) ? `$${fmtNum(residuals[i] ** 2)}$` : "—",
    }));
    logger.table(evalTable);

    if (nonPositiveCount > 0) {
      logger.result(
        `$$S = \\sum_{i \\in \\text{hợp lệ}} e_i^2 = ${fmtNum(ssd)} \\quad (${validResiduals.length}/${n} \\text{ điểm hợp lệ})$$`,
      );
      logger.result(
        `$$\\sigma = \\sqrt{\\frac{S}{n}} = \\sqrt{\\frac{${fmtNum(ssd)}}{${n}}} = ${fmtNum(rmse)}$$`,
      );
    } else {
      logger.result(`$$S = E^T E = \\sum_{i=1}^{${n}} e_i^2 = ${fmtNum(ssd)}$$`);
      logger.result(`$$\\sigma = \\sqrt{\\frac{S}{n}} = ${fmtNum(rmse)}$$`);
    }
  }
}
