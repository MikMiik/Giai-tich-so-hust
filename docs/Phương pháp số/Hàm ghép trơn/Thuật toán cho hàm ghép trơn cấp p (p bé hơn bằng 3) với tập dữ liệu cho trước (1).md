- **Input:**
  - Cấp độ của Spline: $p \in \{1, 2, 3\}$.
  - Bảng $n$ mốc dữ liệu: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]$ ($x_1 < x_2 < \dots < x_n$).
  - Điều kiện biên:
    - Cấp 1 ($p=1$): Không cần.
    - Cấp 2 ($p=2$): 1 điều kiện đạo hàm cấp 1 tại một mốc $x_i$ bất kỳ ($i \in \{1, 2, \dots, n\}$): $S'(x_i) = m_i$.
    - Cấp 3 ($p=3$): 2 điều kiện biên (nhập cặp $S''$ tại 2 mốc $x_1, x_n$ hoặc cặp $S'$ tại 2 mốc $x_1, x_n$).
- **Steps:**
  1. **Tính khoảng cách lưới:**
     - Lặp $k = 1, \dots, n-1$:
       $$h_k = x_{k+1} - x_k$$
  2. **Tính mảng hệ số đa thức $S_k(x)$ trên từng đoạn $[x_k, x_{k+1}]$ ($k = 1, \dots, n-1$):**
     - **Trường hợp $p = 1$:** Đa thức $S_k(x) = a_k x + b_k$:
       $$a_k = \frac{y_{k+1} - y_k}{h_k}, \quad b_k = y_k - a_k x_k$$
     - **Trường hợp $p = 2$:** Đa thức $S_k(x) = a_k x^2 + b_k x + c_k$.
       - _Bước 2.1: Tính mảng đạo hàm cấp 1 $m = [m_1, m_2, \dots, m_n]$ từ mốc biên $x_i$ ($S'(x_i) = m_i$):_
         - Gán giá trị biên: $m_i = S'(x_i)$.
         - **Chiều tiến** (với $k = i, i+1, \dots, n-1$):
           $$m_{k+1} = \frac{2(y_{k+1} - y_k)}{h_k} - m_k$$
         - **Chiều lùi** (với $k = i-1, i-2, \dots, 1$):
           $$m_k = \frac{2(y_{k+1} - y_k)}{h_k} - m_{k+1}$$
       - _Bước 2.2: Tính bộ hệ số trên từng đoạn:_
         $$a_k = \frac{m_{k+1} - m_k}{2h_k}$$
         $$b_k = \frac{m_k x_{k+1} - m_{k+1} x_k}{h_k}$$
         $$c_k = \frac{-m_k x_{k+1}^2 + m_{k+1} x_k^2}{2h_k} + y_k + \frac{m_k h_k}{2}$$
     - **Trường hợp $p = 3$:** Đa thức $S_k(x) = a_k x^3 + b_k x^2 + c_k x + d_k$.
       - _Bước 2.1: Lập và giải hệ ma trận 3 đường chéo tìm mảng đạo hàm cấp 2 $\alpha = [\alpha_1, \alpha_2, \dots, \alpha_n]$:_
         - Lập $n-2$ phương trình liên tục đạo hàm tại các mốc trong ($k = 1, \dots, n-2$):
           $$\frac{h_k}{6}\alpha_k + \frac{h_k + h_{k+1}}{3}\alpha_{k+1} + \frac{h_{k+1}}{6}\alpha_{k+2} = \frac{y_{k+2} - y_{k+1}}{h_{k+1}} - \frac{y_{k+1} - y_k}{h_k}$$
         - Bổ sung 2 phương trình biên tùy theo dạng bài toán:
           - **Dạng 1 (Biên đạo hàm cấp 2 $S''$ tại $x_1, x_n$):** Gán trực tiếp $\alpha_1 = S''(x_1)$ và $\alpha_n = S''(x_n)$.
           - **Dạng 2 (Biên đạo hàm cấp 1 $S'$ tại $x_1, x_n$ - Clamped Spline):** Thêm 2 phương trình biên vào đầu và cuối ma trận:
             $$\frac{h_1}{3}\alpha_1 + \frac{h_1}{6}\alpha_2 = \frac{y_2 - y_1}{h_1} - S'(x_1)$$
             $$\frac{h_{n-1}}{6}\alpha_{n-1} + \frac{h_{n-1}}{3}\alpha_n = S'(x_n) - \frac{y_n - y_{n-1}}{h_{n-1}}$$
         - Giải hệ phương trình 3 đường chéo bằng Thuật toán Thomas thu được mảng $\alpha$.
       - _Bước 2.2: Tính bộ hệ số trên từng đoạn:_
         $$a_k = \frac{\alpha_{k+1} - \alpha_k}{6h_k}$$
         $$b_k = \frac{3\alpha_k x_{k+1} - 3\alpha_{k+1} x_k}{6h_k}$$
         $$c_k = \frac{-3\alpha_k x_{k+1}^2 + 3\alpha_{k+1} x_k^2}{6h_k} + \frac{y_{k+1} - y_k}{h_k} - \frac{(\alpha_{k+1} - \alpha_k)h_k}{6}$$
         $$d_k = \frac{\alpha_k x_{k+1}^3 - \alpha_{k+1} x_k^3}{6h_k} + \frac{y_k x_{k+1} - y_{k+1} x_k}{h_k} + \frac{(\alpha_{k+1} x_k - \alpha_k x_{k+1})h_k}{6}$$
- **Output:** Tập các đa thức nội suy $S_k(x)$ đại diện cho hàm Spline cấp $p$ trên từng đoạn $[x_k, x_{k+1}]$.
