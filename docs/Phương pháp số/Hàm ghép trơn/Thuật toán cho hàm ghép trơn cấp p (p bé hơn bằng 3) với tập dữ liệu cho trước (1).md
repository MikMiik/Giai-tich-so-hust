- **Input:**
  - Cấp độ của Spline: $p \in \{1, 2, 3\}$.
  - Bảng $n$ mốc dữ liệu: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]$ ($x_1 < x_2 < \dots < x_n$).
  - Điều kiện biên:
    - Cấp 1 ($p=1$): Không cần.
    - Cấp 2 ($p=2$): 1 điều kiện đạo hàm cấp 1 tại một mốc $x_i$ bất kỳ ($i \in \{1, 2, \dots, n\}$): $S'(x_i) = m_i$.
    - Cấp 3 ($p=3$): 2 điều kiện biên, thuộc một trong 4 tổ hợp:
      1. Đạo hàm cấp 2 tại hai mút: $S''(x_1) = b_1, S''(x_n) = b_2$ (Spline tự nhiên - Natural Spline khi $b_1 = b_2 = 0$).
      2. Đạo hàm cấp 1 tại hai mút (Clamped Spline): $S'(x_1) = b_1, S'(x_n) = b_2$.
      3. Biên hỗn hợp mút trái đạo hàm cấp 1, mút phải đạo hàm cấp 2: $S'(x_1) = b_1, S''(x_n) = b_2$.
      4. Biên hỗn hợp mút trái đạo hàm cấp 2, mút phải đạo hàm cấp 1: $S''(x_1) = b_1, S'(x_n) = b_2$.
  - Điểm cần tính giá trị và đạo hàm: $x^*$ (tùy chọn).

