import { runIsolateRoots } from "@/lib/algorithms/isolate-roots";
import { runBisection } from "@/lib/algorithms/bisection";
import { runTiepTuyen } from "@/lib/algorithms/tieptuyen";
import { runDayCung } from "@/lib/algorithms/daycung";
import { runLapDon } from "@/lib/algorithms/lapdon";
import { runChebyshevNodes } from "@/lib/algorithms/chebyshev-nodes";
import { runPolyMultiplyLinear } from "@/lib/algorithms/poly-multiply-linear";
import { runPolyDivideHorner } from "@/lib/algorithms/poly-divide-horner";
import { runPolyDerivativeHorner } from "@/lib/algorithms/poly-derivative-horner";
import { runGauss } from "@/lib/algorithms/gauss";
import { runGaussJordan } from "@/lib/algorithms/gaussjordan";
import { runNewtonSystem } from "@/lib/algorithms/newton-system";
import { runLapDonSystem } from "@/lib/algorithms/lapdon-system";
import { runDanilevsky } from "@/lib/algorithms/danilevsky";
import { runGaussSeidel } from "@/lib/algorithms/gauss-seidel";
import { runJacobiMatrix } from "@/lib/algorithms/jacobi-matrix";
import { runPowerEigen } from "@/lib/algorithms/power-eigen";
import { runLuDecompose } from "@/lib/algorithms/lu-decompose";
import { runLuSolve } from "@/lib/algorithms/lu-solve";
import { runCholeskyDecompose } from "@/lib/algorithms/cholesky-decompose";
import { runCholeskySolve } from "@/lib/algorithms/cholesky-solve";
import { runXuongThang } from "@/lib/algorithms/xuong-thang";
import { runSvd } from "@/lib/algorithms/svd";
import { runSvdPower } from "@/lib/algorithms/svd-power";
import { runPseudoinverse } from "@/lib/algorithms/pseudoinverse";
import { runConditionNumber } from "@/lib/algorithms/condition-number";
import { runGramSchmidt } from "@/lib/algorithms/gram-schmidt";
import { runVienQuanh } from "@/lib/algorithms/vien-quanh";
import type { AlgoConfig, AlgorithmKey, Logger } from "@/types/solver";

