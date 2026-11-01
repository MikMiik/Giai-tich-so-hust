- **Input:**
  - Cấp độ của Spline: $p \in \{1, 2, 3\}$.
  - Bảng $n$ mốc dữ liệu: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]$ ($x_1 < x_2 < \dots < x_n$).
  - Điều kiện biên: (Cấp 1: không cần; Cấp 2: cần 1 điều kiện; Cấp 3: cần 2 điều kiện).
- **Steps:**
  1. **Tính khoảng cách lưới:**
     - Lặp $k = 1, \dots, n-1$:
       $$h_k = x_{k+1} - x_k$$
  2. **Tính mảng hệ số đa thức $S_k(x)$ trên từng đoạn $[x_k, x_{k+1}]$:**
     - **Trường hợp $p = 1$:** Tính trực tiếp đường thẳng $S_k(x) = a_k x + b_k$:
       $$a_k = \frac{y_{k+1} - y_k}{h_k}, \quad b_k = y_k - a_k x_k$$
     - **Trường hợp $p = 2$:** Đa thức $S_k(x) = a_k x^2 + b_k x + c_k$.
       - Kết hợp $m_1 = \text{Giá trị biên}$ và giải hệ $n-1$ phương trình đệ quy tiến:
         $$m_{k+1} = \frac{2(y_{k+1} - y_k)}{h_k} - m_k \quad (k = 1, \dots, n-1)$$
       - Tính hệ số:
         $$a_k = \frac{m_{k+1} - m_k}{2h_k} \quad ; \quad b_k = \frac{m_k x_{k+1} - m_{k+1} x_k}{h_k}$$
         $$c_k = \frac{-m_k x_{k+1}^2 + m_{k+1} x_k^2}{2h_k} + y_k + \frac{m_k h_k}{2}$$
     - **Trường hợp $p = 3$:** Đa thức $S_k(x) = a_k x^3 + b_k x^2 + c_k x + d_k$.
       - Lập hệ $n-2$ phương trình ($k=1, \dots, n-2$) tìm mảng đạo hàm cấp 2 $\alpha$:
         $$\frac{h_k}{6}\alpha_k + \frac{h_k + h_{k+1}}{3}\alpha_{k+1} + \frac{h_{k+1}}{6}\alpha_{k+2} = \frac{y_{k+2} - y_{k+1}}{h_{k+1}} - \frac{y_{k+1} - y_k}{h_k}$$
       - Kết hợp 2 điều kiện biên $\alpha_1, \alpha_n$ và giải hệ bằng thuật toán Thomas.
       - Tính hệ số:
         $$a_k = \frac{\alpha_{k+1} - \alpha_k}{6h_k} \quad ; \quad b_k = \frac{3\alpha_k x_{k+1} - 3\alpha_{k+1} x_k}{6h_k}$$
         $$c_k = \frac{-3\alpha_k x_{k+1}^2 + 3\alpha_{k+1} x_k^2}{6h_k} + \frac{y_{k+1} - y_k}{h_k} - \frac{(\alpha_{k+1} - \alpha_k)h_k}{6}$$
         $$d_k = \frac{\alpha_k x_{k+1}^3 - \alpha_{k+1} x_k^3}{6h_k} + \frac{y_k x_{k+1} - y_{k+1} x_k}{h_k} + \frac{(\alpha_{k+1} x_k - \alpha_k x_{k+1})h_k}{6}$$
- **Output:** Tập các đa thức nội suy $S_k(x)$ đại diện cho hàm Spline cấp $p$ trên từng đoạn $[x_k, x_{k+1}]$.
