
- **Đầu vào:**  
    - Bậc của Spline: $p \in \{1, 2, 3, 4\}$.
    - Bảng $n$ mốc dữ liệu: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]$ ($x_1 < x_2 < \dots < x_n$).
    - Các điều kiện biên bổ sung tùy theo cấp $p$ (Cấp 1: 0 điều kiện; Cấp 2: 1 điều kiện; Cấp 3: 2 điều kiện; Cấp 4: 3 điều kiện).
    - (Tùy chọn) Điểm cần tính giá trị $x^*$.
- **Các bước thực hiện:**
    1. **Tính các khoảng cách bước lưới:**  
        - Lặp $k = 1, 2, \dots, n-1$:
            $$h_k = x_{k+1} - x_k$$
            
    2. **Thiết lập và giải hệ phương trình hệ số:**
        - **Trường hợp $p = 1$:** Tính trực tiếp hệ số từng đoạn:
            $$a_k = \frac{y_{k+1} - y_k}{h_k}, \quad b_k = y_k - a_k x_k \quad (k = 1, \dots, n-1)$$
            
        - **Trường hợp $p = 2$:** Dùng mảng đạo hàm $m_k = S'(x_k)$. Thiết lập hệ $n-1$ phương trình:
            $$m_k + m_{k+1} = \frac{2(y_{k+1} - y_k)}{h_k}$$
            
            Thêm 1 điều kiện biên (ví dụ $m_1 = S'(x_1)$) để giải tìm $m_1, \dots, m_n$, từ đó tính $(a_k, b_k, c_k)$.
        - **Trường hợp $p = 3$:** Dùng mảng đạo hàm cấp hai $\alpha_k = S''(x_k)$. Lập ma trận ba đường chéo kích thước $(n-2) \times (n-2)$ từ phương trình:
            $$\frac{h_k}{6}\alpha_k + \frac{h_k + h_{k+1}}{3}\alpha_{k+1} + \frac{h_{k+1}}{6}\alpha_{k+2} = \frac{y_{k+2} - y_{k+1}}{h_{k+1}} - \frac{y_{k+1} - y_k}{h_k}$$
            
            Kết hợp 2 điều kiện biên, giải hệ phương trình ba đường chéo (dùng thuật toán Thomas) tìm mảng $\alpha$, suy ra các hệ số $(a_k, b_k, c_k, d_k)$.
        - **Trường hợp $p = 4$:** Dùng mảng đạo hàm cấp ba $\mu_k = S'''(x_k)$. Lập hệ phương trình tuyến tính kích thước $5(n-1)$ chứa các điều kiện nội suy, độ trơn cấp 3 và 3 điều kiện biên. Giải hệ phương trình tuyến tính tìm mảng hệ số $(a_k, b_k, c_k, d_k, e_k)$.
            
    1. **(Tùy chọn) Tính giá trị tại điểm $x^*$:**
        - Tìm đoạn chứa $x^*$: xác định chỉ số $k$ sao cho $x_k \le x^* \le x_{k+1}$.
        - Tính $y^* = S_k(x^*)$ dựa vào công thức đa thức đoạn $k$ tương ứng với cấp $p$.  
            
- **Đầu ra:**  
    - Tập các đa thức $S_k(x)$ đại diện cho hàm Spline trên từng đoạn $[x_k, x_{k+1}]$ ($k = 1, \dots, n-1$).
    - Giá trị xấp xỉ $S(x^*)$ (nếu có yêu cầu).