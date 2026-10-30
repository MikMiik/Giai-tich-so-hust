- **Input:**  
    - Bậc / Số lượng hàm cơ sở $m \in \mathbb{N}^*$;
    - Hệ $m$ hàm cơ sở: $\{\varphi_j(x)\}_{j=1, m}$;
    - Mảng dữ liệu thực nghiệm $n$ điểm: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]^T$ ($n \ge m$).
- **Steps:**
    1. **Tạo ma trận thiết kế $\Phi$ (kích thước $n \times m$):**
        - Lặp $i = 1, 2, \dots, n$:
            - Lặp $j = 1, 2, \dots, m$:
                $$\Phi_{i, j} = \varphi_j(x_i)$$
    2. **Tính ma trận hệ số $M$ và vector $b$:**
        - Ma trận Gram $M_{m \times m}$:
            $$M = \Phi^T \Phi$$
        - Vector vế phải $b_{m \times 1}$:
            $$b = \Phi^T Y$$
    3. **Giải hệ phương trình chuẩn $M \mathbf{a} = b$:**  
        - Tìm vector hệ số tối ưu $\mathbf{a} = [a_1, a_2, \dots, a_m]^T$:
            $$\mathbf{a} = M^{-1} b$$
    4. **Xác định các chỉ số đặc trưng đánh giá độ chính xác:**  
        - Vector giá trị xấp xỉ $\hat{Y} = \Phi \mathbf{a}$.
        - Vector độ lệch (Residuals):
            $$E = \hat{Y} - Y = [e_1, e_2, \dots, e_n]^T \quad \text{với } e_i = \left(\sum_{j=1}^m a_j \varphi_j(x_i)\right) - y_i$$
        - **Tổng bình phương sai số (SSD / Sum of Squared Differences):**
            $$S = E^T E = \sum_{i=1}^n e_i^2$$
        - **Sai số trung bình phương (RMSE / Root Mean Square Error):**
            $$\sigma = \sqrt{\frac{S}{n}} = \sqrt{\frac{1}{n} \sum_{i=1}^n e_i^2}$$
- **Đầu ra / Output:**
    - Vector hệ số $\mathbf{a} = [a_1, a_2, \dots, a_m]^T$ biểu diễn hàm thực nghiệm:
        $$g(x) = \sum_{j=1}^m a_j \varphi_j(x)$$
    - Các chỉ số đánh giá sai số: Tổng bình phương sai số $S$ và Sai số trung bình phương $\sigma$.

---
### a) Thuật toán cho dạng hàm $y = a e^{b_1 \varphi_1(x) + b_2 \varphi_2(x)}$

#### **Input:**

- Tập dữ liệu $n$ mốc thực nghiệm: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]^T$ ($y_i > 0, \forall i$);
- Hệ 2 hàm cơ sở không đồng nhất: $\varphi_1(x), \varphi_2(x)$.

#### **Steps:**

1. **Tuyến tính hóa dữ liệu:**  
    - Lấy logarit tự nhiên vector đầu ra $Y$:
        $$Y^* = [\ln y_1, \ln y_2, \dots, \ln y_n]^T$$
        
    - Đặt ẩn tuyến tính: $a_0 = \ln a \implies a = e^{a_0}$.
    - Hệ hàm cơ sở tuyến tính $m = 3$: $\varphi_0(x) = 1$, $\varphi_1(x)$, $\varphi_2(x)$.
2. **Tạo ma trận thiết kế $\Phi$ (kích thước $n \times 3$):**
    - Lặp $i = 1, 2, \dots, n$:
        $$\Phi_{i, 1} = 1, \quad \Phi_{i, 2} = \varphi_1(x_i), \quad \Phi_{i, 3} = \varphi_2(x_i)$$
        
3. **Tính ma trận hệ số $M$ và vector $b$:**
    - Ma trận Gram $M_{3 \times 3} = \Phi^T \Phi$;
    - Vector vế phải $b_{3 \times 1} = \Phi^T Y^*$.
4. **Giải hệ phương trình chuẩn $M \mathbf{a} = b$:**
    - Vector hệ số: $\mathbf{a} = [a_0, b_1, b_2]^T = M^{-1} b$.
    - Suy ra hệ số gốc: $a = e^{a_0}$.
#### **Output:**

- Các hệ số $a, b_1, b_2$ của hàm thực nghiệm $y = a e^{b_1 \varphi_1(x) + b_2 \varphi_2(x)}$.
### b) Thuật toán cho dạng hàm $y = a x^b$

#### **Input:**

- Tập dữ liệu $n$ mốc thực nghiệm: $X = [x_1, x_2, \dots, x_n]$, $Y = [y_1, y_2, \dots, y_n]^T$ ($x_i > 0, y_i > 0, \forall i$).
#### **Steps:**

1. **Tuyến tính hóa dữ liệu:**
    - Lấy logarit tự nhiên 2 vector $X$ và $Y$:
        $$X^* = [\ln x_1, \ln x_2, \dots, \ln x_n]^T$$
        $$Y^* = [\ln y_1, \ln y_2, \dots, \ln y_n]^T$$
        
    - Đặt ẩn tuyến tính: $a_0 = \ln a \implies a = e^{a_0}$.
    - Mô hình tuyến tính tương đương: $\ln y = a_0 + b \ln x$.
2. **Tạo ma trận thiết kế $\Phi$ (kích thước $n \times 2$):**
    - Lặp $i = 1, 2, \dots, n$:
$$\Phi_{i, 1} = 1, \quad \Phi_{i, 2} = X^*_i = \ln x_i$$
        
3. **Tính ma trận hệ số $M$ và vector $b$:**
    - Ma trận Gram $M_{2 \times 2} = \Phi^T \Phi$;
    - Vector vế phải $b_{2 \times 1} = \Phi^T Y^*$.
4. **Giải hệ phương trình chuẩn $M \mathbf{a} = b$:**  
    - Vector hệ số: $\mathbf{a} = [a_0, b]^T = M^{-1} b$.
    - Suy ra hệ số gốc: $a = e^{a_0}$.
#### **Output:**
- Các hệ số $a, b$ của hàm lũy thừa $y = a x^b$.