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
  5. **Đa thức Bessel theo dạng tích cơ sở:**
     - $P_{\text{chẵn}}(u) = C_{\text{chẵn}}[0] + \sum_{i=1}^{m-1} C_{\text{chẵn}}[i] \prod_{r=0}^{i-1} \left(u^2 - \frac{(2r+1)^2}{4}\right)$
     - $P_{\text{lẻ}}(u) = C_{\text{lẻ}}[0]u + \sum_{i=1}^{m-1} C_{\text{lẻ}}[i] u \prod_{r=0}^{i-1} \left(u^2 - \frac{(2r+1)^2}{4}\right)$
     - $P(u) = P_{\text{chẵn}}(u) + P_{\text{lẻ}}(u)$
  6. **Khai triển các tích cơ sở theo lũy thừa của $u$ (Bảng nhân ma trận cơ sở):**
     - Đặt các cơ sở:
       - $B_{2i}(u) = \prod_{r=0}^{i-1} \left(u^2 - \frac{(2r+1)^2}{4}\right)$ (với $B_0(u) = 1$)
       - $B_{2i+1}(u) = u \cdot B_{2i}(u)$ (với $B_1(u) = u$)
     - Khai triển $B_j(u)$ thành đa thức theo các lũy thừa của $u$:
       $$B_j(u) = \sum_{p=0}^{n} M_{j, p} u^p \quad (j = 0, \dots, 2m-1, \; n = 2m-1)$$
     - Lập bảng ma trận kích thước $2m \times 2m$ chứa các hệ số $M_{j, p}$ ứng với các cột lũy thừa $u^n, u^{n-1}, \dots, u, 1$.
  7. **Dạng chính tắc của đa thức Bessel $P_n(u)$:**
     - Ghép vector hệ số $c_j$: $c_{2i} = C_{\text{chẵn}}[i]$, $c_{2i+1} = C_{\text{lẻ}}[i]$ với $i = 0, \dots, m-1$.
     - Nhân từng hàng của bảng nhân với hệ số $c_j$ tương ứng rồi cộng theo từng cột $p$:
       $$A_p = \sum_{j=0}^{2m-1} c_j M_{j, p} \quad (p = 0, \dots, n)$$
     - Thu được dạng chính tắc:
       $$P_n(u) = \sum_{p=0}^n A_p u^p = A_n u^n + A_{n-1} u^{n-1} + \dots + A_1 u + A_0$$
  8. **Đổi biến số tại điểm tính toán $\bar{x}$:**
     $$\bar{t} = \frac{\bar{x} - x_0}{h} \implies \bar{u} = \bar{t} - \frac{1}{2}$$
     (Trình bày dưới dạng phân số tối giản và giá trị số thập phân).
  9. **Tính giá trị xấp xỉ và đạo hàm (Sơ đồ Horner & Biến gốc $x$):**
     - Áp dụng sơ đồ Horner hai lần trên đa thức chính tắc $P_n(u)$ tại $u = \bar{u}$ để thu được $P_n(\bar{u})$ và $\left.\frac{dP_n}{du}\right|_{u=\bar{u}}$:
       $$f(\bar{x}) \approx P_n(\bar{u})$$
     - Tính đạo hàm theo biến gốc $x$:
       $$f'(\bar{x}) \approx P'_n(\bar{x}) = \left.\frac{1}{h} \frac{dP_n}{du}\right|_{u=\bar{u}}$$
- **Output:**
  - Mốc trung tâm $x_0, x_1$ và mảng trích xuất $X_{sub}, Y_{sub}$.
  - Bảng sai phân trung tâm và hệ số tách chẵn - lẻ $C_{\text{chẵn}}, C_{\text{lẻ}}$.
  - Đa thức dạng tích cơ sở $P_{\text{chẵn}}(u), P_{\text{lẻ}}(u)$.
  - Bảng nhân ma trận cơ sở theo lũy thừa của $u$.
  - Đa thức dạng chính tắc $P_n(u)$.
  - Các bước đổi biến chi tiết ($\bar{t}, \bar{u}$).
  - Giá trị $f(\bar{x}) \approx P_n(\bar{u})$, $\left.\frac{dP_n}{du}\right|_{u=\bar{u}}$ và đạo hàm $f'(\bar{x})$.
