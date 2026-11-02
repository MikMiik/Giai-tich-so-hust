"use client";

import { useEffect, useRef, useState } from "react";
import type { AlgorithmKey } from "@/types/solver";

interface AlgorithmFormProps {
  method: AlgorithmKey;
  defaultValues: Record<string, string>;
  onSubmit: (params: Record<string, string>) => void;
}

export default function AlgorithmForm({
  method,
  defaultValues,
  onSubmit,
}: AlgorithmFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form values when method changes
  useEffect(() => {
    if (!formRef.current) return;
    const form = formRef.current;
    for (const [key, value] of Object.entries(defaultValues)) {
      const el = form.elements.namedItem(key) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (el) el.value = value;
    }
  }, [method, defaultValues]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const form = formRef.current;
    const params: Record<string, string> = {};
    for (const key of Object.keys(defaultValues)) {
      const el = form.elements.namedItem(key);
      if (el) {
        if (el instanceof RadioNodeList) {
          params[key] = el.value;
        } else {
          params[key] = (el as HTMLInputElement | HTMLTextAreaElement).value;
        }
      }
    }
    onSubmit(params);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      formRef.current?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    }
  };

  return (
    <form id="solver-form" ref={formRef} onSubmit={handleSubmit}>
      <FormFields method={method} onKeyDown={handleKeyDown} />
    </form>
  );
}

// ---------- per-method form fields ----------

interface FieldProps {
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}

function FormFields({
  method,
  onKeyDown,
}: FieldProps & { method: AlgorithmKey }) {
  switch (method) {
    case "isolate-roots":
      return <PolynomialFields onKeyDown={onKeyDown} />;
    case "bisection":
      return <BisectionFields onKeyDown={onKeyDown} />;
    case "tieptuyen":
      return <TiepTuyenFields onKeyDown={onKeyDown} />;
    case "daycung":
      return <DayCungFields onKeyDown={onKeyDown} />;
    case "lapdon":
      return <LapDonFields onKeyDown={onKeyDown} />;
    case "chebyshev-nodes":
      return <ChebyshevNodesFields onKeyDown={onKeyDown} />;
    case "poly-multiply-linear":
      return <PolyMultiplyLinearFields onKeyDown={onKeyDown} />;
    case "poly-divide-horner":
      return <PolyDivideHornerFields onKeyDown={onKeyDown} />;
    case "poly-derivative-horner":
      return <PolyDerivativeHornerFields onKeyDown={onKeyDown} />;
    case "poly-product-linear":
      return <PolyProductLinearFields onKeyDown={onKeyDown} />;
    case "lagrange-interpolation":
      return <LagrangeInterpolationFields onKeyDown={onKeyDown} />;
    case "newton-forward-interpolation":
      return <NewtonForwardInterpolationFields onKeyDown={onKeyDown} />;
    case "newton-backward-interpolation":
      return <NewtonBackwardInterpolationFields onKeyDown={onKeyDown} />;
    case "newton-uniform-forward":
      return <NewtonUniformForwardFields onKeyDown={onKeyDown} />;
    case "gauss-forward-interpolation":
    case "gauss-backward-interpolation":
      return <GaussCentralFields method={method} onKeyDown={onKeyDown} />;
    case "stirling-interpolation":
    case "bessel-interpolation":
      return <CentralEvenFields method={method} onKeyDown={onKeyDown} />;
    case "least-squares":
      return <LeastSquaresFields onKeyDown={onKeyDown} />;
    case "smoothing-spline":
      return <SmoothingSplineFields onKeyDown={onKeyDown} />;
    case "extract-equidistant-nodes":
      return <ExtractEquidistantNodesFields onKeyDown={onKeyDown} />;
    case "inverse-isolation":
    case "monotone-intervals":
    case "inverse-newton-forward":
    case "inverse-newton-iteration":
      return <InverseInterpolationFields method={method} onKeyDown={onKeyDown} />;
    case "gauss":
      return <MatrixFields />;
    case "gaussjordan":
      return <GaussJordanFields />;
    case "gauss-seidel":
      return <GaussSeidelFields onKeyDown={onKeyDown} />;
    case "jacobi-matrix":
      return <JacobiMatrixFields onKeyDown={onKeyDown} />;
    case "lu-decompose":
      return <LuDecomposeFields />;
    case "lu-solve":
      return <LuSolveFields />;
    case "cholesky-decompose":
      return <CholeskyDecomposeFields />;
    case "cholesky-solve":
      return <CholeskySolveFields />;
    case "newton-system":
      return <NewtonSystemFields onKeyDown={onKeyDown} />;
    case "lapdon-system":
      return <LapDonSystemFields onKeyDown={onKeyDown} />;
    case "danilevsky":
      return <DanilevskyFields />;
    case "power-eigen":
      return <PowerEigenFields onKeyDown={onKeyDown} />;
    case "xuong-thang":
      return <XuongThangFields onKeyDown={onKeyDown} />;
    case "svd-power":
      return <SvdPowerFields onKeyDown={onKeyDown} />;
    case "svd":
    case "pseudoinverse":
    case "condition-number":
      return <SvdMatrixFields method={method} />;
    case "gram-schmidt":
      return <GramSchmidtFields />;
    case "vien-quanh":
      return <VienQuanhFields />;
    default:
      return null;
  }
}

function VienQuanhFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A (mỗi hàng một dòng, các giá trị cách nhau bằng khoảng trắng hoặc phẩy).
        <br />
        Dùng cho phương pháp viền quanh tìm ma trận nghịch đảo.
      </div>
      <div className="form-section-title">Ma trận A</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận vuông A (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={6}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function ChebyshevNodesFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Số lượng mốc nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-n">
          Số mốc <code>n</code> (nguyên dương ≥ 1)
        </label>
        <input
          className="form-input"
          id="in-n"
          name="n"
          type="number"
          min="1"
          step="1"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>5</code>, <code>4</code>, <code>10</code>
        </div>
      </div>
      <div className="form-section-title">Đoạn nội suy [a, b]</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-a">
            Đầu mút trái <code>a</code>
          </label>
          <input
            className="form-input"
            id="in-a"
            name="a"
            type="text"
            spellCheck={false}
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">
            Ví dụ: <code>-1</code>, <code>0</code>, <code>-pi/2</code>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-b">
            Đầu mút phải <code>b</code> (b &gt; a)
          </label>
          <input
            className="form-input"
            id="in-b"
            name="b"
            type="text"
            spellCheck={false}
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">
            Ví dụ: <code>1</code>, <code>4</code>, <code>pi/2</code>
          </div>
        </div>
      </div>
    </>
  );
}

function PolyMultiplyLinearFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Đa thức P(x)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-coeffs">
          Hệ số của <code>P(x)</code> (từ bậc cao nhất đến bậc 0)
        </label>
        <input
          className="form-input"
          id="in-coeffs"
          name="coeffs"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>2 3 -1</code> ứng với 2x² + 3x - 1
        </div>
      </div>
      <div className="form-section-title">Đa thức bậc nhất (x - c)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-c">
          Hằng số <code>c</code>
        </label>
        <input
          className="form-input"
          id="in-c"
          name="c"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>2</code> (nhân với x - 2), <code>-1</code> (nhân với x + 1)
        </div>
      </div>
    </>
  );
}

function PolyDivideHornerFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Đa thức bị chia P_n(x)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-coeffs">
          Hệ số của <code>P_n(x)</code> (từ bậc cao nhất đến bậc 0)
        </label>
        <input
          className="form-input"
          id="in-coeffs"
          name="coeffs"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1 -2 1 -3</code> ứng với x³ - 2x² + x - 3
        </div>
      </div>
      <div className="form-section-title">Đa thức chia (x - c)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-c">
          Hằng số <code>c</code> (nghiệm của nhị thức x - c)
        </label>
        <input
          className="form-input"
          id="in-c"
          name="c"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>2</code> (chia cho x - 2)
        </div>
      </div>
    </>
  );
}

function PolyDerivativeHornerFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Đa thức P_n(x)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-coeffs">
          Hệ số của <code>P_n(x)</code> (từ bậc cao nhất đến bậc 0)
        </label>
        <input
          className="form-input"
          id="in-coeffs"
          name="coeffs"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>3 -2 5 -7</code> ứng với 3x³ - 2x² + 5x - 7
        </div>
      </div>
      <div className="form-section-title">Tham số đạo hàm</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-k">
            Cấp đạo hàm <code>k</code> (nguyên ≥ 0)
          </label>
          <input
            className="form-input"
            id="in-k"
            name="k"
            type="number"
            min="0"
            step="1"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Ví dụ: <code>2</code> (tính P&apos;&apos;(c))</div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-c">
            Điểm tính đạo hàm <code>c</code>
          </label>
          <input
            className="form-input"
            id="in-c"
            name="c"
            type="text"
            spellCheck={false}
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Ví dụ: <code>2</code>, <code>-1.5</code></div>
        </div>
      </div>
    </>
  );
}

function PolyProductLinearFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Dãy nghiệm / Hằng số c_k</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-cList">
          Dãy các giá trị <code>c_k</code> (nhập cách nhau bằng dấu cách hoặc phẩy)
        </label>
        <input
          className="form-input"
          id="in-cList"
          name="cList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.2 1.5 1.7 2.1</code> tương ứng (x - 1.2)(x - 1.5)(x - 1.7)(x - 2.1)
        </div>
      </div>
    </>
  );
}

function InterpolationErrorFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Đánh giá sai số (nếu đề yêu cầu)</div>
      <div className="matrix-help">
        Sai số nội suy: <code>|R(x)| ≤ M_(n+1)/(n+1)! · |w_(n+1)(x)|</code>, với{" "}
        <code>w_(n+1)(x) = Π(x − x_i)</code>, <code>M_(n+1) = max |f^(n+1)(x)|</code> trên [a, b].
        Nhập <b>f(x)</b> để tự tính M_(n+1), hoặc nhập thẳng <b>M_(n+1)</b> nếu đề đã cho. Để trống cả hai nếu đề không yêu cầu.
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-errFx">
            Hàm <code>f(x)</code> (tùy chọn)
          </label>
          <input
            className="form-input"
            id="in-errFx"
            name="errFx"
            type="text"
            spellCheck={false}
            autoComplete="off"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">
            Ví dụ: <code>sin(x)</code>, <code>exp(x)</code>, <code>x^3 + 2*x</code>, <code>log(x)</code>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-errM">
            Hoặc <code>M_(n+1)</code> cho trước (tùy chọn)
          </label>
          <input
            className="form-input"
            id="in-errM"
            name="errM"
            type="text"
            spellCheck={false}
            autoComplete="off"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Ví dụ: <code>1</code>, <code>2.5</code> (ưu tiên hơn f(x))</div>
        </div>
      </div>
    </>
  );
}

function LagrangeInterpolationFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Bảng dữ liệu mốc nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">
          Dãy mốc <code>X = [x₀, x₁, ..., xₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-xList"
          name="xList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.2 1.5 1.7 1.8 2.1 2.3</code> (các mốc đôi một khác nhau)
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., yₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-yList"
          name="yList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>0.892 1.179 1.358 1.445 1.688 1.839</code>
        </div>
      </div>
      <div className="form-section-title">Điểm ước lượng (Tùy chọn)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">
          Tính giá trị <code>P_n(x*)</code> tại <code>x*</code>
        </label>
        <input
          className="form-input"
          id="in-xVal"
          name="xVal"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.6</code> (để trống nếu chỉ muốn tìm đa thức)
        </div>
      </div>
      <InterpolationErrorFields onKeyDown={onKeyDown} />
    </>
  );
}

function NewtonForwardInterpolationFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Bảng dữ liệu mốc nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">
          Dãy mốc <code>X = [x₀, x₁, ..., xₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-xList"
          name="xList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.2 1.5 1.7 1.9 2.1 2.4</code> (các mốc đôi một khác nhau)
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., yₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-yList"
          name="yList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>0.7247 0.1415 -0.2577 -0.6466 -1.0097 -1.4748</code>
        </div>
      </div>
      <div className="form-section-title">Điểm ước lượng (Tùy chọn)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">
          Tính giá trị <code>P_n(x*)</code> tại <code>x*</code>
        </label>
        <input
          className="form-input"
          id="in-xVal"
          name="xVal"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.6</code> (để trống nếu chỉ muốn tìm đa thức)
        </div>
      </div>
      <InterpolationErrorFields onKeyDown={onKeyDown} />
    </>
  );
}

function NewtonBackwardInterpolationFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Bảng dữ liệu mốc nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">
          Dãy mốc <code>X = [x₀, x₁, ..., xₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-xList"
          name="xList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>2.2 2.3 2.6 2.7 3.0 3.2</code> (các mốc đôi một khác nhau)
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., yₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-yList"
          name="yList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1.617 1.4914 1.031 0.8548 0.2822 -0.1167</code>
        </div>
      </div>
      <div className="form-section-title">Điểm ước lượng (Tùy chọn)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">
          Tính giá trị <code>P_n(x*)</code> tại <code>x*</code>
        </label>
        <input
          className="form-input"
          id="in-xVal"
          name="xVal"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>3.1</code> (để trống nếu chỉ muốn tìm đa thức)
        </div>
      </div>
      <InterpolationErrorFields onKeyDown={onKeyDown} />
    </>
  );
}

const NEWTON_UNIFORM_DEFAULTS = {
  algo1: {
    xList: "1.0 1.2 1.4 1.6 1.8",
    yList: "1.00 1.28 1.76 2.48 3.48",
    xVal: "1.1",
  },
  algo2: {
    xList: "0.00 0.25 0.50 0.75 1.00 1.25 1.50 1.75 2.00",
    yList: "0.0 1.0 2.0 4.0 7.0 11.0 16.0 22.0 29.0",
    xVal: "1.1",
  },
} as const;

