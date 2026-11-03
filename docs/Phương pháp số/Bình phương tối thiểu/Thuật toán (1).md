### I. Thuật toán tổng quát (Hàm tuyến tính theo tham số)

- **Input:**
  - Số lượng hàm cơ sở $m \in \mathbb{N}^*$;
  - Hệ $m$ hàm cơ sở: $\{\varphi_j(x)\}_{j=1, m}$ độc lập tuyến tính trên $\{x_i\}$;
  - Dữ liệu $n$ điểm: $X = [x_1, x_2, \dots, x_n]^T$, $Y = [y_1, y_2, \dots, y_n]^T$ ($n \ge m$).
- **Steps:**
  1. **Tạo ma trận thiết kế $\Phi$ ($n \times m$):** Lặp $i = 1, \dots, n; \, j = 1, \dots, m$:
     $$\Phi_{i, j} = \varphi_j(x_i) \implies \Phi = \begin{bmatrix} \varphi_1(x_1) & \dots & \varphi_m(x_1) \\ \vdots & \ddots & \vdots \\ \varphi_1(x_n) & \dots & \varphi_m(x_n) \end{bmatrix}_{n \times m} \quad $$
  2. **Tính ma trận Gram $M$ và vector $d$:**
     $$M_{m \times m} = \Phi^T \Phi, \quad d_{m \times 1} = \Phi^T Y \quad $$
  3. **Giải hệ phương trình chuẩn $M \mathbf{a} = d$:**
     $$\mathbf{a} = M^{-1} d = [a_1, a_2, \dots, a_m]^T \quad $$
  4. **Đánh giá độ chính xác:**
     - Vector xấp xỉ: $\hat{Y} = \Phi \mathbf{a}$
     - Vector độ lệch: $E = \hat{Y} - Y = [e_1, e_2, \dots, e_n]^T$ với $e_i = \left(\sum_{j=1}^m a_j \varphi_j(x_i)\right) - y_i$
     - Tổng bình phương sai số (SSD): $S = E^T E = \sum_{i=1}^n e_i^2$
     - Sai số trung bình phương (RMSE): $\sigma = \sqrt{\frac{S}{n}} = \sqrt{\frac{1}{n} \sum_{i=1}^n e_i^2}$
- **Output:**
  - Vector hệ số $\mathbf{a} \implies g(x) = \sum_{j=1}^m a_j \varphi_j(x)$
  - Chỉ số sai số: $S$ và $\sigma$.

### II. Các dạng hàm phi tuyến đưa về dạng tuyến tính

#### 1. Dạng hàm mũ tổng quát $y = a e^{\sum_{j=1}^m b_j \varphi_j(x)}$

- **Input:**
  - Dữ liệu $n$ điểm: $X = [x_1, x_2, \dots, x_n]^T$, $Y = [y_1, y_2, \dots, y_n]^T$ ($y_i$ cùng dấu, $y_i \ne 0$, $n \ge m+1$);
  - Hệ $m$ hàm cơ sở: $\varphi_1(x), \dots, \varphi_m(x)$ sao cho $1, \varphi_1, \dots, \varphi_m$ độc lập tuyến tính trên $\{x_i\}$.
- **Steps:**
  1. **Tuyến tính hóa dữ liệu và dấu của $Y$:**
     - Nếu $y_i > 0, \forall i$: $Y^* = [\ln y_1, \dots, \ln y_n]^T$, đặt $a_0 = \ln a \implies a = e^{a_0}$.
     - Nếu $y_i < 0, \forall i$: $Y^* = [\ln(-y_1), \dots, \ln(-y_n)]^T$, đặt $a_0 = \ln(-a) \implies a = -e^{a_0}$.
  2. **Tạo ma trận thiết kế $\Phi$ ($n \times (m+1)$):** Lặp $i = 1, \dots, n$:
     $$\Phi_{i, 1} = 1, \quad \Phi_{i, j+1} = \varphi_j(x_i) \quad (j = 1, \dots, m) \quad $$
  3. **Tính ma trận $M$ và vector $d$:**
     $$M_{(m+1) \times (m+1)} = \Phi^T \Phi, \quad d_{(m+1) \times 1} = \Phi^T Y^* \quad $$
  4. **Giải hệ phương trình chuẩn $M \mathbf{a} = d$:**
     $$\mathbf{a} = [a_0, b_1, b_2, \dots, b_m]^T = M^{-1} d \quad $$
        $$\implies \begin{cases} a = e^{a_0} & \text{nếu } y_i > 0 \\ a = -e^{a_0} & \text{nếu } y_i < 0 \end{cases} \quad $$
  5. **Đánh giá độ chính xác trên $y$ gốc:** $\hat{y}_i = a e^{\sum_{j=1}^m b_j \varphi_j(x_i)}$, $e_i = \hat{y}_i - y_i$, $S = \sum_{i=1}^n e_i^2$, $\sigma = \sqrt{\frac{S}{n}}$.
