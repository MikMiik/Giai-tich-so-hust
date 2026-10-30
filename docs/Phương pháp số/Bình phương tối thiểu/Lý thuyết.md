### 1. Đặt bài toán xấp xỉ

Cho tập $n$ điểm dữ liệu thực nghiệm $(x_i, y_i)_{i=1,n}$ và không gian vectơ $V$ các hàm số có hệ hàm cơ sở $\{\varphi_j\}_{j=1,m}$.  

Mục tiêu là tìm hàm $g(x) = \sum_{j=1}^{m} a_j \varphi_j(x) \in V$ sao cho độ sai lệch giữa dữ liệu thực tế $f$ và hàm xấp xỉ $g$ là nhỏ nhất. Sai số trung bình phương giữa hai hàm trên lưới điểm $\{x_i\}_{i=\overline{1,n}}$ được tính theo công thức:

$$\sigma_n = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(f(x_i) - g(x_i)\right)^2}$$

Để $\sigma_n$ đạt giá trị nhỏ nhất, ta tối ưu hóa tổng bình phương các độ lệch:
$$S(a_1, a_2, \dots, a_m) = \sum_{i=1}^{n}\left(a_1 \varphi_1(x_i) + \dots + a_m \varphi_m(x_i) - y_i\right)^2 \to \min_{a_j} S$$
### 2. Điều kiện cực trị (Điểm dừng)

Hàm $S(a_1, \dots, a_m)$ luôn đạt cực tiểu tại điểm dừng, xác định bằng cách giải hệ phương trình đạo hàm riêng:

$$\frac{\partial S}{\partial a_i} = 0, \quad \forall i = \overline{1, m}$$
### 3. Các trường hợp cụ thể

#### a) Hàm bậc nhất (Đường thẳng $g(x) = ax + b$)

Khi $V$ là không gian các đa thức bậc không quá 1:
$$S(a, b) = \sum_{i=1}^{n}(ax_i + b - y_i)^2 \to \min_{a, b} S$$
Lấy đạo hàm riêng và cho bằng 0:
$$\begin{cases} \frac{\partial S}{\partial a} = 2\sum_{i=1}^{n}(ax_i + b - y_i)x_i = 0 \\ \frac{\partial S}{\partial b} = 2\sum_{i=1}^{n}(ax_i + b - y_i) = 0 \end{cases} \iff \begin{cases} a\sum_{i=1}^{n}x_i^2 + b\sum_{i=1}^{n}x_i = \sum_{i=1}^{n}x_i y_i \\ a\sum_{i=1}^{n}x_i + bn = \sum_{i=1}^{n}y_i \end{cases}$$
#### b) Hàm bậc hai (Parabol $g(x) = ax^2 + bx + c$)

Khi $V$ là không gian đa thức bậc không quá 2:
$$S(a, b, c) = \sum_{i=1}^{n}(ax_i^2 + bx_i + c - y_i)^2 \to \min_{a, b, c} S$$
Hệ phương trình điểm dừng thu được:
$$\begin{cases} a\sum x_i^4 + b\sum x_i^3 + c\sum x_i^2 = \sum x_i^2 y_i \\ a\sum x_i^3 + b\sum x_i^2 + c\sum x_i = \sum x_i y_i \\ a\sum x_i^2 + b\sum x_i + cn = \sum y_i \end{cases}$$
### 4. Trường hợp tổng quát & Biểu diễn ma trận
Xét hàm tổng quát $g(x) = \sum_{j=1}^m a_j \varphi_j(x)$:
Đặt các vectơ và ma trận:
- $\boldsymbol{\varphi_j} = (\varphi_j(x_1), \varphi_j(x_2), \dots, \varphi_j(x_n))^T$
- $\mathbf{y} = (y_1, y_2, \dots, y_n)^T$
- Ma trận thiết kế $\Phi = [\boldsymbol{\varphi_1} \quad \boldsymbol{\varphi_2} \quad \dots \quad \boldsymbol{\varphi_m}]_{n \times m}$
- Ma trận hệ số $M = \Phi^T \Phi = [\langle \boldsymbol{\varphi_i}, \boldsymbol{\varphi_j} \rangle]_{i, j}$
Hàm mục tiêu dưới dạng ma trận:
$$S(\mathbf{a}) = \mathbf{a}^T M \mathbf{a} - 2\mathbf{y}^T \Phi \mathbf{a} + \mathbf{y}^T \mathbf{y}$$
Điều kiện cực tiểu $S' = 2\mathbf{a}^T M - 2\mathbf{y}^T \Phi = 0$ dẫn tới **Phương trình chuẩn (Normal Equation)**:
$$M \mathbf{a} = \Phi^T \mathbf{y} \implies \mathbf{a} = M^{-1} \Phi^T \mathbf{y}$$
### 5. Biến đổi hàm phi tuyến về dạng tuyến tính
Một số mô hình phi tuyến có thể tuyến tính hóa bằng phép đổi biến:

1. **Hàm mũ:** $y = a e^{b_1 \varphi_1(x) + \dots + b_m \varphi_m(x)}$
    - Nếu $y_i > 0$: Lấy logarit tự nhiên $\ln y = \ln a + b_1 \varphi_1(x) + \dots + b_m \varphi_m(x)$.
    - Nếu $y_i < 0$: Lấy logarit $\ln(-y) = \ln(-a) + b_1 \varphi_1(x) + \dots + b_m \varphi_m(x)$.
2. **Hàm lũy thừa:** $y = a x^b \implies \ln y = \ln a + b \ln x$.
3. **Hàm logarit:** $y = \ln(b_1 \varphi_1(x) + \dots + b_m \varphi_m(x))$.
### 6. Sơ đồ thuật toán tính toán
Thuật toán tổng quát gồm 3 bước:
- **Bước 1:** Nhập dữ liệu mốc $(x_i, y_i)_{i=\overline{1,n}}$ và hệ hàm cơ sở $\varphi_j(x), j=\overline{1,m}$.
    
- **Bước 2:** Tính ma trận $\Phi = [\varphi_j(x_i)]$, ma trận $M = \Phi^T \Phi$, và vectơ $b = \Phi^T \mathbf{y}$.
    
- **Bước 3:** Giải hệ phương trình tuyến tính $M \mathbf{x} = b$ để thu được bộ hệ số tối ưu $\mathbf{x} = \mathbf{a}$.