
- **Input:**
    - Dãy mốc cách đều: $X = [x_0, x_1, \dots, x_N]$, $Y = [y_0, y_1, \dots, y_N]$ với bước lưới $h = x_1 - x_0$.
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Độ chính xác yêu cầu: $\varepsilon > 0$.
    - *(Tùy chọn)* Chỉ số $k$ của khoảng cách ly $[x_k, x_{k+1}]$ chứa $\bar{y}$ (để trống để tự động giải và tìm nghiệm trên **tất cả** các khoảng cách ly).
    - *(Tùy chọn)* Số mốc cần trích xuất $n_{\text{mốc}} \ge 2$: lấy $n_{\text{mốc}}$ mốc cách đều tiến xuất phát từ mốc $x_k$ của khoảng cách ly thay vì dùng toàn bộ bảng (giúp tránh tràn số bảng sai phân bậc cao).

- **Steps:**
    1. **Xác định các khoảng cách ly nghiệm:**
        - Quét toàn bộ bảng tìm các chỉ số $k$ sao cho $(y_k - \bar{y})(y_{k+1} - \bar{y}) \le 0$ và $y_{k+1} \ne y_k$.
        - Nếu người dùng cung cấp chỉ số $k$: chỉ giải khoảng $[x_k, x_{k+1}]$.
        - Nếu để trống: giải tuần tự **tất cả** các khoảng cách ly tìm được.

    2. **Với mỗi khoảng cách ly $[x_k, x_{k+1}]$:**
        - *(Tùy chọn)* **Trích xuất $n_{\text{mốc}}$ mốc tiến xuất phát từ mốc $x_k$:**
            - Nếu $n_{\text{mốc}}$ được cung cấp và $n_{\text{mốc}} < N+1$:
                - Đặt chỉ số bắt đầu lấy mốc từ mốc trái của khoảng cách ly: $idx_{\text{start}} = k$.
                - Kiểm tra nếu tràn cuối bảng ($idx_{\text{start}} + n_{\text{mốc}} > N + 1$): gán lại $idx_{\text{start}} = \max(0, N - n_{\text{mốc}} + 1)$.
                - Lấy dãy con $x_i = X[idx_{\text{start}} \dots idx_{\text{start}} + n_{\text{mốc}} - 1]$,  
                  $y_i = Y[idx_{\text{start}} \dots idx_{\text{start}} + n_{\text{mốc}} - 1]$.
                - Cập nhật $k_{\text{local}} = k - idx_{\text{start}}$ (chỉ số trong mảng con, thường bằng $0$ khi không bị tràn biên cuối).
            - Ngược lại: dùng toàn bộ $X, Y$ và $k_{\text{local}} = k$.

        - **Lập bảng sai phân tiến $\Delta$ trên dãy làm việc:**
            - Gán $\Delta_{i, 0} = y_i$ với mọi $i = 0, 1, \dots, n$.
            - Lặp $j = 1, 2, \dots, n$:
                - Lặp $i = 0, 1, \dots, n - j$:
                    $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$

        - **Trích xuất mảng sai phân xuất phát từ $x_{k_{\text{local}}}$:**
            - Trích xuất $\Delta^j y_{k_{\text{local}}} = \Delta_{k_{\text{local}}, j}$ với $j = 1, 2, \dots, n - k_{\text{local}}$.

        - **Khởi tạo quá trình lặp:**
            - Giá trị lặp ban đầu:
                $$t_0 = \frac{\bar{y} - y_{k_{\text{local}}}}{\Delta y_{k_{\text{local}}}}$$
            - Đặt $j = 0$.

        - **Thực hiện vòng lặp tìm biến chuẩn hóa $t$:**
            - Lặp:
                - Tính giá trị đa thức phụ $S(t_j)$:
                    $$S(t_j) = \sum_{m=2}^{n - k_{\text{local}}} \frac{\Delta^m y_{k_{\text{local}}}}{m!} \prod_{r=0}^{m-1} (t_j - r)$$
                - Cập nhật xấp xỉ mới:
                    $$t_{j+1} = \frac{\bar{y} - y_{k_{\text{local}}} - S(t_j)}{\Delta y_{k_{\text{local}}}}$$
                - Nếu $|t_{j+1} - t_j| < \dfrac{\varepsilon}{h}$: Dừng vòng lặp (điều kiện này tương đương với $|\Delta x| < \varepsilon$).
                - Ngược lại: Gán $j = j + 1$.

        - **Tính nghiệm gần đúng:**
            $$\bar{x} = x_{k_{\text{local}}} + t_{j+1} \cdot h$$

- **Output:** 
    - Chi tiết từng bước trích xuất mốc, lập bảng sai phân và quá trình lặp cho từng khoảng cách ly.
    - Giá trị nghiệm gần đúng cho từng khoảng: $\bar{x}_1, \bar{x}_2, \dots$
    - Bảng tổng kết tất cả các nghiệm tìm được (khi có nhiều khoảng cách ly).