function NewtonUniformForwardFields({ onKeyDown }: FieldProps) {
  const [mode, setMode] = useState<"algo1" | "algo2">("algo1");
  const isAlgo2 = mode === "algo2";

  const xListRef = useRef<HTMLInputElement>(null);
  const yListRef = useRef<HTMLInputElement>(null);
  const xValRef = useRef<HTMLInputElement>(null);

  // Default data for each mode
  // Auto-populate correct example data when mode changes
  useEffect(() => {
    const d = NEWTON_UNIFORM_DEFAULTS[mode];
    if (xListRef.current) xListRef.current.value = d.xList;
    if (yListRef.current) yListRef.current.value = d.yList;
    if (xValRef.current) xValRef.current.value = d.xVal;
  }, [mode]);

  return (
    <>
      {/* Hidden field carries mode into form params */}
      <input type="hidden" name="mode" value={mode} />

      {/* Tab switcher */}
      <div className="form-tab-group">
        <button
          type="button"
          className={`form-tab ${!isAlgo2 ? "form-tab--active" : ""}`}
          onClick={() => setMode("algo1")}
        >
          Thuật toán 1 — Toàn bộ bảng
        </button>
        <button
          type="button"
          className={`form-tab ${isAlgo2 ? "form-tab--active" : ""}`}
          onClick={() => setMode("algo2")}
        >
          Thuật toán 2 — Tự động chọn mốc
        </button>
      </div>

      {/* Description */}
      <div className="form-tab-desc">
        {!isAlgo2 ? (
          <span>Nhập toàn bộ bảng $X, Y$ (mốc cách đều). Thuật toán sẽ lập bảng sai phân tiến và xây dựng $P_n(t)$.</span>
        ) : (
          <span>Nhập bảng lớn $X, Y$ và điểm $x^*$ cần tính. Thuật toán tự động chọn $n$ mốc tối ưu xung quanh $x^*$ (đoạn nội suy $\approx 1$).</span>
        )}
      </div>

      {/* Common: xList, yList */}
      <div className="form-section-title">Bảng dữ liệu mốc nội suy (cách đều)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">
          Dãy mốc <code>X = [x₀, x₁, ..., xₙ]</code> (cách đều)
        </label>
        <input
          ref={xListRef}
          className="form-input"
          id="in-xList"
          name="xList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          {!isAlgo2 ? (
            <>Ví dụ: <code>1.0 1.2 1.4 1.6 1.8</code> (bước lưới $h = 0.2$)</>
          ) : (
            <>Ví dụ: <code>0.00 0.25 0.50 … 2.00</code> (bước lưới $h = 0.25$, ít nhất 5 mốc)</>
          )}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., yₙ]</code>
        </label>
        <input
          ref={yListRef}
          className="form-input"
          id="in-yList"
          name="yList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          {!isAlgo2 ? (
            <>Ví dụ: <code>1.00 1.28 1.76 2.48 3.48</code></>
          ) : (
            <>Ví dụ: <code>0.0 1.0 2.0 4.0 7.0 11.0 16.0 22.0 29.0</code></>
          )}
        </div>
      </div>

      {/* x* — optional for Algo 1, required for Algo 2 */}
      <div className="form-section-title">
        Điểm cần tính{!isAlgo2 && " (Tùy chọn)"}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">
          Tính giá trị <code>P_n(x*)</code> tại <code>x*</code>
          {isAlgo2 && <span className="form-required"> *</span>}
        </label>
        <input
          ref={xValRef}
          className="form-input"
          id="in-xVal"
          name="xVal"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          {!isAlgo2 ? (
            <>Ví dụ: <code>1.1</code> (để trống nếu chỉ muốn tìm đa thức)</>
          ) : (
            <>Bắt buộc. Ví dụ: <code>1.1</code> — thuật toán sẽ tự chọn mốc tối ưu xung quanh điểm này.</>
          )}
        </div>
      </div>
      <InterpolationErrorFields onKeyDown={onKeyDown} />
    </>
  );
}

function GaussCentralFields({
  method,
  onKeyDown,
}: FieldProps & { method: "gauss-forward-interpolation" | "gauss-backward-interpolation" }) {
  const isForward = method === "gauss-forward-interpolation";

  return (
    <>
      <div className="matrix-help">
        Nhập các mốc cách đều. Chỉ số mốc trung tâm bắt đầu từ <code>0</code>.
        {" "}{isForward ? "Gauss tiến dùng x* ở bên phải mốc trung tâm." : "Gauss lùi dùng x* ở bên trái mốc trung tâm."}
      </div>
      <div className="form-section-title">Bảng dữ liệu</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">Dãy mốc X (cách đều)</label>
        <input className="form-input" id="in-xList" name="xList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">Ví dụ: <code>-2 -1 0 1 2</code></div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">Dãy giá trị Y</label>
        <input className="form-input" id="in-yList" name="yList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">Ví dụ: <code>4 1 0 1 4</code></div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-centerIndex">Chỉ số mốc trung tâm</label>
          <input className="form-input" id="in-centerIndex" name="centerIndex" type="number" min="0" step="1" onKeyDown={onKeyDown} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-degree">Bậc nội suy</label>
          <input className="form-input" id="in-degree" name="degree" type="number" min="1" step="1" onKeyDown={onKeyDown} />
        </div>
      </div>
      <div className="form-section-title">Điểm nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">Điểm x*</label>
        <input className="form-input" id="in-xVal" name="xVal" type="text" spellCheck={false} onKeyDown={onKeyDown} />
      </div>
    </>
  );
}

function CentralEvenFields({
  method,
  onKeyDown,
}: FieldProps & { method: "stirling-interpolation" | "bessel-interpolation" }) {
  const isStirling = method === "stirling-interpolation";

  return (
    <>
      <div className="matrix-help">
        {isStirling
          ? "Nội suy Stirling: Tự động tìm mốc trung tâm x₀ gần x* nhất và trích xuất 2m + 1 mốc đối xứng (số lẻ), tự động xử lý chống tràn biên."
          : "Nội suy Bessel: Tự động tìm khoảng trung tâm [x₀, x₁] chứa x* và trích xuất 2m mốc đối xứng (số chẵn), tự động xử lý chống tràn biên."}
      </div>

      <div className="form-section-title">Bảng dữ liệu thực nghiệm (cách đều)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">Dãy mốc X (cách đều)</label>
        <input className="form-input" id="in-xList" name="xList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">Ví dụ: <code>{isStirling ? "1.4 1.5 1.6 1.7 1.8 1.9 2.0" : "-1 0 1 2 3 4"}</code></div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">Dãy giá trị Y</label>
        <input className="form-input" id="in-yList" name="yList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
      </div>

      <div className="form-section-title">Cấu hình mốc trích xuất & Điểm nội suy</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-nodeCount">
          Số mốc cần lấy <code>N_mốc</code> ({isStirling ? "số lẻ: 2m + 1" : "số chẵn: 2m"})
        </label>
        <input
          className="form-input"
          id="in-nodeCount"
          name="nodeCount"
          type="number"
          min={isStirling ? "3" : "2"}
          step={isStirling ? "2" : "2"}
          placeholder={isStirling ? "Ví dụ: 5 (số lẻ: 3, 5, 7...)" : "Ví dụ: 4 (số chẵn: 2, 4, 6...)"}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          {isStirling
            ? "Tùy chọn. Nhập số mốc lẻ 2m + 1 (m ≥ 1). Để trống sẽ lấy mảng lẻ lớn nhất."
            : "Tùy chọn. Nhập số mốc chẵn 2m (m ≥ 1). Để trống sẽ lấy mảng chẵn lớn nhất."}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="in-xVal">
          Điểm cần tính <code>x*</code> <span className="form-required">*</span>
        </label>
        <input className="form-input" id="in-xVal" name="xVal" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">
          {isStirling
            ? "Bắt buộc. Thuật toán tự tìm mốc trung tâm x₀ gần x* nhất để trích xuất mảng con."
            : "Bắt buộc. Thuật toán tự tìm khoảng [x₀, x₁] chứa x* để trích xuất mảng con."}
        </div>
      </div>
    </>
  );
}