- **Output:** Các hệ số $a, b_1, b_2, \dots, b_m$; $S$ và $\sigma$.

#### 2. Dạng hàm lũy thừa $y = a x^b$

- **Input:** Dữ liệu $n$ điểm: $X = [x_1, \dots, x_n]^T$, $Y = [y_1, \dots, y_n]^T$ ($x_i > 0$, $y_i$ cùng dấu, $y_i \ne 0$, $\forall i$; các $x_i$ không đồng nhất).
- **Steps:**
  1. **Tuyến tính hóa dữ liệu:**
     $$X^* = [\ln x_1, \dots, \ln x_n]^T \quad $$
     - Nếu $y_i > 0, \forall i$: $Y^* = [\ln y_1, \dots, \ln y_n]^T$, đặt $a_0 = \ln a \implies a = e^{a_0}$.
     - Nếu $y_i < 0, \forall i$: $Y^* = [\ln(-y_1), \dots, \ln(-y_n)]^T$, đặt $a_0 = \ln(-a) \implies a = -e^{a_0}$.

     Mô hình: $\ln |y| = a_0 + b \ln x$.

  2. **Tạo ma trận thiết kế $\Phi$ ($n \times 2$):** Lặp $i = 1, \dots, n$:
     $$\Phi_{i, 1} = 1, \quad \Phi_{i, 2} = \ln x_i \quad $$
  3. **Tính ma trận $M$ và vector $d$:**
     $$M_{2 \times 2} = \Phi^T \Phi, \quad d_{2 \times 1} = \Phi^T Y^* \quad $$
  4. **Giải hệ $M \mathbf{a} = d$:**
     $$\mathbf{a} = [a_0, b]^T = M^{-1} d \implies \begin{cases} a = e^{a_0} & \text{nếu } y_i > 0 \\ a = -e^{a_0} & \text{nếu } y_i < 0 \end{cases} \quad $$
  5. **Đánh giá độ chính xác trên $y$ gốc:** $\hat{y}_i = a x_i^b$, $e_i = \hat{y}_i - y_i$, $S = \sum_{i=1}^n e_i^2$, $\sigma = \sqrt{\frac{S}{n}}$.

- **Output:** Các hệ số $a, b$; $S$ và $\sigma$.

#### 3. Dạng hàm logarit $y = \ln\left(\sum_{j=1}^m b_j \varphi_j(x)\right)$

- **Input:**
  - Dữ liệu $n$ điểm: $X = [x_1, \dots, x_n]^T$, $Y = [y_1, \dots, y_n]^T$ ($n \ge m$);
  - Hệ $m$ hàm cơ sở: $\varphi_1(x), \dots, \varphi_m(x)$ độc lập tuyến tính trên $\{x_i\}$.
- **Steps:**
  1. **Tuyến tính hóa dữ liệu:** Lấy mũ hai vế: $e^y = \sum_{j=1}^m b_j \varphi_j(x) \implies Y^* = [e^{y_1}, \dots, e^{y_n}]^T$.
  2. **Tạo ma trận thiết kế $\Phi$ ($n \times m$):** Lặp $i = 1, \dots, n; \, j = 1, \dots, m$:
     $$\Phi_{i, j} = \varphi_j(x_i) \quad $$
  3. **Tính ma trận $M$ và vector $d$:**
     $$M_{m \times m} = \Phi^T \Phi, \quad d_{m \times 1} = \Phi^T Y^* \quad $$
  4. **Giải hệ $M \mathbf{b} = d$:**
     $$\mathbf{b} = [b_1, b_2, \dots, b_m]^T = M^{-1} d \quad $$
  5. **Đánh giá độ chính xác trên $y$ gốc:** $z_i = \sum_{j=1}^m b_j \varphi_j(x_i)$ ($z_i > 0, \forall i$), $\hat{y}_i = \ln z_i$, $e_i = \hat{y}_i - y_i$, $S = \sum_{i=1}^n e_i^2$, $\sigma = \sqrt{\frac{S}{n}}$.
- **Output:** Các hệ số $b_1, b_2, \dots, b_m$; $S$ và $\sigma$.
