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
