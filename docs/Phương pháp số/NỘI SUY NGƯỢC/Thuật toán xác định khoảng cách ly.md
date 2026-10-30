
### a) Thuật toán xác định tất cả các khoảng cách ly của phương trình $f(x) = \bar{y}$

- **Input:**  
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Bảng dữ liệu $n+1$ mốc: $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ ($x_0 < x_1 < \dots < x_n$).
- **Steps:**
    1. Khởi tạo danh sách khoảng cách ly rỗng: $KCL = []$.
    2. Lặp $i = 0, 1, \dots, n - 1$:  
        - Tính tích chênh lệch: $d = (y_i - \bar{y}) \cdot (y_{i+1} - \bar{y})$.
        - Nếu $d \le 0$: Thêm khoảng $(x_i, x_{i+1})$ vào $KCL$.
- **Output:** Danh sách các khoảng cách ly nghiệm $KCL$.

