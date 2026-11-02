- **Input:**
  - Mảng dữ liệu cách đều: $X_{full} = [x_0, \dots, x_N]$, $Y_{full} = [y_0, \dots, y_N]$ với bước $h = x_1 - x_0$.
  - Điểm cần tính: $x^*$.
  - Số lượng mốc cần lấy: $N_{mốc} = 2m + 1$ (số lẻ, $m \in \mathbb{N}^*$).
- **Steps:**
  1. **Xác định mốc trung tâm và trích xuất mảng con:**
     - Tìm chỉ số $k$ sao cho $\vert{}x^* - X_{full}[k]\vert{}$ nhỏ nhất. Đặt mốc trung tâm $x_0 = X_{full}[k]$.
     - Xử lý biên: Gán $k = \max(m, \min(N - m, k))$.
     - Trích xuất $2m + 1$ mốc đối xứng quanh $x_0$:
       $$X_{sub} = X_{full}[k-m \dots k+m], \quad Y_{sub} = Y_{full}[k-m \dots k+m]$$
     - Chuẩn hóa chỉ số mảng con chạy từ $-m$ đến $m$: $X = [x_{-m}, \dots, x_m]$, $Y = [y_{-m}, \dots, y_m]$
  2. **Đổi biến số:**
     $$t = \frac{x^* - x_0}{h}$$
  3. **Lập bảng sai phân hữu hạn:**
     - Khởi tạo $\Delta$ kích thước $(2m+1) \times (2m+1)$, gán $\Delta_{i, 0} = y_i$ với $i = -m, \dots, m$.
     - Lặp $j = 1, \dots, 2m$:
       - Lặp $i = -m, \dots, m - j$:
         $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$
  4. **Trích xuất hệ số Stirling (Tách Chẵn - Lẻ):**
     - $C_{\text{chẵn}}[0] = y_0 = \Delta_{0, 0}$.
     - Lặp $i = 1, \dots, m$:
       $$C_{\text{lẻ}}[i] = \frac{\Delta_{-i+1, \, 2i-1} + \Delta_{-i, \, 2i-1}}{2 \cdot (2i-1)!}$$
       $$C_{\text{chẵn}}[i] = \frac{\Delta_{-i, \, 2i}}{(2i)!}$$
  5. **Tính tích lũy hai thành phần độc lập tại $t$:**
     - $P_{\text{chẵn}} = C_{\text{chẵn}}[0]$, $P_{\text{lẻ}} = 0$, $W = 1$.
     - Lặp $i = 1, \dots, m$:
       - Nếu $i > 1$: $W = W \cdot (t^2 - (i-1)^2)$
       - $P_{\text{lẻ}} = P_{\text{lẻ}} + C_{\text{lẻ}}[i] \cdot W \cdot t$
       - $P_{\text{chẵn}} = P_{\text{chẵn}} + C_{\text{chẵn}}[i] \cdot W \cdot t^2$
     - $f(x^*) \approx P_{\text{chẵn}} + P_{\text{lẻ}}$.
  6. **(Tùy chọn) Tính đạo hàm:**
     - Lấy đạo hàm $P_{\text{chẵn}}'(t)$ và $P_{\text{lẻ}}'(t)$ theo biến $t$.
     - $$f'(x^*) \approx \frac{1}{h} \left( P_{\text{chẵn}}'(t) + P_{\text{lẻ}}'(t) \right)$$
- **Output:**
  - Mốc trung tâm $x_0$ và mảng trích xuất $X_{sub}, Y_{sub}$.
  - Hệ số $C_{\text{chẵn}}, C_{\text{lẻ}}$.
  - Đa thức $P(t) = P_{\text{chẵn}}(t) + P_{\text{lẻ}}(t)$.
  - Giá trị $f(x^*)$ và $f'(x^*)$.
