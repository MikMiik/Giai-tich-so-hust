* **Đầu vào:** Bậc $n \in \mathbb{N}$; mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với các $x_i$ đôi một khác nhau.

* **Các bước:**
1. **Tính vector tỷ sai phân lùi $C$:**
* Khởi tạo ma trận $D$ kích thước $(n+1) \times (n+1)$, gán $D_{i,0} = y_i$ với $i = 0, 1, \dots, n$.
* Lặp $j = 1, 2, \dots, n$:
* Lặp $i = j, j + 1, \dots, n$:

$$D_{i,j} = \frac{D_{i, j-1} - D_{i-1, j-1}}{x_i - x_{i-j}}$$

* Thu được vector $C = [c_0, c_1, \dots, c_n]$ bằng cách trích xuất hàng đáy: $c_k = D_{n, k}$.

2. **Tạo ma trận đa thức cơ sở lùi $A$ (kích thước $(n+1) \times (n+1)$):**
* Khởi tạo hàng 0: $A_0 = [0, 0, \dots, 0, 1]$.
* Lặp $k = 1, 2, \dots, n$ (ứng với mốc $x_{n-k+1}$ lùi dần):
* Với $i = n, n - 1, \dots, 0$:
$$A_{k, i} = A_{k-1, i+1} - x_{n-k+1} \cdot A_{k-1, i} \quad \text{(quy ước } A_{k-1, n+1} = 0\text{)}$$

3. **Tính mảng hệ số kết quả $P = C \cdot A$:**
* Với mỗi chỉ số cột $j = 0, 1, \dots, n$ (tương ứng bậc $x^{n-j}$):

$$P_j = \sum_{k=0}^n C_k \cdot A_{k, j}$$

* **Đầu ra:** Mảng hệ số chính tắc $P = [P_0, P_1, \dots, P_n]$ đại diện cho $P_n(x) = \sum_{j=0}^n P_j x^{n-j}$.
### VD

* **Đầu vào:**
* $n = 5$
* $X = [2.2, \quad 2.3, \quad 2.6, \quad 2.7, \quad 3.0, \quad 3.2]$
* $Y = [1.617, \quad 1.4914, \quad 1.0310, \quad 0.8548, \quad 0.2822, \quad -0.1167]$
* **Các bước:**
1. **Bảng tỷ sai phân:**

| **xi​** | **yi​** | **Cấp 1** | **Cấp 2** | **Cấp 3** | **Cấp 4** | **Cấp 5** |
| --- | --- | --- | --- | --- | --- | --- |
| 2.2 | 1.6170 |  |  |  |  |  |
| 2.3 | 1.4914 | -1.2560 |  |  |  |  |
| 2.6 | 1.0310 | -1.5347 | -0.6967 |  |  |  |
| 2.7 | 0.8548 | -1.7620 | -0.5683 | 0.2568 |  |  |
| 3.0 | 0.2822 | -1.9087 | -0.3667 | 0.2880 | 0.0390 |  |
| **3.2** | $\mathbf{-0.1167}$ | $\mathbf{-1.9945}$ | $\mathbf{-0.1717}$ | $\mathbf{0.3250}$ | $\mathbf{0.0411}$ | $\mathbf{0.0022}$ |

* Vector tỷ sai phân lùi $C = [-0.1167, -1.9945, -0.1717, 0.3250, 0.0411, 0.0022]$.
2. **Tạo ma trận đa thức cơ sở lùi $A$:** Khởi tạo $A_0 = [0, 0, 0, 0, 0, 1]$. Cập nhật lặp lùi từng hàng khi nhân với các mốc $x_{6-k}$ tương ứng:
* $k = 1$ ($x_5 = 3.2$): $A_1 = [0, 0, 0, 0, 1, -3.2]$
* $k = 2$ ($x_4 = 3.0$): $A_2 = [0, 0, 0, 1, -6.2, 9.6]$
* $k = 3$ ($x_3 = 2.7$): $A_3 = [0, 0, 1, -8.9, 26.34, -25.92]$
* $k = 4$ ($x_2 = 2.6$): $A_4 = [0, 1, -11.5, 49.48, -94.404, 67.392]$
* $k = 5$ ($x_1 = 2.3$): $A_5 = [1, -13.8, 75.93, -208.208, 284.5212, -155.0016]$
2. **Tính $P = C \cdot A$:** Thực hiện nhân vô hướng vector $C$ với từng cột của ma trận $A$ (từ bậc $x^5$ giảm dần đến $x^0$):
* $P_0 = c_5 \cdot A_{5,0} = 0.0022 \cdot 1 = \mathbf{0.0022}$
* $P_1 = c_4 \cdot A_{4,1} + c_5 \cdot A_{5,1} = 0.0411 + 0.0022(-13.8) = \mathbf{0.0107}$
* $P_2 = c_3 \cdot A_{3,2} + c_4 \cdot A_{4,2} + c_5 \cdot A_{5,2} = 0.3250 + 0.0411(-11.5) + 0.0022(75.93) = \mathbf{0.0194}$
* $P_3 = \sum C_k \cdot A_{k,3} = \mathbf{-1.4886}$
* $P_4 = \sum C_k \cdot A_{k,4} = \mathbf{4.3765}$
* $P_5 = \sum C_k \cdot A_{k,5} = \mathbf{-1.3778}$
* **Đầu ra:** Mảng hệ số chính tắc $P = [0.0022, 0.0107, 0.0194, -1.4886, 4.3765, -1.3778]$ tương ứng với đa thức hoàn chỉnh:
$$P_5(x) = 0.0022x^5 + 0.0107x^4 + 0.0194x^3 - 1.4886x^2 + 4.3765x - 1.3778$$