
- **Input:**
    - Dãy mốc cách đều: $X = [x_0, x_1, \dots, x_N]$, $Y = [y_0, y_1, \dots, y_N]$ với bước lưới $h = x_1 - x_0$.
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Độ chính xác yêu cầu: $\varepsilon > 0$.
    - *(Tùy chọn)* Chỉ số $k$ của khoảng cách ly $[x_k, x_{k+1}]$ chứa $\bar{y}$ (để trống để tự động giải và tìm nghiệm trên **tất cả** các khoảng cách ly).
    - *(Tùy chọn)* Số mốc cần trích xuất $n_{\text{mốc}} \ge 2$: trích xuất $n_{\text{mốc}}$ mốc lùi tính từ $x_{k+1}$ về phía trước (tức $[x_{k+2-n_{\text{mốc}}} \dots x_{k+1}]$) để tận dụng tối đa bậc của đa thức nội suy lùi.

- **Steps:**
    1. **Xác định các khoảng cách ly nghiệm:**
        - Quét toàn bộ bảng tìm các chỉ số $k$ sao cho $(y_k - \bar{y})(y_{k+1} - \bar{y}) \le 0$ và $y_{k+1} \ne y_k$.
        - Nếu người dùng cung cấp chỉ số $k$: chỉ giải khoảng $[x_k, x_{k+1}]$.
        - Nếu để trống: giải tuần tự **tất cả** các khoảng cách ly tìm được.

    2. **Với mỗi khoảng cách ly $[x_k, x_{k+1}]$:**
        - **Chọn mốc gốc và hướng lặp:**
            - Chọn mốc xuất phát là mút phải của khoảng cách ly: $x_{\text{base}} = x_{k+1}$.
            - Biến chuẩn hóa: $t = \dfrac{x - x_{k+1}}{h}$. Khi $x \in [x_k, x_{k+1}]$, ta có $t \in [-1, 0]$.
        - *(Tùy chọn)* **Trích xuất $n_{\text{mốc}}$ mốc lùi từ $x_{k+1}$:**
            - Nếu $n_{\text{mốc}}$ được cung cấp:
                - Tính $idx_{\text{start}} = \max(0, k + 2 - n_{\text{mốc}})$, $idx_{\text{end}} = k + 1$.
                - Lấy dãy con làm việc $X_{\text{sub}} = X[idx_{\text{start}} \dots idx_{\text{end}}]$, $Y_{\text{sub}} = Y[idx_{\text{start}} \dots idx_{\text{end}}]$.
                - Số mốc thực tế là $n = X_{\text{sub}}.\text{length}$, và mốc $x_{k+1}$ nằm tại vị trí cuối cùng của dãy con (chỉ số $n - 1$).
            - Ngược lại: dùng toàn bộ dãy từ $0$ đến $k+1$.

        - **Lập bảng sai phân và trích xuất sai phân lùi tại $x_{k+1}$:**
            - Lập bảng sai phân tiến $\Delta$ trên dãy con:
                $$\Delta_{i, 0} = y_i, \quad \Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$
            - Sai phân lùi cấp $j$ tại mốc cuối $u = n-1$ tương ứng:
                $$\nabla^j y_u = \Delta_{u-j, j}$$
            - Đặt $\delta_j = \nabla^j y_u$ với $j = 1, \dots, n-1$.

        - **Khởi tạo quá trình lặp:**
            - Giá trị ban đầu (bỏ qua sai phân bậc cao):
                $$t_0 = \frac{\bar{y} - y_u}{\delta_1} = \frac{\bar{y} - y_{k+1}}{\nabla y_{k+1}}$$
            - Đặt $l = 0$.

        - **Vòng lặp tìm biến chuẩn hóa $t$:**
            - Đa thức Newton lùi dạng:
                $$P(t) = y_u + t \delta_1 + \sum_{m=2}^{n-1} \frac{\delta_m}{m!} \prod_{r=0}^{m-1} (t + r)$$
            - Rút $t$ từ số hạng bậc nhất:
                $$S(t_l) = \sum_{m=2}^{n-1} \frac{\delta_m}{m!} \prod_{r=0}^{m-1} (t_l + r)$$
                $$t_{l+1} = \frac{\bar{y} - y_u - S(t_l)}{\delta_1}$$
            - Kiểm tra điều kiện dừng:
                $$\text{Nếu } |t_{l+1} - t_l| < \frac{\varepsilon}{h} \implies \text{Dừng vòng lặp.}$$
                Ngược lại: Gán $l = l + 1$.

        - **Tính nghiệm gần đúng:**
            $$\bar{x} = x_{k+1} + t_{l+1} \cdot h$$

- **Output:** 
    - Chi tiết từng bước trích xuất mốc, lập bảng sai phân lùi và quá trình lặp cho từng khoảng cách ly.
    - Giá trị nghiệm gần đúng: $\bar{x} \approx f^{-1}(\bar{y})$.