- **Steps:**
  1. **Tính khoảng cách lưới:**
     - Lặp $k = 1, \dots, n-1$:
       $$h_k = x_{k+1} - x_k$$

  2. **Tính mảng hệ số đa thức $S_k(x)$ trên từng đoạn $[x_k, x_{k+1}]$ ($k = 1, \dots, n-1$):**
     - **Trường hợp $p = 1$:**
       - Dạng khai triển Taylor cục bộ: $S_k(x) = y_k + m_k(x - x_k)$, trong đó $m_k = \frac{y_{k+1} - y_k}{h_k}$.
       - Dạng chính tắc: $S_k(x) = a_k x + b_k$:
         $$a_k = m_k = \frac{y_{k+1} - y_k}{h_k}, \quad b_k = y_k - a_k x_k$$
     
     - **Trường hợp $p = 2$:**
       - _Bước 2.1: Tính mảng đạo hàm cấp 1 $m = [m_1, m_2, \dots, m_n]$ từ mốc biên $x_i$ ($S'(x_i) = m_i$):_
         - Gán giá trị biên: $m_i = S'(x_i)$.
         - **Chiều tiến** (với $k = i, i+1, \dots, n-1$):
           $$m_{k+1} = \frac{2(y_{k+1} - y_k)}{h_k} - m_k$$
         - **Chiều lùi** (với $k = i-1, i-2, \dots, 1$):
           $$m_k = \frac{2(y_{k+1} - y_k)}{h_k} - m_{k+1}$$
       - _Bước 2.2: Lập đa thức trên từng đoạn:_
         - Dạng khai triển Taylor cục bộ:
           $$S_k(x) = y_k + m_k(x - x_k) + a_k(x - x_k)^2, \quad a_k = \frac{m_{k+1} - m_k}{2h_k}$$
         - Dạng chính tắc $S_k(x) = a_k x^2 + b_k x + c_k$:
           $$a_k = \frac{m_{k+1} - m_k}{2h_k}$$
           $$b_k = \frac{m_k x_{k+1} - m_{k+1} x_k}{h_k}$$
           $$c_k = \frac{-m_k x_{k+1}^2 + m_{k+1} x_k^2}{2h_k} + y_k + \frac{m_k h_k}{2}$$

     - **Trường hợp $p = 3$:**
       - _Bước 2.1: Lập và giải hệ ma trận 3 đường chéo tìm mảng đạo hàm cấp 2 $\alpha = [\alpha_1, \alpha_2, \dots, \alpha_n]$:_
         - Các phương trình liên tục đạo hàm tại các mốc trong ($k = 2, \dots, n-1$):
           $$\frac{h_{k-1}}{6}\alpha_{k-1} + \frac{h_{k-1} + h_k}{3}\alpha_k + \frac{h_k}{6}\alpha_{k+1} = \frac{y_{k+1} - y_k}{h_k} - \frac{y_k - y_{k-1}}{h_{k-1}}$$
         - Bổ sung 2 điều kiện biên tùy theo 4 dạng bài toán:
           - **Dạng 1 (Biên $S''$ cả hai đầu):** Gán trực tiếp $\alpha_1 = S''(x_1)$ và $\alpha_n = S''(x_n)$. Hệ $n-2$ ẩn giải $\alpha_2, \dots, \alpha_{n-1}$.
           - **Dạng 2 (Clamped Spline - Biên $S'$ cả hai đầu):** Hệ $n$ phương trình giải $\alpha_1, \dots, \alpha_n$ với 2 phương trình biên:
             $$\frac{h_1}{3}\alpha_1 + \frac{h_1}{6}\alpha_2 = \frac{y_2 - y_1}{h_1} - S'(x_1)$$
             $$\frac{h_{n-1}}{6}\alpha_{n-1} + \frac{h_{n-1}}{3}\alpha_n = S'(x_n) - \frac{y_n - y_{n-1}}{h_{n-1}}$$
           - **Dạng 3 (Biên hỗn hợp $S'(x_1)$ và $S''(x_n)$):** Đã biết $\alpha_n = S''(x_n)$. Hệ $n-1$ phương trình giải $\alpha_1, \dots, \alpha_{n-1}$:
             - Phương trình biên trái tại $x_1$: $\frac{h_1}{3}\alpha_1 + \frac{h_1}{6}\alpha_2 = \frac{y_2 - y_1}{h_1} - S'(x_1)$.
             - Phương trình tại mốc $k = n-1$: $\frac{h_{n-2}}{6}\alpha_{n-2} + \frac{h_{n-2} + h_{n-1}}{3}\alpha_{n-1} = \frac{y_n - y_{n-1}}{h_{n-1}} - \frac{y_{n-1} - y_{n-2}}{h_{n-2}} - \frac{h_{n-1}}{6}S''(x_n)$.
           - **Dạng 4 (Biên hỗn hợp $S''(x_1)$ và $S'(x_n)$):** Đã biết $\alpha_1 = S''(x_1)$. Hệ $n-1$ phương trình giải $\alpha_2, \dots, \alpha_n$:
             - Phương trình tại mốc $k = 2$: $\frac{h_1 + h_2}{3}\alpha_2 + \frac{h_2}{6}\alpha_3 = \frac{y_3 - y_2}{h_2} - \frac{y_2 - y_1}{h_1} - \frac{h_1}{6}S''(x_1)$.
             - Phương trình biên phải tại $x_n$: $\frac{h_{n-1}}{6}\alpha_{n-1} + \frac{h_{n-1}}{3}\alpha_n = S'(x_n) - \frac{y_n - y_{n-1}}{h_{n-1}}$.
         - Giải hệ ma trận 3 đường chéo bằng Thuật toán Thomas thu được toàn bộ mảng $\alpha$.
       - _Bước 2.2: Lập đa thức trên từng đoạn $[x_k, x_{k+1}]$:_
         - Dạng khai triển Taylor cục bộ:
           $$S_k(x) = y_k + B_k(x - x_k) + C_k(x - x_k)^2 + D_k(x - x_k)^3$$
           trong đó:
           $$B_k = \frac{y_{k+1} - y_k}{h_k} - \frac{2\alpha_k + \alpha_{k+1}}{6}h_k, \quad C_k = \frac{\alpha_k}{2}, \quad D_k = \frac{\alpha_{k+1} - \alpha_k}{6h_k}$$
         - Dạng chính tắc $S_k(x) = a_k x^3 + b_k x^2 + c_k x + d_k$:
           $$a_k = \frac{\alpha_{k+1} - \alpha_k}{6h_k}$$
           $$b_k = \frac{3\alpha_k x_{k+1} - 3\alpha_{k+1} x_k}{6h_k}$$
           $$c_k = \frac{-3\alpha_k x_{k+1}^2 + 3\alpha_{k+1} x_k^2}{6h_k} + \frac{y_{k+1} - y_k}{h_k} - \frac{(\alpha_{k+1} - \alpha_k)h_k}{6}$$
           $$d_k = \frac{\alpha_k x_{k+1}^3 - \alpha_{k+1} x_k^3}{6h_k} + \frac{y_k x_{k+1} - y_{k+1} x_k}{h_k} + \frac{(\alpha_{k+1} x_k - \alpha_k x_{k+1})h_k}{6}$$

  3. **Tính giá trị và đạo hàm tại điểm $x^*$ (nếu được yêu cầu):**
     - Xác định đoạn $[x_k, x_{k+1}]$ chứa $x^*$ và độ lệch $\Delta x = x^* - x_k$.
     - Với $p = 1$: $S(x^*) = a_k x^* + b_k$, $S'(x^*) = a_k$.
     - Với $p = 2$: $S(x^*) = S_k(x^*)$, $S'(x^*) = m_k + 2a_k \Delta x$, $S''(x^*) = 2a_k$.
     - Với $p = 3$:
       $$S(x^*) = y_k + B_k \Delta x + C_k (\Delta x)^2 + D_k (\Delta x)^3 = a_k (x^*)^3 + b_k (x^*)^2 + c_k x^* + d_k$$
       $$S'(x^*) = B_k + 2C_k \Delta x + 3D_k (\Delta x)^2 = 3a_k (x^*)^2 + 2b_k x^* + c_k$$
       $$S''(x^*) = 2C_k + 6D_k \Delta x = 6a_k x^* + 2b_k$$

- **Output:** 
  - Mảng bước lưới và bảng các hệ số của hàm ghép trơn.
  - Các đa thức ghép trơn $S_k(x)$ (dưới cả hai dạng: Taylor cục bộ và dạng chính tắc).
  - Giá trị $S(x^*), S'(x^*), S''(x^*)$ tại điểm nội suy nếu có $x^*$.
