### Thuật toán nội suy Newton lùi (Mốc bất kỳ)

* **Input:** $n \in \mathbb{N}$; hai mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với các $x_i$ đôi một khác nhau.


* **Steps:**
1. **Tính bảng tỷ sai phân (lấy đường chéo lùi):**

* Khởi tạo ma trận hoặc mảng lưu tỷ sai phân: Đặt $D_{i, 0} = y_i$ với mọi $i = 0, 1, \dots, n$.


* Lặp $j = 1, 2, \dots, n$ (chỉ số cấp tỷ sai phân):


* Lặp $i = j, j + 1, \dots, n$:

$$D_{i, j} = \frac{D_{i, j-1} - D_{i-1, j-1}}{x_i - x_{i-j}}$$





* Trích xuất các hệ số Newton lùi từ hàng cuối cùng $i = n$:

$$b_k = D_{n, k} = f[x_{n-k}, \dots, x_n], \quad \forall k = 0, 1, \dots, n$$





2. **Khởi tạo đa thức kết quả:**
* Đặt mảng hệ số đa thức kết quả: $P = [P_n, P_{n-1}, \dots, P_0]$ với $P_j = 0$ với mọi $j = 0, 1, \dots, n$.


* Đặt $P_0 = b_0$ (với $b_0 = y_n$).
* Khởi tạo đa thức tích lũy ngược $W(x) = 1$: mảng $W = [w_0] = [1]$ (bậc 0).


3. **Tính tích lũy đa thức cơ sở lùi và cộng dồn:**

* Lặp $k = 1, 2, \dots, n$:
* **Nhân đa thức tích $W(x)$ với $(x - x_{n - k + 1})$:**

* Mở rộng bậc của $W$ thêm 1 phần tử (đặt $w_k = w_{k-1}$).
* Lặp $j = k - 1, k - 2, \dots, 1$:

$$w_j = w_{j-1} - x_{n - k + 1} \cdot w_j$$



* Đặt $w_0 = -x_{n - k + 1} \cdot w_0$.




* **Cộng dồn vào đa thức kết quả $P(x)$:**

* Lặp $j = 0, 1, \dots, k$:

$$P_j = P_j + b_k \cdot w_j$$










* **Output:**
* Dạng tích tường minh: Các hệ số $b_k$ để biểu diễn:

$$P_n(x) = y_n + \sum_{k=1}^n f[x_{n-k}, \dots, x_n] \prod_{j=0}^{k-1} (x - x_{n-j})$$



* Mảng hệ số chính tắc $P = [P_n, P_{n-1}, \dots, P_0]$ của đa thức $P_n(x) = \sum_{j=0}^n P_j x^j$.





---

### Minh họa từ lời giải Câu 9a

Bảng dữ liệu gồm 6 mốc nội suy ($n = 5$):


$$x_0 = 2.2, \quad x_1 = 2.3, \quad x_2 = 2.6, \quad x_3 = 2.7, \quad x_4 = 3.0, \quad x_5 = 3.2$$

$$y_0 = 1.617, \quad y_1 = 1.4914, \quad y_2 = 1.031, \quad y_3 = 0.8548, \quad y_4 = 0.2822, \quad y_5 = -0.1167$$

Đa thức nội suy Newton lùi bậc không quá 5 có dạng tổng quát:


$$P_5(x) = y_5 + \sum_{k=1}^{5} f[x_{5-k}, \dots, x_5] \prod_{j=0}^{k-1} (x - x_{5-j})$$

#### Bảng tỷ sai phân (lấy đường chéo đáy):

| $x_i$ | $y_i$ | Cấp 1 | Cấp 2 | Cấp 3 | Cấp 4 | Cấp 5 |
| --- | --- | --- | --- | --- | --- | --- |
| $2.2$ | $1.617$ |  |  |  |  |  |
| $2.3$ | $1.4914$ | $-1.2560$ |  |  |  |  |
| $2.6$ | $1.0310$ | $-1.5347$ | $-0.6967$ |  |  |  |
| $2.7$ | $0.8548$ | $-1.7620$ | $-0.5683$ | $0.2568$ |  |  |
| $3.0$ | $0.2822$ | $-1.9087$ | $-0.3667$ | $0.2880$ | $0.0390$ |  |
| **3.2** | $\mathbf{-0.1167}$ | $\mathbf{-1.9945}$ | $\mathbf{-0.1717}$ | $\mathbf{0.3250}$ | $\mathbf{0.0411}$ | $\mathbf{0.0022}$ |

#### Viết gọn dạng tường minh từ bảng tỷ sai phân:

$$P_5(x) = y_5 + f[x_4, x_5](x - x_5) + f[x_3, x_4, x_5](x - x_5)(x - x_4) + \dots + f[x_0, \dots, x_5]\prod_{j=1}^5 (x - x_j)$$

$$= -0.1167 - 1.9945(x - 3.2) - 0.1717(x - 3.2)(x - 3.0)$$

$$+ 0.3250(x - 3.2)(x - 3.0)(x - 2.7)$$

$$+ 0.0411(x - 3.2)(x - 3.0)(x - 2.7)(x - 2.6)$$

$$+ 0.0022(x - 3.2)(x - 3.0)(x - 2.7)(x - 2.6)(x - 2.3)$$