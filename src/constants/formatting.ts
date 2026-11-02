export const DEFAULT_GENERAL_DECIMALS = 4;
export const DEFAULT_MATRIX_DECIMALS = 4;

export const FormattingConfig = {
  defaultGeneralDecimals: DEFAULT_GENERAL_DECIMALS,
  defaultMatrixDecimals: DEFAULT_MATRIX_DECIMALS,
} as const;

export type FormattingConfigType = typeof FormattingConfig;

