
- **Input:**
    - Dãy mốc cách đều: $X = [x_0, x_1, \dots, x_N]$, $Y = [y_0, y_1, \dots, y_N]$ với bước lưới $h = x_1 - x_0$.
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Độ chính xác yêu cầu: $\varepsilon > 0$.
    - *(Tùy chọn)* Chỉ số $k$ của khoảng cách ly $[x_k, x_{k+1}]$ chứa $\bar{y}$ (để trống để tự động giải và tìm nghiệm trên **tất cả** các khoảng cách ly).
    - *(Tùy chọn)* Số mốc cần trích xuất $n_{\text{mốc}} \ge 2$: trích xuất $n_{\text{mốc}}$ mốc đối xứng quanh khoảng cách ly $[x_k, x_{k+1}]$.

- **Steps:**
    1. **Xác định các khoảng cách ly nghiệm:**
        - Quét toàn bộ bảng tìm các chỉ số $k$ sao cho $(y_k - \bar{y})(y_{k+1} - \bar{y}) \le 0$ và $y_{k+1} \ne y_k$.
        - Nếu người dùng cung cấp chỉ số $k$: chỉ giải khoảng $[x_k, x_{k+1}]$.
        - Nếu để trống: giải tuần tự **tất cả** các khoảng cách ly tìm được.

    2. **Với mỗi khoảng cách ly $[x_k, x_{k+1}]$:**
        - **Trích xuất $n_{\text{mốc}}$ mốc đối xứng quanh khoảng cách ly:**
            - Tính $idx_{\text{start}} = \max\!\left(0,\ k - \left\lfloor\tfrac{n_{\text{mốc}}-1}{2}\right\rfloor\right)$, kẹp phải để đủ $n_{\text{mốc}}$ mốc.
            - Lấy dãy con $X_{\text{sub}} = X[idx_{\text{start}} \dots idx_{\text{start}} + n_{\text{mốc}} - 1]$, $Y_{\text{sub}} = Y[idx_{\text{start}} \dots idx_{\text{start}} + n_{\text{mốc}} - 1]$.
            - Chỉ số khoảng cách ly trong dãy con: $k_{\text{sub}} = k - idx_{\text{start}}$.

        - **Chọn gốc và xây dựng thứ tự mốc quanh tâm:**
            - Chọn mốc gốc $x_0 = X_{\text{sub}}[k_{\text{sub}}]$, biến chuẩn hóa $t = \dfrac{x - x_0}{h} \in [0, 1]$.
            - Sắp xếp các mốc theo khoảng cách tới khoảng cách ly $[x_0, x_1]$ (dạng xen kẽ Gauss I quanh tâm):
                $$s_0 = 0, \quad s_1 = 1, \quad s_2 = -1, \quad s_3 = 2, \quad s_4 = -2, \quad s_5 = 3, \dots$$
                tương ứng với các điểm mốc:
                $$\xi_0 = x_0, \quad \xi_1 = x_1, \quad \xi_2 = x_{-1}, \quad \xi_3 = x_2, \quad \xi_4 = x_{-2}, \dots$$
                trong đó $x_r = X_{\text{sub}}[k_{\text{sub}} + r]$.

        - **Tính các hệ số đa thức nội suy quanh tâm $c_m$:**
            - Dựa trên bảng tỷ sai phân của hàm theo biến chuẩn hóa $t$ tại các điểm mốc $s_m$:
                $$c_m = f[s_0, s_1, \dots, s_m] \quad (m = 0, 1, \dots, n-1)$$
            - Đa thức nội suy có dạng Newton tổng quát quanh tâm:
                $$P(t) = c_0 + c_1 t + \sum_{m=2}^{n-1} c_m \prod_{r=0}^{m-1} (t - s_r)$$

        - **Khởi tạo quá trình lặp:**
            - Giá trị xấp xỉ ban đầu:
                $$t_0 = \frac{\bar{y} - c_0}{c_1}$$
            - Đặt $l = 0$.

        - **Thực hiện vòng lặp tìm biến chuẩn hóa $t$:**
            - Tính đa thức phụ phần phi tuyến từ bậc 2 trở lên:
                $$S(t_l) = \sum_{m=2}^{n-1} c_m \prod_{r=0}^{m-1} (t_l - s_r)$$
            - Cập nhật xấp xỉ tiếp theo:
                $$t_{l+1} = \frac{\bar{y} - c_0 - S(t_l)}{c_1}$$
            - Điều kiện dừng:
                $$\text{Nếu } |t_{l+1} - t_l| < \frac{\varepsilon}{h} \implies \text{Dừng vòng lặp.}$$
                Ngược lại: Gán $l = l + 1$.

        - **Tính nghiệm gần đúng:**
            $$\bar{x} = x_0 + t_{l+1} \cdot h$$

- **Output:** 
    - Chi tiết bảng mốc quanh tâm, hệ số $c_m$ và quá trình lặp hội tụ.
    - Giá trị nghiệm gần đúng $\bar{x} \approx f^{-1}(\bar{y})$.