function LeastSquaresFields({ onKeyDown }: FieldProps) {
  const [fitType, setFitType] = useState<string>("general");

  return (
    <>
      <div className="matrix-help">
        Bình phương tối thiểu: Tìm hàm xấp xỉ tốt nhất theo tổng bình phương sai số nhỏ nhất (SSD).
        Hỗ trợ hàm tuyến tính theo hệ cơ sở và 3 dạng phi tuyến (mũ, lũy thừa, logarit).
      </div>
      <div className="form-section-title">Mô hình xấp xỉ</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-fitType">Dạng hàm xấp xỉ</label>
        <select
          className="form-input"
          id="in-fitType"
          name="fitType"
          value={fitType}
          onChange={(e) => setFitType(e.target.value)}
        >
          <option value="general">I. Tuyến tính tổng quát: g(x) = ∑ aⱼφⱼ(x)</option>
          <option value="exponential">II.1. Hàm mũ tổng quát: y = a·exp(∑ bⱼφⱼ(x))</option>
          <option value="power">II.2. Hàm lũy thừa: y = a·xᵇ</option>
          <option value="logarithmic">II.3. Hàm logarit: y = ln(∑ bⱼφⱼ(x))</option>
        </select>
      </div>

      <div className="form-section-title">Dữ liệu thực nghiệm</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">Dãy mốc X</label>
        <input className="form-input" id="in-xList" name="xList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">
          {fitType === "power" ? "Yêu cầu mọi xᵢ > 0. Ví dụ: 1 2 3 4 5" : "Ví dụ: 0 1 2 3 4"}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">Dãy giá trị Y</label>
        <input className="form-input" id="in-yList" name="yList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        <div className="form-hint">
          {fitType === "exponential" || fitType === "power"
            ? "Yêu cầu yᵢ cùng dấu (cùng dương hoặc cùng âm) và khác 0."
            : "Ví dụ: 1.1 2.9 5.2 7.1 9.0"}
        </div>
      </div>

      {fitType !== "power" ? (
        <div className="form-group">
          <label className="form-label" htmlFor="in-basis">Hệ hàm cơ sở φⱼ(x)</label>
          <textarea
            className="form-textarea"
            id="in-basis"
            name="basis"
            rows={3}
            spellCheck={false}
            placeholder={
              fitType === "exponential"
                ? "x\nx^2"
                : fitType === "logarithmic"
                ? "x\n1"
                : "1\nx"
            }
          />
          <div className="form-hint">
            {fitType === "general" && (
              <>Cú pháp mathjs: mỗi hàm trên một dòng. Ví dụ: <code>1</code>, <code>x</code>, <code>x^2</code>, <code>sin(x)</code>.</>
            )}
            {fitType === "exponential" && (
              <>Các hàm cơ sở φⱼ(x) trên số mũ: y = a·exp(∑ bⱼφⱼ(x)). Hệ số hằng số a được tự động suy ra.</>
            )}
            {fitType === "logarithmic" && (
              <>Các hàm cơ sở φⱼ(x) bên trong logarit: y = ln(∑ bⱼφⱼ(x)). Ví dụ: <code>x</code> và <code>1</code>.</>
            )}
          </div>
        </div>
      ) : (
        <div className="form-hint">
          Dạng lũy thừa <code>y = a·xᵇ</code> tự động tuyến tính hóa qua <code>ln(x)</code>, không cần nhập hàm cơ sở.
        </div>
      )}
    </>
  );
}

