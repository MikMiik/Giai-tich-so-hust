import type { Logger } from "@/types/solver";
import { fmtNum, parseCoeffs, parseFraction } from "./math-utils";

export interface ExtractSubarrayResult {
  pos: number;
  idxCalculated: number;
  idxFinal: number;
  isClamped: boolean;
  h: number;
  Xsub: number[];
  Ysub?: number[];
}

/**
 * Thuật toán trích xuất k mốc nội suy cách đều quanh điểm x̄
 * 1. pos = floor((xBar - x0) / h)
 * 2. idx = max(0, pos - floor((k - 1) / 2))
 * 3. Nếu idx + k - 1 > N: idx = N - k + 1
 * 4. Xsub = X[idx : idx + k]
 */
export function extractEquidistantSubarray(
  X: number[],
  k: number,
  xBar: number,
  Y?: number[],
): ExtractSubarrayResult {
  const N = X.length - 1;
  const h = X[1] - X[0];

  const pos = Math.floor((xBar - X[0]) / h);
  const idxCalculated = Math.max(0, pos - Math.floor((k - 1) / 2));

  let idxFinal = idxCalculated;
  let isClamped = false;

  if (idxFinal + k - 1 > N) {
    idxFinal = N - k + 1;
    isClamped = true;
  }
  if (idxFinal < 0) {
    idxFinal = 0;
    isClamped = true;
  }

  const Xsub = X.slice(idxFinal, idxFinal + k);
  const Ysub = Y && Y.length === X.length ? Y.slice(idxFinal, idxFinal + k) : undefined;

  return {
    pos,
    idxCalculated,
    idxFinal,
    isClamped,
    h,
    Xsub,
    Ysub,
  };
}

