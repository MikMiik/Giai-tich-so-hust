

### Thuật toán nội suy Newton tiến (Mốc bất kỳ)

- **Input:** $n \in \mathbb{N}$; hai mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với các $x_i$ đôi một khác nhau.
- **Steps:**
    1. **Tính bảng tỷ sai phân:**
        - Khởi tạo mảng tỷ sai phân chéo: $c_i = y_i$ với mọi $i = 0, 1, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$ (chỉ số cấp tỷ sai phân):  
            - Lặp $i = n, n - 1, \dots, j$:
                $$c_i = \frac{c_i - c_{i-1}}{x_i - x_{i-j}}$$
                _(Sau vòng lặp, mảng $c = [c_0, c_1, \dots, c_n]$ chính là các hệ số Newton tương ứng: $c_k = f[x_0, x_1, \dots, x_k]$)._
                
    2. **Khởi tạo đa thức kết quả:**
        - Đặt mảng hệ số đa thức kết quả: $P = [P_n, P_{n-1}, \dots, P_0]$ với $P_j = 0$ với mọi $j = 0, 1, \dots, n$.
        - Đặt $P_0 = c_0$ (ứng với số hạng tự do $c_0$).
        - Khởi tạo đa thức tích lũy $W(x) = 1$: mảng $W = [w_0] = [1]$ (bậc 0).
    3. **Tính tích lũy đa thức cơ sở và cộng dồn:**
        - Lặp $k = 1, 2, \dots, n$:  
            - **Nhân đa thức tích $W(x)$ với $(x - x_{k-1})$:**
                - Mở rộng bậc của $W$ thêm 1 phần tử (đặt $w_k = w_{k-1}$).
                - Lặp $j = k - 1, k - 2, \dots, 1$:$$w_j = w_{j-1} - x_{k-1} \cdot w_j$$
                    
                - Đặt $w_0 = -x_{k-1} \cdot w_0$.
                    
            - **Cộng dồn vào đa thức kết quả $P(x)$:**
                  
                - Lặp $j = 0, 1, \dots, k$:
                    $$P_j = P_j + c_k \cdot w_j$$
                    
- **Output:**
    - Dạng tích tường minh: Các hệ số $c_k$ để biểu diễn:
        $$P_n(x) = c_0 + \sum_{k=1}^n c_k \prod_{j=0}^{k-1} (x - x_j)$$

    - Mảng hệ số chính tắc $P = [P_n, P_{n-1}, \dots, P_0]$ của đa thức $P_n(x) = \sum_{j=0}^n P_j x^j$.

### VD
Bảng dữ liệu gồm 6 mốc nội suy ($n = 5$):
$$x_0 = 1.2, \quad x_1 = 1.5, \quad x_2 = 1.7, \quad x_3 = 1.9, \quad x_4 = 2.1, \quad x_5 = 2.4$$

$$y_0 = 0.7247, \quad y_1 = 0.1415, \quad y_2 = -0.2577, \quad y_3 = -0.6466, \quad y_4 = -1.0097, \quad y_5 = -1.4748$$

Đa thức nội suy Newton tiến bậc không quá 5 có dạng tổng quát:

$$P_5(x) = c_0 + \sum_{k=1}^{5} c_k \prod_{j=0}^{k-1} (x - x_j)$$

  

với $c_0 = y_0$ và $c_k = f[x_0, x_1, \dots, x_k]$.
#### Bảng tỷ sai phân

|**xi​**|**yi​**|**Cấp 1**|**Cấp 2**|**Cấp 3**|**Cấp 4**|**Cấp 5**|
|---|---|---|---|---|---|---|
|**1.2**|$\mathbf{0.7247}$||||||
|**1.5**|$0.1415$|$\mathbf{-1.9440}$|||||
|**1.7**|$-0.2577$|$-1.9960$|$\mathbf{-0.1040}$||||
|**1.9**|$-0.6466$|$-1.9445$|$0.1288$|$\mathbf{0.3325}$|||
|**2.1**|$-1.0097$|$-1.8155$|$0.3225$|$0.3229$|$\mathbf{-0.0107}$||
|**2.4**|$-1.4748$|$-1.5503$|$0.5303$|$0.2969$|$-0.0371$|$\mathbf{-0.0152}$|


$$P_5(x) = c_0 + c_1(x - x_0) + c_2(x - x_0)(x - x_1) + \dots + c_5(x - x_0)\dots(x - x_4)$$
$$= 0.7247 - 1.9440(x - 1.2) - 0.1040(x - 1.2)(x - 1.5)$$
$$+ 0.3325(x - 1.2)(x - 1.5)(x - 1.7)$$
$$- 0.0107(x - 1.2)(x - 1.5)(x - 1.7)(x - 1.9)$$
$$- 0.0152(x - 1.2)(x - 1.5)(x - 1.7)(x - 1.9)(x - 2.1)$$