function SmoothingSplineFields({ onKeyDown }: FieldProps) {
  const [degree, setDegree] = useState<string>("3");
  const [boundaryNode2, setBoundaryNode2] = useState<string>("1");
  const [boundaryType3, setBoundaryType3] = useState<string>("second");

  return (
    <>
      <div className="matrix-help">
        Hàm ghép trơn (Spline) cấp p (p ≤ 3) đi qua tập dữ liệu với các điều kiện liên tục đạo hàm và điều kiện biên.
      </div>
      <div className="form-section-title">Dữ liệu spline</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-splineDegree">Bậc p</label>
          <select
            className="form-input"
            id="in-splineDegree"
            name="degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
          >
            <option value="1">1 — tuyến tính</option>
            <option value="2">2 — bậc hai</option>
            <option value="3">3 — bậc ba</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-splineXVal">Điểm x* (tùy chọn)</label>
          <input className="form-input" id="in-splineXVal" name="xVal" type="text" spellCheck={false} onKeyDown={onKeyDown} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-splineXList">Dãy X tăng nghiêm ngặt</label>
        <input className="form-input" id="in-splineXList" name="xList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-splineYList">Dãy Y</label>
        <input className="form-input" id="in-splineYList" name="yList" type="text" spellCheck={false} onKeyDown={onKeyDown} />
      </div>

      {degree === "1" && (
        <div className="form-hint" style={{ marginTop: 8 }}>
          Spline tuyến tính (bậc 1) nối từng đoạn thẳng qua các mốc, không cần điều kiện biên.
        </div>
      )}

      {degree === "2" && (
        <>
          <div className="form-section-title">Điều kiện biên (Spline bậc hai)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="in-boundaryNode2">
                Chỉ số mốc <code>i</code> cho điều kiện biên
              </label>
              <input
                className="form-input"
                id="in-boundaryNode2"
                name="boundaryNode2"
                type="text"
                placeholder="1 (mốc x₁), 2 (mốc x₂), hoặc xn..."
                value={boundaryNode2}
                onChange={(e) => setBoundaryNode2(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <div className="form-hint">
                Nhập số <code>i</code> (1 là x₁, 2 là x₂, 3 là x₃... hoặc xn là mốc cuối).
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="in-splineBoundaryVal1">
                Giá trị <code>S′(x{boundaryNode2 ? boundaryNode2.replace(/^x/i, "") : "i"})</code>
              </label>
              <input
                className="form-input"
                id="in-splineBoundaryVal1"
                name="boundaryVal1"
                type="text"
                onKeyDown={onKeyDown}
              />
              <div className="form-hint">
                Thuật toán tự động đệ quy 2 chiều (tiến về cuối bảng và lùi về đầu bảng).
              </div>
            </div>
          </div>
        </>
      )}

      {degree === "3" && (
        <>
          <div className="form-section-title">Điều kiện biên (Spline bậc ba)</div>
          <div className="form-group">
            <label className="form-label" htmlFor="in-boundaryType3">Dạng điều kiện biên</label>
            <select
              className="form-input"
              id="in-boundaryType3"
              name="boundaryType3"
              value={boundaryType3}
              onChange={(e) => setBoundaryType3(e.target.value)}
            >
              <option value="second">Đạo hàm cấp 2 tại 2 đầu: S″(x₁) và S″(xₙ) (Spline tự nhiên khi = 0)</option>
              <option value="clamped">Đạo hàm cấp 1 tại 2 đầu (Clamped): S′(x₁) và S′(xₙ)</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="in-splineBoundaryVal1">
                {boundaryType3 === "second" ? <code>S″(x₁)</code> : <code>S′(x₁)</code>}
              </label>
              <input
                className="form-input"
                id="in-splineBoundaryVal1"
                name="boundaryVal1"
                type="text"
                onKeyDown={onKeyDown}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="in-splineBoundaryVal2">
                {boundaryType3 === "second" ? <code>S″(xₙ)</code> : <code>S′(xₙ)</code>}
              </label>
              <input
                className="form-input"
                id="in-splineBoundaryVal2"
                name="boundaryVal2"
                type="text"
                onKeyDown={onKeyDown}
              />
            </div>
          </div>
          <div className="form-hint">
            {boundaryType3 === "second"
              ? "Nhập 0 cho cả 2 mút để tìm Spline tự nhiên (Natural Spline)."
              : "Điều kiện biên kẹp (Clamped Spline) khống chế độ dốc tiếp tuyến ở 2 đầu."}
          </div>
        </>
      )}
    </>
  );
}

function ExtractEquidistantNodesFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        Trích xuất mảng con gồm <code>k</code> mốc cách đều tối ưu bao quanh điểm <code>x̄</code> từ bảng dữ liệu lớn.
      </div>
      <div className="form-section-title">Bảng dữ liệu gốc (Cách đều)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-xList">
          Dãy mốc <code>X = [x₀, x₁, ..., x_N]</code> (cách đều) <span className="form-required">*</span>
        </label>
        <input
          className="form-input"
          id="in-xList"
          name="xList"
          type="text"
          placeholder="0.00 0.25 0.50 0.75 1.00 1.25 1.50 1.75 2.00"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>0.00 0.25 0.50 0.75 1.00 1.25 1.50 1.75 2.00</code> (bước lưới h = 0.25)
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-yList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., y_N]</code> (Tùy chọn)
        </label>
        <input
          className="form-input"
          id="in-yList"
          name="yList"
          type="text"
          placeholder="0.0 1.0 2.0 4.0 7.0 11.0 16.0 22.0 29.0"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Nếu nhập dãy Y, thuật toán sẽ trích xuất đồng thời mảng con Y_sub tương ứng.
        </div>
      </div>

      <div className="form-section-title">Tham số trích xuất</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-kVal">
            Số mốc cần trích <code>k</code> <span className="form-required">*</span>
          </label>
          <input
            className="form-input"
            id="in-kVal"
            name="kVal"
            type="number"
            min="1"
            placeholder="5"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Số nguyên dương k ≤ tổng số mốc bảng gốc.</div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-xVal">
            Điểm cần tính <code>x̄</code> <span className="form-required">*</span>
          </label>
          <input
            className="form-input"
            id="in-xVal"
            name="xVal"
            type="text"
            placeholder="1.1"
            spellCheck={false}
            autoComplete="off"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Điểm cần định vị mốc trung tâm.</div>
        </div>
      </div>
    </>
  );
}

function InverseInterpolationFields({
  method,
  onKeyDown,
}: FieldProps & {
  method:
    | "inverse-isolation"
    | "monotone-intervals"
    | "inverse-newton-forward"
    | "inverse-newton-iteration";
}) {
  const needsYBar = method !== "monotone-intervals";
  const isIteration = method === "inverse-newton-iteration";
  const isInversePoly = method === "inverse-newton-forward";
  const hintX =
    method === "inverse-newton-forward"
      ? "0 1 2 3 4 5"
      : isIteration
        ? "1.0 1.2 1.4 1.6 1.8"
        : "0 1 2 3 4 5";
  const hintY =
    method === "inverse-newton-forward"
      ? "1 3 4 2 0 1"
      : isIteration
        ? "1.00 1.28 1.76 2.48 3.48"
        : "1 3 4 2 0 1";

  return (
    <>
      <div className="form-section-title">Bảng dữ liệu</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-invXList">
          Dãy mốc <code>X = [x₀, x₁, ..., xₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-invXList"
          name="xList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>{hintX}</code>
          {isIteration ? " (cách đều)" : " (tăng nghiêm ngặt)"}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-invYList">
          Dãy giá trị <code>Y = [y₀, y₁, ..., yₙ]</code>
        </label>
        <input
          className="form-input"
          id="in-invYList"
          name="yList"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>{hintY}</code>
          {isInversePoly ? " (tùy ý; nếu chưa đơn điệu sẽ tự động tìm khoảng đơn điệu chứa ȳ)" : ""}
        </div>
      </div>
      {needsYBar && (
        <>
          <div className="form-section-title">Giá trị cần tìm nghiệm</div>
          <div className="form-group">
            <label className="form-label" htmlFor="in-yBar">
              <code>ȳ</code> sao cho <code>f(x) = ȳ</code>
            </label>
            <input
              className="form-input"
              id="in-yBar"
              name="yBar"
              type="text"
              spellCheck={false}
              onKeyDown={onKeyDown}
            />
            <div className="form-hint">Ví dụ: <code>{isIteration ? "2.0" : "2.5"}</code></div>
          </div>
        </>
      )}
      {isInversePoly && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="in-invNodeCount">
              Số mốc cần lấy <code>k</code> (Tùy chọn)
            </label>
            <input
              className="form-input"
              id="in-invNodeCount"
              name="nodeCount"
              type="number"
              min="2"
              placeholder="Mặc định: lấy hết mốc của khoảng"
              spellCheck={false}
              onKeyDown={onKeyDown}
            />
            <div className="form-hint">
              Nhập <code>k ≥ 2</code> để trích xuất <code>k</code> mốc tối ưu xung quanh <code>ȳ</code>.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="in-invIntervalIdx">
              Chỉ số khoảng đơn điệu <code>K_j</code> (Tùy chọn)
            </label>
            <input
              className="form-input"
              id="in-invIntervalIdx"
              name="intervalIndex"
              type="number"
              min="1"
              placeholder="Mặc định: khoảng đầu tiên chứa ȳ"
              spellCheck={false}
              onKeyDown={onKeyDown}
            />
            <div className="form-hint">
              Khi có nhiều khoảng đơn điệu cùng chứa <code>ȳ</code>, có thể nhập <code>1, 2, ...</code> để chỉ định khoảng.
            </div>
          </div>
        </div>
      )}
      {isIteration && (
        <>
          <div className="form-section-title">Tham số lặp</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="in-invEps">
                Sai số <code>ε</code>
              </label>
              <input
                className="form-input"
                id="in-invEps"
                name="eps"
                type="text"
                onKeyDown={onKeyDown}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="in-invK">
                Chỉ số <code>k</code> của khoảng <code>[xₖ, xₖ₊₁]</code>
              </label>
              <input
                className="form-input"
                id="in-invK"
                name="k"
                type="text"
                onKeyDown={onKeyDown}
              />
              <div className="form-hint">
                Để trống để giải tất cả khoảng cách ly; hoặc nhập k để chỉ giải một khoảng.
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="in-iterMode">
              Phương pháp lặp
            </label>
            <select className="form-input" id="in-iterMode" name="iterMode">
              <option value="all">Tất cả phương pháp (Quanh tâm, Newton lùi, Newton tiến) (Khuyên dùng)</option>
              <option value="central">Newton tiến / lùi (quanh tâm)</option>
              <option value="backward">Newton lùi (từ mốc phải xₖ₊₁)</option>
              <option value="forward">Newton tiến (từ mốc trái xₖ)</option>
            </select>
            <div className="form-hint">
              Mặc định so sánh cả 3 phương pháp và lập bảng tổng hợp đối chiếu.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="in-iterNodeCount">
              Số mốc cần lấy <code>n</code> (Tùy chọn)
            </label>
            <input
              className="form-input"
              id="in-iterNodeCount"
              name="nodeCount"
              type="number"
              min="2"
              placeholder="Mặc định: dùng toàn bộ bảng"
              onKeyDown={onKeyDown}
            />
            <div className="form-hint">
              Nhập n ≥ 2 để trích xuất n mốc cách đều (giúp đa thức đạt bậc n−1 đầy đủ và tránh tràn số bảng sai phân).
            </div>
          </div>
        </>
      )}
    </>
  );
}

function BisectionFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hàm số</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-f">
          Hàm <code>f(x)</code> (cú pháp JS)
        </label>
        <input
          className="form-input"
          id="in-f"
          name="fStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>Math.exp(x) - Math.cos(2*x)</code>,{" "}
          <code>x**3 - x - 2</code>
        </div>
      </div>
      <div className="form-section-title">Khoảng cách ly nghiệm [a, b]</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-a">
            Cận dưới <code>a</code>
          </label>
          <input
            className="form-input"
            id="in-a"
            name="a"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-b">
            Cận trên <code>b</code>
          </label>
          <input
            className="form-input"
            id="in-b"
            name="b"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-section-title">Tham số</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-eps">
          Sai số <code>ε (epsilon)</code>
        </label>
        <input
          className="form-input"
          id="in-eps"
          name="epsilon"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>0.5e-5</code>, <code>1e-6</code>
        </div>
      </div>
    </>
  );
}

function TiepTuyenFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hàm số và đạo hàm</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-f">
          Hàm <code>f(x)</code>
        </label>
        <input
          className="form-input"
          id="in-f"
          name="fStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-df">
          Đạo hàm <code>f&apos;(x)</code>
        </label>
        <input
          className="form-input"
          id="in-df"
          name="dfStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-ddf">
          Đạo hàm bậc 2 <code>f&apos;&apos;(x)</code>
        </label>
        <input
          className="form-input"
          id="in-ddf"
          name="ddfStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-section-title">Khoảng và tham số</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-a">
            Cận dưới <code>a</code>
          </label>
          <input
            className="form-input"
            id="in-a"
            name="a"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-b">
            Cận trên <code>b</code>
          </label>
          <input
            className="form-input"
            id="in-b"
            name="b"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-m1">
            <code>m₁ = min|f&apos;(x)|</code> trên [a,b]
          </label>
          <input
            className="form-input"
            id="in-m1"
            name="m1"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function DayCungFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hàm số</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-f">
          Hàm <code>f(x)</code>
        </label>
        <input
          className="form-input"
          id="in-f"
          name="fStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Đạo hàm f&apos; và f&apos;&apos; sẽ được tính số tự động.
        </div>
      </div>
      <div className="form-section-title">Khoảng và tham số</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-a">
            Cận dưới <code>a</code>
          </label>
          <input
            className="form-input"
            id="in-a"
            name="a"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-b">
            Cận trên <code>b</code>
          </label>
          <input
            className="form-input"
            id="in-b"
            name="b"
            type="number"
            step="any"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-eps">
          Sai số <code>ε</code>
        </label>
        <input
          className="form-input"
          id="in-eps"
          name="epsilon"
          type="text"
          onKeyDown={onKeyDown}
        />
      </div>
    </>
  );
}

function LapDonFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hàm lặp</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-phi">
          Hàm <code>φ(x)</code> (sao cho x = φ(x))
        </label>
        <input
          className="form-input"
          id="in-phi"
          name="phiStr"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1 / Math.sqrt(x + 3)</code>
        </div>
      </div>
      <div className="form-section-title">Tham số</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-x0">
          Điểm xuất phát <code>x₀</code>
        </label>
        <input
          className="form-input"
          id="in-x0"
          name="x0"
          type="number"
          step="any"
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-q">
            Hệ số co <code>q</code> (0 &lt; q &lt; 1)
          </label>
          <input
            className="form-input"
            id="in-q"
            name="q"
            type="number"
            step="any"
            min="0"
            max="1"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function MatrixFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập mỗi hàng trên một dòng, các giá trị cách nhau bằng khoảng trắng
        hoặc dấu phẩy.
        <br />
        Ví dụ hàng: <code>1 2 1</code> hoặc <code>1, 2, 1</code>
      </div>
      <div className="form-section-title">Ma trận A (hệ số)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Ma trận B (vế phải)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matB">
          Ma trận B (có thể nhiều cột)
        </label>
        <textarea
          className="form-textarea"
          id="in-matB"
          name="matB"
          rows={4}
          spellCheck={false}
        />
        <div className="form-hint">
          Mỗi hàng = 1 vế phải. Nhiều cột = giải đồng thời nhiều hệ.
        </div>
      </div>
    </>
  );
}

function GaussJordanFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập mỗi hàng trên một dòng, các giá trị cách nhau bằng khoảng trắng
        hoặc dấu phẩy.
        <br />
        Ví dụ: <code>2 4 5 -6</code>
      </div>
      <div className="form-section-title">Ma trận A (hệ số)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={5}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Ma trận B (vế phải)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matB">
          Ma trận B
        </label>
        <textarea
          className="form-textarea"
          id="in-matB"
          name="matB"
          rows={5}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function GaussSeidelFields({ onKeyDown }: FieldProps) {
  const [eqFormat, setEqFormat] = useState<"Ax=b" | "x=Bx+d">("Ax=b");

  return (
    <>
      <div className="form-section-title">Dạng phương trình</div>
      <div className="form-row">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="equationFormat"
            value="Ax=b"
            checked={eqFormat === "Ax=b"}
            onChange={() => setEqFormat("Ax=b")}
          />
          <span>Hệ phương trình Ax = b</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="equationFormat"
            value="x=Bx+d"
            checked={eqFormat === "x=Bx+d"}
            onChange={() => setEqFormat("x=Bx+d")}
          />
          <span>Hệ phương trình lặp x = Bx + d</span>
        </label>
      </div>

      <div className="matrix-help">
        📋 Nhập ma trận vuông {eqFormat === "Ax=b" ? "A" : "B"} (mỗi hàng một
        dòng) và vector {eqFormat === "Ax=b" ? "b" : "d"} (mỗi dòng một giá
        trị).
        <br />
        Ví dụ hàng {eqFormat === "Ax=b" ? "A" : "B"}: <code>10 5 7</code>
      </div>
      <div className="form-section-title">
        Ma trận {eqFormat === "Ax=b" ? "A (hệ số)" : "B"}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận {eqFormat === "Ax=b" ? "A" : "B"} (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">
        Vector {eqFormat === "Ax=b" ? "b (vế phải)" : "d"}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecB">
          Vector {eqFormat === "Ax=b" ? "b" : "d"} (mỗi dòng 1 giá trị)
        </label>
        <textarea
          className="form-textarea"
          id="in-vecB"
          name="vecB"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Tham số lặp</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-x0">
          Xấp xỉ đầu X⁽⁰⁾
        </label>
        <input
          className="form-input"
          id="in-x0"
          name="x0Str"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>0 0 0</code>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIter">
            Số lặp tối đa <code>N</code>
          </label>
          <input
            className="form-input"
            id="in-maxIter"
            name="maxIter"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function JacobiMatrixFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A (mỗi hàng một dòng) và vector b (mỗi dòng một
        giá trị).
      </div>
      <div className="form-section-title">Ma trận A (hệ số)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Vector b (vế phải)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecB">
          Vector b (mỗi dòng 1 giá trị)
        </label>
        <textarea
          className="form-textarea"
          id="in-vecB"
          name="vecB"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Tham số lặp</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIterStr">
            Số lặp tối đa <code>N</code>
          </label>
          <input
            className="form-input"
            id="in-maxIterStr"
            name="maxIterStr"
            type="number"
            min="1"
            step="1"
            defaultValue="100"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function NewtonSystemFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hệ phương trình F(X) = 0</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vars">
          Các biến số (cách nhau bằng dấu phẩy)
        </label>
        <input
          className="form-input"
          id="in-vars"
          name="vars"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>x, y</code> hoặc <code>x1, x2, x3</code>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-funcs">
          Các phương trình f_i(X) = 0 (mỗi dòng 1 phương trình)
        </label>
        <textarea
          className="form-textarea"
          id="in-funcs"
          name="funcs"
          rows={4}
          spellCheck={false}
        />
      </div>

      <div className="form-section-title">Tham số lặp</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-x0">
          Xấp xỉ đầu X₀ (cách nhau bằng khoảng trắng)
        </label>
        <input
          className="form-input"
          id="in-x0"
          name="x0Str"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-tol">
            Sai số (Tolerance)
          </label>
          <input
            className="form-input"
            id="in-tol"
            name="tol"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIter">
            Số lặp tối đa
          </label>
          <input
            className="form-input"
            id="in-maxIter"
            name="maxIter"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function LapDonSystemFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="form-section-title">Hệ hàm lặp Φ(X)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vars-lapdon">
          Các biến số (cách nhau bằng dấu phẩy)
        </label>
        <input
          className="form-input"
          id="in-vars-lapdon"
          name="vars"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>x1, x2, x3</code> hoặc <code>x, y</code>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-phis">
          Các hàm φ_i(X) (mỗi dòng 1 hàm)
        </label>
        <textarea
          className="form-textarea"
          id="in-phis"
          name="phis"
          rows={4}
          spellCheck={false}
        />
        <div className="form-hint">
          Ví dụ: <code>(cos(x2 * x3) + 0.5) / 3</code>
        </div>
      </div>

      <div className="form-section-title">Tham số lặp</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-x0-lapdon">
          Xấp xỉ đầu X₀ (cách nhau bằng khoảng trắng)
        </label>
        <input
          className="form-input"
          id="in-x0-lapdon"
          name="x0Str"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-q">
            Hệ số co <code>q</code> (0 &lt; q &lt; 1)
          </label>
          <input
            className="form-input"
            id="in-q"
            name="q"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps-lapdon">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps-lapdon"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-maxIter-lapdon">
          Số lặp tối đa
        </label>
        <input
          className="form-input"
          id="in-maxIter-lapdon"
          name="maxIter"
          type="number"
          min="1"
          step="1"
          onKeyDown={onKeyDown}
        />
      </div>
    </>
  );
}

function PowerEigenFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A (mỗi hàng một dòng) và vector ban đầu x⁽⁰⁾ ≠ 0.
        <br />
        Ví dụ hàng A: <code>4 1</code>
      </div>
      <div className="form-section-title">Ma trận A (n × n)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Tham số lặp</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-x0">
          Vector ban đầu x⁽⁰⁾
        </label>
        <input
          className="form-input"
          id="in-x0"
          name="x0Str"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1 1</code>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIter">
            Số lặp tối đa <code>N</code>
          </label>
          <input
            className="form-input"
            id="in-maxIter"
            name="maxIter"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function DanilevskyFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông cấp n, mỗi hàng trên một dòng, các giá trị cách
        nhau bằng khoảng trắng hoặc dấu phẩy.
        <br />
        Ví dụ: <code>2 1 0 3 1</code>
      </div>
      <div className="form-section-title">Ma trận A (n × n)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận vuông A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={6}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function LuDecomposeFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A (mỗi hàng một dòng), các giá trị cách nhau bằng
        khoảng trắng hoặc dấu phẩy.
        <br />
        Ví dụ: <code>2 2 0</code>
      </div>
      <div className="form-section-title">Ma trận A (n × n)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận vuông A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={6}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function CholeskyDecomposeFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông đối xứng xác định dương A (mỗi hàng một dòng).
        <br />
        Ví dụ: <code>1 1 1</code>
      </div>
      <div className="form-section-title">Ma trận A (n × n, đối xứng SPD)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={8}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function CholeskySolveFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông đối xứng xác định dương A và vector B (mỗi dòng
        một giá trị).
        <br />
        Ví dụ hàng A: <code>1 1 1</code>
      </div>
      <div className="form-section-title">Ma trận A (hệ số, đối xứng SPD)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={7}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Ma trận B (vế phải)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecB">
          Ma trận B (có thể nhiều cột)
        </label>
        <textarea
          className="form-textarea"
          id="in-vecB"
          name="vecB"
          rows={4}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function LuSolveFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A (mỗi hàng một dòng) và ma trận B (mỗi hàng một dòng, các cột cách nhau bằng khoảng trắng).
        <br />
        Ví dụ hàng A: <code>2 2 0</code>
      </div>
      <div className="form-section-title">Ma trận A (hệ số)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={6}
          spellCheck={false}
        />
      </div>
      <div className="form-section-title">Ma trận B (vế phải)</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecB">
          Ma trận B (có thể nhiều cột)
        </label>
        <textarea
          className="form-textarea"
          id="in-vecB"
          name="vecB"
          rows={4}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function XuongThangFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận vuông A, giá trị riêng lớn nhất λ₁ và véc-tơ riêng v₁
        tương ứng.
        <br />
        Chọn cách giải bằng Select box bên dưới.
      </div>
      <div className="form-section-title">Phương pháp giải</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-method">
          Chọn Cách Giải
        </label>
        <select className="form-input" id="in-method" name="method">
          <option value="C1">Cách 1: Sử dụng Véc-tơ riêng trái (w₁)</option>
          <option value="C2">Cách 2: Sử dụng Ma trận khử (Θ)</option>
          <option value="C3">
            Cách 3: Phương pháp Wielandt (Cho ma trận đối xứng)
          </option>
        </select>
      </div>
      <div className="form-section-title">Đầu vào Ma trận & Véc-tơ</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (n × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-lambda1">
            Giá trị riêng λ₁
          </label>
          <input
            className="form-input"
            id="in-lambda1"
            name="lambda1Str"
            type="text"
            spellCheck={false}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-vecV1">
            Véc-tơ riêng v₁
          </label>
          <input
            className="form-input"
            id="in-vecV1"
            name="vecV1"
            type="text"
            spellCheck={false}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-section-title">Tham số Lũy thừa</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecY0">
          Véc-tơ lặp y₀
        </label>
        <input
          className="form-input"
          id="in-vecY0"
          name="vecY0"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Ví dụ: <code>1 1</code> (Mặc định toàn số 1)
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIter">
            Số lặp tối đa <code>N</code>
          </label>
          <input
            className="form-input"
            id="in-maxIter"
            name="maxIter"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </>
  );
}

