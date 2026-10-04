import Link from "next/link";

export default function RootPage() {
  return (
    <div className="portal-container">
      {/* Background visual effects */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <main className="portal-main">
        {/* Header / Intro */}
        <div className="portal-header">
          <div className="portal-badge">
            <span className="badge-dot" />
            NỀN TẢNG TOÁN HỌC SỐ TRỊ
          </div>
          <h1 className="portal-title">Chọn Phân Hệ Môn Học</h1>
          <p className="portal-desc">
            Hệ thống giải toán từng bước với công thức $\LaTeX$, bảng lặp số trị và phân tích sai số chi tiết.
          </p>
        </div>

        {/* 2 Central Selection Cards / Buttons */}
        <div className="portal-grid">
          {/* GTS Card */}
          <Link href="/gts/bisection" className="portal-card portal-card--gts">
            <div className="card-glow" />
            <div className="card-icon-wrapper">
              <span className="card-icon">∑</span>
            </div>
            <div className="card-content">
              <div className="card-tag">Giải Tích Số</div>
              <h2 className="card-title">GTS</h2>
              <p className="card-desc">
                Giải phương trình phi tuyến 1D &amp; hệ phi tuyến, Khử Gauss, LU, Cholesky, Jacobi, Gauss-Seidel, Trị riêng, SVD và Nghịch đảo ma trận.
              </p>
            </div>
            <div className="card-action">
              <span>Bắt đầu với GTS</span>
              <span className="arrow-icon">→</span>
            </div>
          </Link>

          {/* PPS Card */}
          <Link href="/pps/chebyshev-nodes" className="portal-card portal-card--pps">
            <div className="card-glow" />
            <div className="card-icon-wrapper">
              <span className="card-icon">∫</span>
            </div>
            <div className="card-content">
              <div className="card-tag">Phương Pháp Số</div>
              <h2 className="card-title">PPS</h2>
              <p className="card-desc">
                Xác định mốc nội suy tối ưu Chebyshev trên $[a, b]$, đa thức nội suy, xấp xỉ hàm, vi phân và tích phân số trị.
              </p>
            </div>
            <div className="card-action">
              <span>Bắt đầu với PPS</span>
              <span className="arrow-icon">→</span>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <footer className="portal-footer">
          <span>GTS &amp; PPS Solver &bull; Tối ưu hóa tính toán số</span>
        </footer>
      </main>
    </div>
  );
}
