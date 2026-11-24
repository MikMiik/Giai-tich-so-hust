import type { Logger } from "@/types/solver";
import { fmtMat, fmtNum, parseCoeffs } from "./math-utils";

export function runDerivativeLagrangeNodes(
  params: Record<string, string>,
  logger: Logger,
): void {
  const X = parseCoeffs(params.xList);
  const Y = parseCoeffs(params.yList);
  const pRaw = params.p?.trim() ?? "";
  const p = Number(pRaw);

  if (X.length === 0) {
    logger.error("Vui lòng nhập dãy mốc $X$ hợp lệ.");
    return;
  }
  if (Y.length === 0) {
    logger.error("Vui lòng nhập dãy giá trị $Y$ hợp lệ.");
    return;
  }
  if (X.length !== Y.length) {
    logger.error(
      `Số lượng mốc $X$ (${X.length}) và giá trị $Y$ (${Y.length}) phải bằng nhau.`,
    );
    return;
  }
  if (X.length < 2) {
    logger.error("Cần ít nhất 2 mốc nội suy.");
    return;
  }

  const n = X.length - 1;
  if (!pRaw || !Number.isInteger(p) || p < 1 || p > n) {
    logger.error(
      `Bậc đa thức $p$ phải là số nguyên thỏa mãn $1 \\le p \\le n = ${n}$.`,
    );
    return;
  }

  const h = X[1] - X[0];
  if (Math.abs(h) < 1e-12) {
    logger.error(
      "Bước lưới $h = x_1 - x_0 = 0$. Các mốc phải đôi một khác nhau.",
    );
    return;
  }
  for (let i = 2; i < X.length; i++) {
    const hi = X[i] - X[i - 1];
    if (Math.abs(hi - h) / Math.abs(h) > 1e-6) {
      logger.error(
        `Các mốc $X$ phải cách đều. Phát hiện $h_{${i - 1}} = ${fmtNum(hi)} \\neq h = ${fmtNum(h)}$.`,
      );
      return;
    }
  }

  // ── 1. Dữ liệu đầu vào ──────────────────────────────────
  logger.section("1. DỮ LIỆU ĐẦU VÀO");
  logger.info(
    `Số mốc: $n + 1 = ${X.length}$ ($n = ${n}$), bậc đa thức $p = ${p}$ (công thức ${p + 1} điểm), bước lưới $h = ${fmtNum(h)}$.`,
  );
  logger.table(
    X.map((xi, idx) => ({
      $m$: `$${idx}$`,
      $x_m$: `$${fmtNum(xi)}$`,
      $y_m$: `$${fmtNum(Y[idx])}$`,
    })),
  );
  logger.separator();

  // ── 2. Ma trận hệ số đạo hàm Lagrange D ─────────────────
  logger.section(
    `2. MA TRẬN HỆ SỐ ĐẠO HÀM LAGRANGE $D$ (${p + 1} \\times ${p + 1})`,
  );
  logger.formula(
    `$$D_{k,i} = \\begin{cases} \\displaystyle \\prod_{\\substack{j=0 \\\\ j \\neq i,k}}^{${p}} \\frac{k - j}{i - j} \\cdot \\frac{1}{i - k} & \\text{nếu } k \\neq i \\\\ \\displaystyle \\sum_{\\substack{j=0 \\\\ j \\neq i}}^{${p}} \\frac{1}{i - j} & \\text{nếu } k = i \\end{cases}$$`,
  );

  const D: number[][] = Array.from({ length: p + 1 }, () =>
    Array(p + 1).fill(0),
  );
  for (let k = 0; k <= p; k++) {
    for (let i = 0; i <= p; i++) {
      if (k !== i) {
        let prod = 1;
        for (let j = 0; j <= p; j++) {
          if (j !== i && j !== k) {
            prod *= (k - j) / (i - j);
          }
        }
        D[k][i] = prod / (i - k);
      } else {
        let sum = 0;
        for (let j = 0; j <= p; j++) {
          if (j !== i) {
            sum += 1 / (i - j);
          }
        }
        D[k][i] = sum;
      }
    }
  }

  logger.result(`$$D = ${fmtMat(D)}$$`);
  const dTable = D.map((row, k) => {
    const entry: Record<string, unknown> = { $k$: `$${k}$` };
    for (let i = 0; i <= p; i++) {
      entry[`$i=${i}$`] = `$${fmtNum(row[i])}$`;
    }
    return entry;
  });
  logger.table(dTable);
  logger.separator();

  // ── 3. Tính mảng đạo hàm DY ─────────────────────────────
  const L = Math.floor(p / 2);
  logger.section("3. TÍNH ĐẠO HÀM TẠI CÁC MỐC NỘI SUY");
  logger.formula(
    `$$L = \\left\\lfloor \\frac{p}{2} \\right\\rfloor = ${L}, \\quad s = \\max\\big(0, \\min(n - p, m - L)\\big), \\quad k = m - s$$`,
  );
  logger.formula(
    `$$dy_m = \\frac{1}{h} \\sum_{i=0}^{${p}} D_{k, i} \\cdot y_{s + i}$$`,
  );

  const DY: number[] = [];
  const dyRows: Record<string, unknown>[] = [];

  for (let m = 0; m <= n; m++) {
    const s = Math.max(0, Math.min(n - p, m - L));
    const k = m - s;
    let sum = 0;
    for (let i = 0; i <= p; i++) {
      sum += D[k][i] * Y[s + i];
    }
    const dy = sum / h;
    DY.push(dy);

    dyRows.push({
      $m$: `$${m}$`,
      $x_m$: `$${fmtNum(X[m])}$`,
      $y_m$: `$${fmtNum(Y[m])}$`,
      "Cửa sổ $[s, s+p]$": `$[${s}, ${s + p}]$`,
      $k$: `$${k}$`,
      "$dy_m \\approx f'(x_m)$": `**$${fmtNum(dy)}$**`,
    });
  }

  logger.table(dyRows);
  logger.success("✔ Hoàn thành tính đạo hàm bằng công thức $p + 1$ điểm.");
  logger.result(
    `$$DY = \\begin{bmatrix} ${DY.map((v) => fmtNum(v)).join(",\\; ")} \\end{bmatrix}$$`,
  );
}
