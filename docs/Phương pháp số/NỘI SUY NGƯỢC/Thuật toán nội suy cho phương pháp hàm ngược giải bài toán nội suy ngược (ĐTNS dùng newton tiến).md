
- **Input:**
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Khoảng cách ly nghiệm chứa $\bar{y}$: Bảng dữ liệu mốc đã chọn gồm $n+1$ điểm $\{(x_i, y_i)\}_{i=0}^n$ sao cho các $y_i$ đôi một khác nhau và tăng/giảm đơn điệu.
- **Steps:**
    1. **Đổi vai trò mốc nội suy và giá trị hàm:**
        - Coi $y_i$ là các mốc nội suy đầu vào $Y = [y_0, y_1, \dots, y_n]$.
        - Coi $x_i$ là các giá trị hàm tương ứng $X = [x_0, x_1, \dots, x_n]$.
    2. **Tính vector tỉ sai phân tiến $C$ (cho hàm ngược $x = P(y)$):**
        - Khởi tạo $c_i = x_i$ với $i = 0, 1, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$ (chỉ số cấp tỉ sai phân):
            - Lặp $i = n, n - 1, \dots, j$:
                $$c_i = \frac{c_i - c_{i-1}}{y_i - y_{i-j}} \quad \text{[cite: 13, 14]}$$
        - Thu được vector hệ số tỉ sai phân $C = [c_0, c_1, \dots, c_n]$.
    3. **Xây dựng ma trận đa thức cơ sở $A$ (Kích thước $(n+1) \times (n+1)$):**
        - Khởi tạo hàng 0: $A_0 = [0, 0, \dots, 0, 1]$.
        - Lặp $k = 1, 2, \dots, n$ (ứng với mốc $y_{k-1}$):
            - Với $i = n, n - 1, \dots, 0$:
                $$A_{k, i} = A_{k-1, i+1} - y_{k-1} \cdot A_{k-1, i} \quad (\text{quy ước } A_{k-1, n+1} = 0) \quad $$
                
    4. **Tính mảng hệ số chính tắc $P = C \cdot A$:**
        - Lặp $j = 0, 1, \dots, n$ (tương ứng bậc $y^{n-j}$):
            $$P_j = \sum_{k=0}^n C_k \cdot A_{k, j} \quad $$
            
    5. **Tính nghiệm gần đúng $\bar{x} = P(\bar{y})$ (Áp dụng Sơ đồ Horner):*
        - Đặt $p = P_0$.
        - Lặp $j = 1, 2, \dots, n$:
            $$p = p \cdot \bar{y} + P_j \quad $$
            
        - Gán $\bar{x} = p$.
            
- **Output:**
    - Mảng hệ số đa thức hàm ngược $P = [P_0, P_1, \dots, P_n]$.
    - Giá trị nghiệm gần đúng $\bar{x} \approx P(\bar{y})$.