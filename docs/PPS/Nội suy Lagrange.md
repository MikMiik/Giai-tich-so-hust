- **Input:** $n \in \mathbb{N}$; hai mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với các $x_i$ đôi một khác nhau.
- **Steps:**
    1. **Tính hệ số $w_{n+1}(x) = [w_{n+1}, \dots, w_0]$:**
        - Đặt $w_0 = 1$.
        - Lặp $k = 0, 1, \dots, n$:
            - Đặt $w_{k+1} = w_k$.
            - Lặp $j = k, k - 1, \dots, 1$:
                $$w_j = w_{j-1} - x_k \cdot w_j$$
                
            - Đặt $w_0 = -x_k \cdot w_0$.
    2. **Khởi tạo hệ số đa thức kết quả:**
        - Đặt $P_j = 0$ với mọi $j = 0, 1, \dots, n$.
    3. **Tính và cộng dồn từng đa thức cơ bản:**
        - Lặp $i = 0, 1, \dots, n$:
            - Tính mẫu số:$$D = \prod_{\substack{j=0 \\ j \ne i}}^n (x_i - x_j)$$
                
            - Đặt hệ số tỷ lệ: $T = \frac{y_i}{D}$
            - Chia Horner tìm tử số và cộng dồn:
                - Đặt $c = w_{n+1}$.
                - Đặt $P_n = P_n + T \cdot c$.
                - Lặp $j = n - 1, n - 2, \dots, 0$:
                    $$c = c \cdot x_i + w_{j+1}$$
                    $$P_j = P_j + T \cdot c$$
                    
- **Output:** Mảng hệ số $P = [P_n, P_{n-1}, \dots, P_0]$ của đa thức $P_n(x) = \sum_{j=0}^n P_j x^j$.

VD:
Bảng dữ liệu gồm $6$ mốc nội suy ($n = 5$):
$$x_0 = 1.2, \quad x_1 = 1.5, \quad x_2 = 1.7, \quad x_3 = 1.8, \quad x_4 = 2.1, \quad x_5 = 2.3$$
$$y_0 = 0.892, \quad y_1 = 1.179, \quad y_2 = 1.358, \quad y_3 = 1.445, \quad y_4 = 1.688, \quad y_5 = 1.839$$
Đa thức nội suy Lagrange bậc không quá 5 có dạng tổng quát:

$$P_5(x) = \sum_{i=0}^{5} y_i L_i(x) = \sum_{i=0}^{5} y_i \frac{\prod_{\substack{j=0 \\ j \ne i}}^{5} (x - x_j)}{D_i}$$

với $D_i = \prod_{\substack{j=0 \\ j \ne i}}^{5} (x_i - x_j)$.
### Bảng tính mẫu số $D_i$ và hệ số $A_i$

|**i**|**xi​**|**yi​**|**Các hiệu (xi​−xj​) với j=i**|**Di​=∏(xi​−xj​)**|**Ai​=Di​yi​​**|
|---|---|---|---|---|---|
|**0**|$1.2$|$0.892$|$(-0.3) \cdot (-0.5) \cdot (-0.6) \cdot (-0.9) \cdot (-1.1)$|$-0.08910$|**$-10.0112$**|
|**1**|$1.5$|$1.179$|$(0.3) \cdot (-0.2) \cdot (-0.3) \cdot (-0.6) \cdot (-0.8)$|$-0.00864$|**$-136.4583$**|
|**2**|$1.7$|$1.358$|$(0.5) \cdot (0.2) \cdot (-0.1) \cdot (-0.4) \cdot (-0.6)$|$-0.00240$|**$-565.8333$**|
|**3**|$1.8$|$1.445$|$(0.6) \cdot (0.3) \cdot (0.1) \cdot (-0.3) \cdot (-0.5)$|$0.00270$|**$535.1852$**|
|**4**|$2.1$|$1.688$|$(0.9) \cdot (0.6) \cdot (0.4) \cdot (0.3) \cdot (-0.2)$|$-0.01296$|**$-130.2469$**|
|**5**|$2.3$|$1.839$|$(1.1) \cdot (0.8) \cdot (0.6) \cdot (0.5) \cdot (0.2)$|$0.05280$|**$34.8295$**|

### Viết gọn dạng tường minh từ bảng:

$$P_5(x) = \sum_{i=0}^{5} A_i \prod_{\substack{j=0 \\ j \ne i}}^{5} (x - x_j)$$

$$= -10.0112(x-1.5)(x-1.7)(x-1.8)(x-2.1)(x-2.3)$$

$$- 136.4583(x-1.2)(x-1.7)(x-1.8)(x-2.1)(x-2.3)$$

$$- 565.8333(x-1.2)(x-1.5)(x-1.8)(x-2.1)(x-2.3)$$

$$+ 535.1852(x-1.2)(x-1.5)(x-1.7)(x-2.1)(x-2.3)$$

$$- 130.2469(x-1.2)(x-1.5)(x-1.7)(x-1.8)(x-2.3)$$

$$+ 34.8295(x-1.2)(x-1.5)(x-1.7)(x-1.8)(x-2.1)$$