export const ALGORITHM_CONFIG: Record<AlgorithmKey, AlgoConfig> = {
  "isolate-roots": {
    title: "Bán Kính & Khoảng Cách Ly",
    subtitle: "Giới hạn nghiệm và tách các khoảng chứa 1 nghiệm — Isolate Roots",
    icon: "🔍",
    defaultValues: {
      coeffs: "1 0 -1 -2",
    },
    run: runIsolateRoots,
  },
  bisection: {
    title: "Phương Pháp Chia Đôi",
    subtitle: "Cô lập nghiệm f(x) = 0 — Bisection Method",
    icon: "⚡",
    defaultValues: {
      fStr: "Math.exp(x) - Math.cos(2*x)",
      a: "-1",
      b: "-0.1",
      epsilon: "0.5e-5",
    },
    run: runBisection,
  },
  tieptuyen: {
    title: "Phương Pháp Tiếp Tuyến",
    subtitle: "Hội tụ nhanh tìm nghiệm f(x) = 0 — Newton-Raphson 1D",
    icon: "∂",
    defaultValues: {
      fStr: "Math.pow(x,5) - 17",
      dfStr: "5 * Math.pow(x,4)",
      ddfStr: "20 * Math.pow(x,3)",
      a: "1",
      b: "2",
      m1: "5",
      epsilon: "0.5e-6",
    },
    run: runTiepTuyen,
  },
  daycung: {
    title: "Phương Pháp Dây Cung",
    subtitle: "Tìm nghiệm bằng dây cung — Secant/Chord Method",
    icon: "⌒",
    defaultValues: {
      fStr: "x**3 - x - 2",
      a: "1",
      b: "2",
      epsilon: "1e-6",
    },
    run: runDayCung,
  },
  lapdon: {
    title: "Lặp Đơn 1 Biến",
    subtitle: "Lặp hội tụ theo x = φ(x) — Fixed-Point 1D",
    icon: "↺",
    defaultValues: {
      phiStr: "1 / Math.sqrt(x + 3)",
      x0: "0.5",
      q: "0.0963",
      epsilon: "5e-9",
    },
    run: runLapDon,
  },
  "chebyshev-nodes": {
    title: "Mốc Nội Suy Tối Ưu Chebyshev",
    subtitle: "Xác định n mốc tối ưu tăng dần trên [a, b] — Chebyshev Nodes",
    icon: "∿",
    defaultValues: {
      n: "5",
      a: "-1",
      b: "1",
    },
    run: runChebyshevNodes,
  },
  "poly-multiply-linear": {
    title: "Nhân Đa Thức với (x - c)",
    subtitle: "Tính tích A(x) = (x - c)P(x) — Polynomial Multiply",
    icon: "×",
    defaultValues: {
      coeffs: "2 3 -1",
      c: "2",
    },
    run: runPolyMultiplyLinear,
  },
  "poly-divide-horner": {
    title: "Chia Đa Thức (Sơ Đồ Horner)",
    subtitle: "Chia P(x) cho (x - c) tìm thương và số dư — Horner Division",
    icon: "÷",
    defaultValues: {
      coeffs: "1 -2 1 -3",
      c: "2",
    },
    run: runPolyDivideHorner,
  },
  "poly-derivative-horner": {
    title: "Đạo Hàm Cấp k (Sơ Đồ Horner)",
    subtitle: "Tính P^(k)(c) = k! · b_(k-1) tại x = c — Horner Derivative",
    icon: "dⁿ",
    defaultValues: {
      coeffs: "3 -2 5 -7",
      k: "2",
      c: "2",
    },
    run: runPolyDerivativeHorner,
  },
  gauss: {
    title: "Phương Pháp Gauss",
    subtitle: "Giải hệ Ax = B bằng khử — Forward Elimination",
    icon: "▦",
    defaultValues: {
      matA: "1 2 1\n2 3 2\n1 1 3",
      matB: "8 1\n14 2\n10 3",
    },
    run: runGauss,
  },
  gaussjordan: {
    title: "Phương Pháp Gauss-Jordan",
    subtitle: "Khử về dạng rút gọn RREF — Gauss-Jordan",
    icon: "▣",
    defaultValues: {
      matA: "2 4 5 -6\n0 -1 0 8\n0 0 0 0\n0 0 -1.5 -4",
      matB: "7 3\n-6 1\n0 0\n2.8 -1.5",
    },
    run: runGaussJordan,
  },
  "gauss-seidel": {
    title: "Phương Pháp Gauss-Seidel",
    subtitle: "Lặp hội tụ giải hệ Ax = b — Gauss-Seidel",
    icon: "⟲",
    defaultValues: {
      matA: "10 5 7\n2 15 3\n-3 1 30",
      vecB: "11\n12\n19",
      equationFormat: "Ax=b",
      x0Str: "0 0 0",
      epsilon: "1e-2",
      maxIter: "100",
    },
    run: runGaussSeidel,
  },
  "jacobi-matrix": {
    title: "Phương Pháp Lặp Jacobi (Ma Trận)",
    subtitle: "Lặp Jacobi giải hệ phương trình tuyến tính",
    icon: "⇆",
    defaultValues: {
      matA: "5 -1 1\n2 8 -1\n-1 1 4",
      vecB: "10\n11\n3",
      epsilon: "1e-3",
      maxIterStr: "100",
    },
    run: runJacobiMatrix,
  },
  "newton-system": {
    title: "Newton Hệ Phi Tuyến",
    subtitle: "Giải hệ phi tuyến — Newton Method",
    icon: "∇",
    defaultValues: {
      vars: "x, y",
      funcs: "-x^2 + x + 4*y - 12\nx^2 - 4*x + 4*y^2 - 12*y - 12",
      x0Str: "0 0",
      tol: "1e-5",
      maxIter: "50",
    },
    run: (params: Record<string, string>, logger: Logger) =>
      runNewtonSystem(params, logger),
  },
  "lapdon-system": {
    title: "Lặp Đơn Hệ Phi Tuyến",
    subtitle: "Lặp hội tụ giải hệ phi tuyến — Fixed-Point",
    icon: "⟳",
    defaultValues: {
      vars: "x1, x2, x3",
      phis: "(cos(x2 * x3) + 0.5) / 3\n(1/25) * sqrt(x1^2 + 0.3125) - 0.03\n-(1/20) * exp(-x1 * x2) - (10 * pi - 3) / 60",
      x0Str: "0 0 0",
      q: "0.34",
      epsilon: "1e-6",
      maxIter: "100",
    },
    run: (params: Record<string, string>, logger: Logger) =>
      runLapDonSystem(params, logger),
  },
  danilevsky: {
    title: "Phương Pháp Danilevsky",
    subtitle: "Tìm Đa Thức Đặc Trưng",
    icon: "Δ",
    defaultValues: {
      matA: "2 1 0 3 1\n1 3 1 2 0\n0 1 4 1 2\n1 2 0 3 1\n0 0 3 4 2",
    },
    run: (params: Record<string, string>, logger: Logger) =>
      runDanilevsky(params, logger),
  },
  "power-eigen": {
    title: "Phương Pháp Lũy Thừa",
    subtitle: "Tìm trị riêng lớn nhất — Power Iteration",
    icon: "λ",
    defaultValues: {
      matA: "4 -1 1\n-1 3 -2\n1 -2 3",
      x0Str: "1 1 1",
      epsilon: "1e-6",
      maxIter: "100",
    },
    run: runPowerEigen,
  },
  "lu-decompose": {
    title: "Phân Tách LU",
    subtitle: "Phân tích A = LU — LU Decomposition",
    icon: "LU",
    defaultValues: {
      matA: "2 2 0 0 0 0\n1 4 6 0 0 0\n0 1 4 2 0 0\n0 0 1 5 8 0\n0 0 0 1 4 2\n0 0 0 0 1 4",
    },
    run: runLuDecompose,
  },
  "lu-solve": {
    title: "Phân Tách LU Giải AX = B",
    subtitle: "Giải Ax = b qua phân tích LU — LU Factorization",
    icon: "▧",
    defaultValues: {
      matA: "2 2 0 0 0 0 0\n1 3 2 0 0 0 0\n0 1 3 2 0 0 0\n0 0 1 3 2 0 0\n0 0 0 1 3 2 0\n0 0 0 0 1 3 2\n0 0 0 0 0 1 3",
      vecB: "4\n6\n6\n6\n6\n6\n4",
    },
    run: runLuSolve,
  },
  "cholesky-decompose": {
    title: "Phân Tách Cholesky",
    subtitle: "Phân tích A = LL^T (ma trận SPD) — Cholesky",
    icon: "L²",
    defaultValues: {
      matA: "1 1 1 1 1 1 1 1\n1 2 2 2 2 2 2 2\n1 2 3 3 3 3 3 3\n1 2 3 4 4 4 4 4\n1 2 3 4 5 5 5 5\n1 2 3 4 5 6 6 6\n1 2 3 4 5 6 7 7\n1 2 3 4 5 6 7 8",
    },
    run: runCholeskyDecompose,
  },
  "cholesky-solve": {
    title: "Phân Tách Cholesky Giải AX = B",
    subtitle: "Giải Ax = b qua Cholesky — Cholesky Factorization",
    icon: "◣",
    defaultValues: {
      matA: "1 1 1 1 1 1 1\n1 2 2 2 2 2 2\n1 2 3 3 3 3 3\n1 2 3 4 4 4 4\n1 2 3 4 5 5 5\n1 2 3 4 5 6 6\n1 2 3 4 5 6 7",
      vecB: "7\n13\n18\n22\n25\n27\n28",
    },
    run: runCholeskySolve,
  },
  "xuong-thang": {
    title: "Phương Pháp Xuống Thang",
    subtitle: "Tìm trị riêng lớn thứ hai trở đi — Deflation Method",
    icon: "📉",
    defaultValues: {
      matA: "4 2\n1 3",
      lambda1Str: "5",
      vecV1: "2 1",
      vecY0: "1 1",
      epsilon: "0.01",
      maxIter: "100",
      method: "C1",
    },
    run: runXuongThang,
  },
  svd: {
    title: "Phân Rã SVD",
    subtitle: "Xác định giá trị và vector kỳ dị — SVD Decomposition",
    icon: "Σ",
    defaultValues: {
      matA: "1 1\n0 0\n0 0",
      truncationR: "",
      targetErrorPct: "",
    },
    run: runSvd,
  },
  "svd-power": {
    title: "Phân Rã SVD (Lũy thừa & Xuống thang)",
    subtitle: "Thực hiện SVD từng bước qua lặp số trị",
    icon: "Σ*",
    defaultValues: {
      matA: "4 -1 1\n-1 3 -2\n1 -2 3",
      x0Str: "1 1 1",
      epsilon: "1e-5",
      maxIter: "100",
      truncationR: "",
      targetErrorPct: "",
    },
    run: runSvdPower,
  },
  pseudoinverse: {
    title: "Ma Trận Nghịch Đảo Suy Rộng",
    subtitle: "Tìm ma trận Moore-Penrose $A^\\dagger$ — Pseudoinverse",
    icon: "†",
    defaultValues: {
      matA: "1 1\n0 0\n0 0",
    },
    run: runPseudoinverse,
  },
  "condition-number": {
    title: "Số Điều Kiện",
    subtitle: "Tính mức ổn định số của ma trận — Condition Number",
    icon: "κ",
    defaultValues: {
      matA: "4 2\n1 3",
    },
    run: runConditionNumber,
  },
  "gram-schmidt": {
    title: "Trực chuẩn Gram-Schmidt",
    subtitle: "Trực giao & Trực chuẩn hóa tập vector — Gram-Schmidt",
    icon: "⊥",
    defaultValues: {
      vectors: "1 1 0\n1 0 1\n0 1 1",
    },
    run: runGramSchmidt,
  },
  "vien-quanh": {
    title: "Nghịch Đảo Viền Quanh",
    subtitle: "Tìm ma trận nghịch đảo $A^{-1}$ — Bordering Method",
    icon: "[ ]⁻¹",
    defaultValues: {
      matA: "0 -5 -8 -5 -1 -4\n10 0 -7 9 -3 5\n-3 4 -5 -3 7 5\n2 8 7 -6 2 -3\n-6 10 -5 -5 1 1\n5 1 7 2 9 -9",
    },
    run: runVienQuanh,
  },
};

