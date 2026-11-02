
- **Input:**
    - Dãy mốc tùy ý (không nhất thiết đơn điệu): $X = [x_0, x_1, \dots, x_N]$, $Y = [y_0, y_1, \dots, y_N]$.
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - *(Tùy chọn)* Số mốc cần dùng $k$ ($k \ge 2$): trích xuất $k$ mốc quanh $\bar{y}$ thay vì lấy toàn bộ khoảng.
    - *(Tùy chọn)* Chỉ số khoảng đơn điệu $K_j$: khi $Y$ không đơn điệu và có nhiều khoảng chứa $\bar{y}$.

- **Steps:**
    1. **Kiểm tra tính đơn điệu và xác định khoảng làm việc:**
        - Nếu $Y$ đã đơn điệu: sử dụng toàn bộ $X, Y$ làm khoảng làm việc.
        - Nếu $Y$ chưa đơn điệu:
            - Phân tích $Y$ thành các khoảng đơn điệu $\{K_j\}$.
            - Chọn khoảng $K_j$ chứa $\bar{y}$ (nếu nhiều khoảng chứa $\bar{y}$, dùng tham số chỉ số $K_j$ để chọn).
            - Sử dụng $X_{K_j}, Y_{K_j}$ là dãy con tương ứng với khoảng $K_j$.

    2. *(Tùy chọn)* **Trích xuất $k$ mốc tối ưu quanh $\bar{y}$:**
        - Nếu tham số $k$ được cung cấp và $k <$ số mốc của khoảng làm việc:
            - Tìm vị trí $pos$ sao cho $Y_{K_j}[pos] \le \bar{y} \le Y_{K_j}[pos+1]$.
            - Tính $idx = \max\!\left(0,\ pos - \left\lfloor\tfrac{k-1}{2}\right\rfloor\right)$, kẹp phải để đủ $k$ mốc.
            - Lấy dãy con $x_i = X_{K_j}[idx \dots idx+k-1]$, $y_i = Y_{K_j}[idx \dots idx+k-1]$.
        - Ngược lại: dùng toàn bộ $X_{K_j}, Y_{K_j}$.

    3. **Đổi vai trò mốc nội suy và giá trị hàm** (trên dãy làm việc $n+1$ điểm):
        - Coi $y_i$ là các mốc nội suy đầu vào $Y' = [y_0, y_1, \dots, y_n]$.
        - Coi $x_i$ là các giá trị hàm tương ứng $X' = [x_0, x_1, \dots, x_n]$.

    4. **Tính vector tỉ sai phân tiến $C$ (cho hàm ngược $x = P(y)$):**
        - Khởi tạo $c_i = x_i$ với $i = 0, 1, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$:
            - Lặp $i = n, n - 1, \dots, j$:
                $$c_i = \frac{c_i - c_{i-1}}{y_i - y_{i-j}}$$
        - Thu được vector hệ số tỉ sai phân $C = [c_0, c_1, \dots, c_n]$.

    5. **Xây dựng ma trận đa thức cơ sở $A$ (Kích thước $(n+1) \times (n+1)$):**
        - Khởi tạo hàng 0: $A_0 = [0, 0, \dots, 0, 1]$.
        - Lặp $k = 1, 2, \dots, n$ (ứng với mốc $y_{k-1}$):
            - Với $i = n, n - 1, \dots, 0$:
                $$A_{k, i} = A_{k-1, i+1} - y_{k-1} \cdot A_{k-1, i} \quad (\text{quy ước } A_{k-1, n+1} = 0)$$

    6. **Tính mảng hệ số chính tắc $P = C \cdot A$:**
        - Lặp $j = 0, 1, \dots, n$ (tương ứng bậc $y^{n-j}$):
            $$P_j = \sum_{k=0}^n C_k \cdot A_{k, j}$$

    7. **Tính nghiệm gần đúng $\bar{x} = P(\bar{y})$ (Áp dụng Sơ đồ Horner):**
        - Đặt $p = P_0$.
        - Lặp $j = 1, 2, \dots, n$:
            $$p = p \cdot \bar{y} + P_j$$
        - Gán $\bar{x} = p$.

- **Output:**
    - Danh sách các khoảng đơn điệu tìm được (nếu $Y$ không đơn điệu).
    - Dãy con làm việc (nếu đã trích xuất $k$ mốc).
    - Mảng hệ số đa thức hàm ngược $P = [P_0, P_1, \dots, P_n]$.
    - Giá trị nghiệm gần đúng $\bar{x} \approx P(\bar{y})$.
