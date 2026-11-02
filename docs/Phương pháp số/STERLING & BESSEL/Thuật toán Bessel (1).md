- **Input:**
  - Mảng dữ liệu cách đều: $X_{full} = [x_0, \dots, x_N]$, $Y_{full} = [y_0, \dots, y_N]$ với bước $h = x_1 - x_0$.
  - Điểm cần tính: $x^*$.
  - Số lượng mốc cần lấy: $N_{mốc} = 2m$ (số chẵn, $m \in \mathbb{N}^*$, bậc $n = 2m - 1$).
- **Steps:**
  1. **Xác định khoảng trung tâm $[x_0, x_1]$ và trích xuất mảng con:**
     - Tìm chỉ số $k$ sao cho $X_{full}[k] \le x^* < X_{full}[k+1]$.
     - Xử lý biên: Gán $k = \max(m - 1, \min(N - m, k))$.
     - Đặt mốc $x_0 = X_{full}[k]$.
     - Trích xuất $2m$ mốc đối xứng quanh khoảng $[x_0, x_1]$:
       $$X_{sub} = X_{full}[k-m+1 \dots k+m], \quad Y_{sub} = Y_{full}[k-m+1 \dots k+m]$$
     - Chuẩn hóa chỉ số mảng con chạy từ $-m+1$ đến $m$: $X = [x_{-m+1}, \dots, x_m]$, $Y = [y_{-m+1}, \dots, y_m]$.
  2. **Đổi biến số chuẩn hóa:**
     $$t = \frac{x^* - x_0}{h} \implies u = t - \frac{1}{2}$$
  3. **Lập bảng sai phân hữu hạn:**
     - Khởi tạo $\Delta$ kích thước $2m \times 2m$, gán $\Delta_{i, 0} = y_i$ với $i = -m+1, \dots, m$.
     - Lặp $j = 1, \dots, 2m - 1$:
       - Lặp $i = -m+1, \dots, m - j$:
         $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$
  4. **Trích xuất hệ số Bessel (Tách Chẵn - Lẻ):**
     - $C_{\text{chẵn}}[0] = \frac{\Delta_{0, 0} + \Delta_{1, 0}}{2}$.
     - Lặp $i = 1, \dots, m-1$:
       $$C_{\text{chẵn}}[i] = \frac{\Delta_{-i, \, 2i} + \Delta_{-i+1, \, 2i}}{2 \cdot (2i)!}$$
     - Lặp $i = 0, \dots, m-1$:
       $$C_{\text{lẻ}}[i] = \frac{\Delta_{-i, \, 2i+1}}{(2i+1)!}$$
  5. **Tính tích lũy hai thành phần độc lập tại $u$:**
     - $P_{\text{chẵn}} = C_{\text{chẵn}}[0]$, $P_{\text{lẻ}} = C_{\text{lẻ}}[0] \cdot u$.
     - $W_{\text{chẵn}} = 1$, $W_{\text{lẻ}} = u$.
     - Lặp $i = 1, \dots, m-1$:
       - $W_{\text{chẵn}} = W_{\text{chẵn}} \cdot \left(u^2 - \frac{(2i-1)^2}{4}\right)$
       - $P_{\text{chẵn}} = P_{\text{chẵn}} + C_{\text{chẵn}}[i] \cdot W_{\text{chẵn}}$
       - $W_{\text{lẻ}} = W_{\text{lẻ}} \cdot \left(u^2 - \frac{(2i-1)^2}{4}\right)$
       - $P_{\text{lẻ}} = P_{\text{lẻ}} + C_{\text{lẻ}}[i] \cdot W_{\text{lẻ}}$
     - $f(x^*) \approx P_{\text{chẵn}} + P_{\text{lẻ}}$.
  6. **(Tùy chọn) Tính đạo hàm:**
     - Lấy đạo hàm $P_{\text{chẵn}}'(u)$ và $P_{\text{lẻ}}'(u)$ theo biến $u$.
     - $$f'(x^*) \approx \frac{1}{h} \left( P_{\text{chẵn}}'(u) + P_{\text{lẻ}}'(u) \right)$$
- **Output:**
  - Mốc trung tâm $x_0$ và mảng trích xuất $X_{sub}, Y_{sub}$.
  - Hệ số $C_{\text{chẵn}}, C_{\text{lẻ}}$.
  - Đa thức $P(u) = P_{\text{chẵn}}(u) + P_{\text{lẻ}}(u)$.
  - Giá trị $f(x^*)$ và $f'(x^*)$.