export const GTS_SIDEBAR_SECTIONS = [
  {
    methods: [
      "isolate-roots",
      "bisection",
      "tieptuyen",
      "daycung",
      "lapdon",
    ] as AlgorithmKey[],
  },
  {
    methods: [
      "gauss",
      "gaussjordan",
      "gauss-seidel",
      "jacobi-matrix",
      "lu-decompose",
      "lu-solve",
      "cholesky-decompose",
      "cholesky-solve",
      "vien-quanh",
    ] as AlgorithmKey[],
  },
  {
    methods: ["newton-system", "lapdon-system"] as AlgorithmKey[],
  },
  {
    methods: ["danilevsky", "power-eigen", "xuong-thang"] as AlgorithmKey[],
  },
  {
    methods: [
      "svd",
      "svd-power",
      "pseudoinverse",
      "condition-number",
      "gram-schmidt",
    ] as AlgorithmKey[],
  },
] as const;

export const PPS_SIDEBAR_SECTIONS = [
  {
    methods: [
      "chebyshev-nodes",
      "poly-multiply-linear",
      "poly-divide-horner",
      "poly-derivative-horner",
    ] as AlgorithmKey[],
  },
] as const;

export const SIDEBAR_SECTIONS = GTS_SIDEBAR_SECTIONS;
