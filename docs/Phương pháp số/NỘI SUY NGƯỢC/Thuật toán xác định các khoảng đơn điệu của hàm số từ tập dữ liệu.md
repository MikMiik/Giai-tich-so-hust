
- **Input:** Bảng dữ liệu $n+1$ mốc: $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ ($x_0 < x_1 < \dots < x_n$).
- **Steps:**
    1. Khởi tạo danh sách khoảng đơn điệu rỗng $KDD = []$, chỉ số bắt đầu đoạn $start = 0$.
    2. Xác định chiều biến thiên ban đầu: $sign = \text{sign}(y_1 - y_0)$.
    3. Lặp $i = 1, 2, \dots, n - 1$:
        - Tính độ lệch: $\Delta_i = y_{i+1} - y_i$.
        - Nếu $\Delta_i \neq 0$: 
            - Nếu $sign == 0$: Gán $sign = \text{sign}(\Delta_i)$.
            - Nếu $\text{sign}(\Delta_i) \neq sign$:  
                - Thêm $(x_{start}, x_i, sign)$ vào $KDD$.
                - Cập nhật $start = i$, $sign = \text{sign}(\Delta_i)$.
    4. Thêm khoảng cuối cùng $(x_{start}, x_n, sign)$ vào $KDD$.
- **Output:** Danh sách các khoảng đơn điệu $KDD$ (mỗi phần tử chứa điểm đầu, điểm cuối và chiều biến thiên $sign > 0$: tăng, $sign < 0$: giảm).