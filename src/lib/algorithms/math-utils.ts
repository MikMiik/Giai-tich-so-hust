export function parseFraction(v: string): number {
  if (!v) return NaN;
  // Normalize: "- 2/3" -> "-2/3", "- 1 2/3" -> "-1 2/3"
  const str = v.trim().replace(/^-\s+/, "-");
  if (str === "") return NaN;

  // Hỗ trợ Mixed number: "1 2/3" hoặc "-1 2/3"
  const mixedMatch = str.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (den === 0) return NaN;
    // Dùng whole < 0 hoặc str bắt đầu bằng '-' để xác định dấu
    const sign = str.startsWith("-") ? -1 : 1;
    return sign * (Math.abs(whole) + num / den);
  }

  // Phân số bình thường: "-2/3" hoặc "2/3"
  const fracMatch = str.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den === 0) return NaN;
    return num / den;
  }

  // Decimal & Khoa học (Hỗ trợ dấu phẩy và e)
  const normalized = str.replace(",", ".");
  const num = Number(normalized);
  
  // Trả về NaN nếu kết quả không hợp lệ (ví dụ chứa ký tự lạ)
  return isNaN(num) ? NaN : num;
}

export const FormattingConfig = {
  defaultGeneralDecimals: 4,
  defaultMatrixDecimals: 4,
};

export function getPrecisionByEpsilon(epsilon?: number) {
  if (epsilon !== undefined && !isNaN(epsilon)) {
    const tableDecimals = Math.max(0, Math.ceil(-Math.log10(epsilon)) + 1);
    const reliableDigits = Math.max(1, Math.round(-Math.log10(2 * epsilon)));
    return {
      tableDecimals,
      reliableDigits,
      generalDecimals: tableDecimals,
      matrixDecimals: tableDecimals,
    };
  }
  return {
    tableDecimals: FormattingConfig.defaultGeneralDecimals,
    reliableDigits: FormattingConfig.defaultGeneralDecimals,
    generalDecimals: FormattingConfig.defaultGeneralDecimals,
    matrixDecimals: FormattingConfig.defaultMatrixDecimals,
  };
}

export function fmtNum(
  v: number,
  decimals: number = FormattingConfig.defaultGeneralDecimals,
): string {
  if (!Number.isFinite(v)) return String(v);
  if (Math.abs(v) < 1e-10) return (0).toFixed(decimals);
  return v.toFixed(decimals);
}

export function fmtVec(
  v: number[],
  decimals: number = FormattingConfig.defaultGeneralDecimals,
): string {
  return v.map((x) => fmtNum(x, decimals)).join(" & ");
}

export function fmtMat(
  M: number[][],
  decimals: number = FormattingConfig.defaultMatrixDecimals,
): string {
  const rows = M.map((r) =>
    r.map((x) => fmtNum(x, decimals)).join(" & "),
  );
  return `\\begin{bmatrix} ${rows.join(" \\\\ ")} \\end{bmatrix}`;
}

export function parseCoeffs(input: string): number[] {
  if (!input) return [];
  const parts = input.trim().split(/[\s,;]+/).filter(Boolean);
  const res: number[] = [];
  for (const part of parts) {
    const val = parseFraction(part);
    if (isNaN(val)) return [];
    res.push(val);
  }
  return res;
}

export function fmtPoly(
  coeffs: number[],
  varName: string = "x",
  decimals: number = FormattingConfig.defaultGeneralDecimals,
): string {
  if (!coeffs || coeffs.length === 0) return "0";
  const n = coeffs.length - 1;
  const terms: string[] = [];

  for (let i = 0; i <= n; i++) {
    const c = coeffs[i];
    const power = n - i;
    if (Math.abs(c) < 1e-12) continue;

    const sign = c > 0 ? (terms.length > 0 ? "+ " : "") : "- ";
    const absC = Math.abs(c);
    const cStr = Math.abs(absC - Math.round(absC)) < 1e-9 ? String(Math.round(absC)) : fmtNum(absC, decimals);

    if (power === 0) {
      terms.push(`${sign}${cStr}`);
    } else if (power === 1) {
      if (Math.abs(absC - 1) < 1e-9) {
        terms.push(`${sign}${varName}`);
      } else {
        terms.push(`${sign}${cStr}${varName}`);
      }
    } else {
      if (Math.abs(absC - 1) < 1e-9) {
        terms.push(`${sign}${varName}^{${power}}`);
      } else {
        terms.push(`${sign}${cStr}${varName}^{${power}}`);
      }
    }
  }

  return terms.length > 0 ? terms.join(" ") : "0";
}

