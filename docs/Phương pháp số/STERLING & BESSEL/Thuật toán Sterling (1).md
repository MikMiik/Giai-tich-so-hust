- **Input:**
  - Mảng dữ liệu cách đều: $X_{full} = [x_0, \dots, x_N]$, $Y_{full} = [y_0, \dots, y_N]$ với bước $h = x_1 - x_0$.
  - Điểm cần tính: $x^*$.
  - Số lượng mốc cần lấy: $N_{mốc} = 2m + 1$ (số lẻ, $m \in \mathbb{N}^*$, bậc $n = 2m$).
- **Steps:**
  1. **Xác định mốc trung tâm và trích xuất mảng con:**
     - Tìm chỉ số $k$ sao cho $\vert{}x^* - X_{full}[k]\vert{}$ nhỏ nhất. Đặt mốc trung tâm $x_0 = X_{full}[k]$.
     - Xử lý biên: Gán $k = \max(m, \min(N - m, k))$.
     - Trích xuất $2m + 1$ mốc đối xứng quanh $x_0$:
       $$X_{sub} = X_{full}[k-m \dots k+m], \quad Y_{sub} = Y_{full}[k-m \dots k+m]$$
     - Chuẩn hóa chỉ số mảng con chạy từ $-m$ đến $m$: $X = [x_{-m}, \dots, x_m]$, $Y = [y_{-m}, \dots, y_m]$
  2. **Đổi biến số chuẩn hóa:**
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
  5. **Đa thức Stirling theo dạng tích cơ sở:**
     - $P_{\text{chẵn}}(t) = C_{\text{chẵn}}[0] + \sum_{i=1}^m C_{\text{chẵn}}[i] t^2 \prod_{r=1}^{i-1} (t^2 - r^2)$
     - $P_{\text{lẻ}}(t) = \sum_{i=1}^m C_{\text{lẻ}}[i] t \prod_{r=1}^{i-1} (t^2 - r^2)$
     - $P(t) = P_{\text{chẵn}}(t) + P_{\text{lẻ}}(t)$
  6. **Khai triển các tích cơ sở theo lũy thừa của $t$ (Bảng nhân ma trận cơ sở):**
     - Đặt các cơ sở:
       - $B_0(t) = 1$
       - Với $i = 1, \dots, m$:
         - $B_{2i-1}(t) = t \prod_{r=1}^{i-1} (t^2 - r^2)$
         - $B_{2i}(t) = t^2 \prod_{r=1}^{i-1} (t^2 - r^2)$
     - Khai triển $B_j(t)$ thành đa thức theo các lũy thừa của $t$:
       $$B_j(t) = \sum_{p=0}^n M_{j, p} t^p \quad (j = 0, \dots, 2m, \; n = 2m)$$
     - Lập bảng ma trận kích thước $(2m+1) \times (2m+1)$ chứa các hệ số $M_{j, p}$ ứng với các cột lũy thừa $t^n, t^{n-1}, \dots, t, 1$.
  7. **Dạng chính tắc của đa thức Stirling $P_n(t)$:**
     - Ghép vector hệ số $c_j$: $c_0 = C_{\text{chẵn}}[0]$, và với $i = 1, \dots, m$: $c_{2i-1} = C_{\text{lẻ}}[i]$, $c_{2i} = C_{\text{chẵn}}[i]$.
     - Nhân từng hàng của bảng nhân với hệ số $c_j$ tương ứng rồi cộng theo từng cột $p$:
       $$A_p = \sum_{j=0}^{2m} c_j M_{j, p} \quad (p = 0, \dots, n)$$
     - Thu được dạng chính tắc:
       $$P_n(t) = \sum_{p=0}^n A_p t^p = A_n t^n + A_{n-1} t^{n-1} + \dots + A_1 t + A_0$$
  8. **Đổi biến số tại điểm tính toán $\bar{x}$:**
     $$\bar{t} = \frac{\bar{x} - x_0}{h}$$
     (Trình bày dưới dạng phân số tối giản và giá trị số thập phân).
  9. **Tính giá trị xấp xỉ và đạo hàm (Sơ đồ Horner & Biến gốc $x$):**
     - Áp dụng sơ đồ Horner hai lần trên đa thức chính tắc $P_n(t)$ tại $t = \bar{t}$ để thu được $P_n(\bar{t})$ và $\left.\frac{dP_n}{dt}\right|_{t=\bar{t}}$:
       $$f(\bar{x}) \approx P_n(\bar{t})$$
     - Tính đạo hàm theo biến gốc $x$:
       $$f'(\bar{x}) \approx P'_n(\bar{x}) = \left.\frac{1}{h} \frac{dP_n}{dt}\right|_{t=\bar{t}}$$
- **Output:**
  - Mốc trung tâm $x_0$ và mảng trích xuất $X_{sub}, Y_{sub}$.
  - Bảng sai phân trung tâm và hệ số tách chẵn - lẻ $C_{\text{chẵn}}, C_{\text{lẻ}}$.
  - Đa thức dạng tích cơ sở $P_{\text{chẵn}}(t), P_{\text{lẻ}}(t)$.
  - Bảng nhân ma trận cơ sở theo lũy thừa của $t$.
  - Đa thức dạng chính tắc $P_n(t)$.
  - Bước đổi biến chi tiết ($\bar{t}$).
  - Giá trị $f(\bar{x}) \approx P_n(\bar{t})$, $\left.\frac{dP_n}{dt}\right|_{t=\bar{t}}$ và đạo hàm $f'(\bar{x})$.