function SvdMatrixFields({
  method,
}: {
  method: "svd" | "pseudoinverse" | "condition-number";
}) {
  const hints: Record<typeof method, string> = {
    svd: "Mọi kích thước m × n. Ví dụ: ma trận 3×2 rank thấp.",
    pseudoinverse: "Mọi kích thước m × n. Kết quả sẽ là ma trận n × m.",
    "condition-number": "Khuyến nghị ma trận vuông n × n.",
  };
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận A (mỗi hàng một dòng, các giá trị cách nhau bằng khoảng
        trắng hoặc dấu phẩy).
        <br />
        {hints[method]}
      </div>
      <div className="form-section-title">Ma trận A</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (m × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={5}
          spellCheck={false}
        />
      </div>
      {(method === "svd") && (
        <>
          <div className="form-section-title">Xấp xỉ ma trận (Tùy chọn)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="in-truncR">
                Số bậc r (giữ r giá trị)
              </label>
              <input
                className="form-input"
                id="in-truncR"
                name="truncationR"
                type="number"
                min="1"
                step="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="in-targetErr">
                Hoặc Sai số tối đa (%)
              </label>
              <input
                className="form-input"
                id="in-targetErr"
                name="targetErrorPct"
                type="number"
                min="0"
                step="any"
              />
              <div className="form-hint">Ví dụ: <code>5</code></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SvdPowerFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập ma trận A, véc-tơ khởi tạo x₀ (số chiều bằng số cột của A).
      </div>
      <div className="form-section-title">Thông số Lũy thừa</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-matA">
          Ma trận A (m × n)
        </label>
        <textarea
          className="form-textarea"
          id="in-matA"
          name="matA"
          rows={4}
          spellCheck={false}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vecX0">
          Véc-tơ khởi tạo x₀
        </label>
        <input
          className="form-input"
          id="in-vecX0"
          name="x0Str"
          type="text"
          spellCheck={false}
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">Ví dụ: <code>1 1</code></div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-eps">
            Sai số <code>ε</code>
          </label>
          <input
            className="form-input"
            id="in-eps"
            name="epsilon"
            type="text"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-maxIter">
            Số lặp tối đa <code>N</code>
          </label>
          <input
            className="form-input"
            id="in-maxIter"
            name="maxIter"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      <div className="form-section-title">Xấp xỉ ma trận (Tùy chọn)</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="in-truncR2">
            Số bậc r (giữ r giá trị)
          </label>
          <input
            className="form-input"
            id="in-truncR2"
            name="truncationR"
            type="number"
            min="1"
            step="1"
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="in-targetErr2">
            Hoặc Sai số tối đa (%)
          </label>
          <input
            className="form-input"
            id="in-targetErr2"
            name="targetErrorPct"
            type="number"
            min="0"
            step="any"
            onKeyDown={onKeyDown}
          />
          <div className="form-hint">Ví dụ: <code>5</code></div>
        </div>
      </div>
    </>
  );
}

function GramSchmidtFields() {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập tập hợp các vector cần trực chuẩn hóa.
        <br />
        <strong>Mỗi hàng là một vector</strong>, các giá trị cách nhau bằng dấu
        cách hoặc phẩy.
        <br />
        Ví dụ:
        <br />
        <code>1 1 0</code>
        <br />
        <code>1 0 1</code>
        <br />
        <code>0 1 1</code>
      </div>
      <div className="form-section-title">Tập Vector Đầu Vào</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-vectors">
          Các vector (v₁, v₂, ..., vₙ)
        </label>
        <textarea
          className="form-textarea"
          id="in-vectors"
          name="vectors"
          rows={5}
          spellCheck={false}
        />
      </div>
    </>
  );
}

function PolynomialFields({ onKeyDown }: FieldProps) {
  return (
    <>
      <div className="matrix-help">
        📋 Nhập mảng các hệ số của đa thức (từ bậc cao nhất đến bậc thấp nhất).
        <br />
        <strong>Lưu ý:</strong> Chúng tôi yêu cầu bạn nhập trực tiếp hệ số (thay vì nhập hàm số dạng chuỗi như <code>x^3 - x - 2</code>) nhằm đảm bảo thuật toán phân tích đa thức, chia đa thức dư và thiết lập dãy Sturm hoạt động hoàn toàn chính xác và ổn định.
        <br />
        <br />
        Ví dụ đối với đa thức $x^3 - x - 2$, hãy nhập:
        <br />
        <code>1 0 -1 -2</code>
      </div>
      <div className="form-section-title">Hệ số Đa thức</div>
      <div className="form-group">
        <label className="form-label" htmlFor="in-coeffs">
          Mảng hệ số (cách nhau bởi khoảng trắng hoặc dấu phẩy)
        </label>
        <input
          className="form-input"
          id="in-coeffs"
          name="coeffs"
          type="text"
          spellCheck={false}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        <div className="form-hint">
          Hệ số bậc cao nhất phải khác 0. Cần bao gồm cả số 0 nếu khuyết bậc.
        </div>
      </div>
    </>
  );
}