export function runExtractEquidistantNodes(
  params: Record<string, string>,
  logger: Logger,
): void {
  const { xList: xListStr, yList: yListStr, kVal: kValStr, xVal: xValStr } = params;

  // 1. Parse mảng X
  const X = parseCoeffs(xListStr);
  if (X.length === 0) {
    logger.error("Vui lòng nhập danh sách các mốc $x_i$ hợp lệ.");
    return;
  }
  if (X.length < 2) {
    logger.error("Cần ít nhất 2 mốc $x_i$ để xác định bước lưới $h$.");
    return;
  }

  // Kiểm tra bước lưới cách đều
  const h = X[1] - X[0];
  if (Math.abs(h) < 1e-12) {
    logger.error("Bước lưới $h = x_1 - x_0 = 0$. Các mốc $x_i$ phải đôi một khác nhau.");
    return;
  }
  for (let i = 2; i < X.length; i++) {
    const hi = X[i] - X[i - 1];
    if (Math.abs(hi - h) / Math.abs(h) > 1e-6) {
      logger.error(
        `Các mốc $x_i$ không cách đều. Phát hiện bước lưới tại đoạn $[x_{${i - 1}}, x_{${i}}]$ là $h = ${fmtNum(hi)} \\neq h_0 = ${fmtNum(h)}$.`,
      );
      return;
    }
  }

  // 2. Parse điểm x̄
  if (!xValStr || xValStr.trim() === "") {
    logger.error("Vui lòng nhập điểm cần tính $\\bar{x}$.");
    return;
  }
  const xBar = parseFraction(xValStr);
  if (isNaN(xBar)) {
    logger.error("Điểm cần tính $\\bar{x}$ không hợp lệ.");
    return;
  }

  // 3. Parse số mốc k
  const N = X.length - 1; // Chỉ số mốc cuối cùng (0..N)
  const totalNodes = X.length;

  let k = parseInt(kValStr ?? "", 10);
  if (isNaN(k) || k <= 0) {
    logger.error("Số mốc cần trích xuất $k$ phải là một số nguyên dương $\\ge 1$.");
    return;
  }
  if (k > totalNodes) {
    logger.error(
      `Số mốc cần trích xuất $k = ${k}$ vượt quá tổng số mốc hiện có của bảng $N_{total} = ${totalNodes}$.`,
    );
    return;
  }

  // 4. Parse mảng Y (tùy chọn)
  const hasY = yListStr && yListStr.trim() !== "";
  let Y: number[] | undefined;
  if (hasY) {
    Y = parseCoeffs(yListStr);
    if (Y.length !== X.length) {
      logger.error(
        `Số lượng giá trị $y$ (${Y.length}) phải khớp với số lượng mốc $x$ (${X.length}).`,
      );
      return;
    }
  }

  // 5. Trình bày Bước 1: Dữ liệu đầu vào
  logger.section("1. BẢNG DỮ LIỆU ĐẦU VÀO");
  logger.info(
    `Tổng số mốc: $N_{total} = ${totalNodes}$ (chỉ số $0 \\dots ${N}$). Bước lưới $h = ${fmtNum(h)}$.`,
  );
  logger.info(
    `Số mốc cần trích xuất: $k = ${k}$. Điểm nội suy cần tính: $\\bar{x} = ${fmtNum(xBar)}$.`,
  );

  const fullTableRows: Record<string, unknown>[] = X.map((xi, i) => {
    const rowObj: Record<string, unknown> = {
      $i$: `$${i}$`,
      $x_i$: `$${fmtNum(xi)}$`,
    };
    if (Y) {
      rowObj["$y_i$"] = `$${fmtNum(Y[i])}$`;
    }
    return rowObj;
  });
  logger.table(fullTableRows);
  logger.separator();

  // 6. Thực thi thuật toán
  const result = extractEquidistantSubarray(X, k, xBar, Y);
  const { pos, idxCalculated, idxFinal, isClamped, Xsub, Ysub } = result;

  // 7. Trình bày Bước 2: Các bước tính toán chỉ số
  logger.section("2. XÁC ĐỊNH CHỈ SỐ MỐC TỐI ƯU");

  // Step 1: Vị trí tương đối
  const posExact = (xBar - X[0]) / h;
  logger.step(
    `**Bước 1: Tính vị trí tương đối của $\\bar{x}$ so với toàn bảng:**`,
  );
  logger.formula(
    `$$pos = \\left\\lfloor \\frac{\\bar{x} - x_0}{h} \\right\\rfloor = \\left\\lfloor \\frac{${fmtNum(xBar)} - ${fmtNum(X[0])}}{${fmtNum(h)}} \\right\\rfloor = \\lfloor ${fmtNum(posExact)} \\rfloor = ${pos}$$`,
  );
  if (pos >= 0 && pos < N) {
    logger.info(
      `Điểm $\\bar{x} = ${fmtNum(xBar)}$ nằm kẹp giữa mốc $x_{${pos}} = ${fmtNum(X[pos])}$ và $x_{${pos + 1}} = ${fmtNum(X[pos + 1])}$.`,
    );
  } else if (pos < 0) {
    logger.info(
      `Điểm $\\bar{x} = ${fmtNum(xBar)}$ nằm ngoài phạm vi bên trái bảng ($x < x_0 = ${fmtNum(X[0])}$).`,
    );
  } else {
    logger.info(
      `Điểm $\\bar{x} = ${fmtNum(xBar)}$ nằm ngoài phạm vi bên phải bảng ($x \\ge x_N = ${fmtNum(X[N])}$).`,
    );
  }

  // Step 2: Chỉ số xuất phát
  const halfK = Math.floor((k - 1) / 2);
  logger.step(
    `**Bước 2: Tính chỉ số xuất phát (để $\\bar{x}$ nằm ở giữa đoạn mốc):**`,
  );
  logger.formula(
    `$$idx = \\max\\left(0,\\; pos - \\left\\lfloor \\frac{k - 1}{2} \\right\\rfloor\\right) = \\max\\left(0,\\; ${pos} - \\left\\lfloor \\frac{${k} - 1}{2} \\right\\rfloor\\right) = \\max(0,\\; ${pos} - ${halfK}) = ${idxCalculated}$$`,
  );

  // Step 3: Kiểm tra tràn biên
  logger.step(`**Bước 3: Kiểm tra tràn biên và điều chỉnh:**`);
  const rightEnd = idxCalculated + k - 1;
  logger.formula(
    `$$idx + k - 1 = ${idxCalculated} + ${k} - 1 = ${rightEnd} \\quad (\\text{chỉ số cuối mảng } N = ${N})$$`,
  );

  if (rightEnd > N) {
    logger.warn(
      `Phát hiện tràn biên phải: $idx + k - 1 = ${rightEnd} > N = ${N}$.`,
    );
    logger.formula(
      `$$idx = N - k + 1 = ${N} - ${k} + 1 = ${idxFinal}$$`,
    );
    logger.info(
      `Tự động dịch chuyển chỉ số bắt đầu về $idx = ${idxFinal}$ để đảm bảo lấy đủ $k = ${k}$ mốc cuối bảng.`,
    );
  } else if (idxCalculated === 0 && pos < halfK) {
    logger.info(
      `Chạm biên đầu bảng ($idx = 0$). Lấy $k = ${k}$ mốc đầu tiên từ chỉ số $0 \\dots ${k - 1}$.`,
    );
  } else {
    logger.success(
      `Không tràn biên. Đoạn trích xuất từ chỉ số $idx = ${idxFinal}$ đến $idx + k - 1 = ${idxFinal + k - 1}$ nằm gọn trong bảng.`,
    );
  }
  logger.separator();

  // 8. Trình bày Bước 3: Mảng con đã trích xuất
  logger.section("3. KẾT QUẢ MẢNG CON ĐÃ TRÍCH XUẤT");
  logger.success(
    `Đã trích xuất thành công $k = ${k}$ mốc nội suy từ chỉ số gốc $idx = ${idxFinal}$ đến $${idxFinal + k - 1}$.`,
  );

  const subTableRows: Record<string, unknown>[] = Xsub.map((xValSub, j) => {
    const originalIdx = idxFinal + j;
    const rowObj: Record<string, unknown> = {
      "$j$ (Chỉ số mảng con)": `$${j}$`,
      "$i$ (Chỉ số mảng gốc)": `$${originalIdx}$`,
      $x_j$: `**$${fmtNum(xValSub)}$**`,
    };
    if (Ysub) {
      rowObj["$y_j$"] = `**$${fmtNum(Ysub[j])}$**`;
    }
    return rowObj;
  });
  logger.table(subTableRows);

  logger.result(
    `$$X_{sub} = [${Xsub.map((v) => fmtNum(v)).join(", ")}]$$`,
  );
  if (Ysub) {
    logger.result(
      `$$Y_{sub} = [${Ysub.map((v) => fmtNum(v)).join(", ")}]$$`,
    );
  }
}

