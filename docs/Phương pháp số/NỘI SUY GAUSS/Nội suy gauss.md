### Thuật toán nội suy trung tâm Gauss 1 (Gauss tiến)

- **Input:**
    - Bảng dữ liệu mốc cách đều: $X = [x_{-m}, \dots, x_0, \dots, x_m]$, $Y = [y_{-m}, \dots, y_0, \dots, y_m]$ với $h = x_{i+1} - x_i$.
    - Bậc đa thức cần lập $n$ ($n \le 2m$).
    - Điểm cần tính giá trị $x^*$ ($x^* \ge x_0$, tức $t \ge 0$).
- **Steps:**
    1. **Đổi biến số:**
        $$t = \frac{x^* - x_0}{h}$$
        
    2. **Lập bảng sai phân hữu hạn:**
        - Khởi tạo mảng $\Delta$ kích thước $(2m+1) \times (n+1)$ với $\Delta[i][0] = y_i$ (quy ước chỉ số dòng chạy từ $-m$ đến $m$).
        - Lặp cấp sai phân $j = 1, 2, \dots, n$:
            - Lặp dòng $i = -m, \dots, m - j$:
                $$\Delta[i][j] = \Delta[i+1][j-1] - \Delta[i][j-1]$$
                
    3. **Trích xuất hệ số:**
        - Đặt $c_0 = y_0 = \Delta[0][0]$.
        - Lặp $k = 1, 2, \dots, n$:
            - Nếu $k$ lẻ ($k = 2j - 1$): Lấy $c_k = \Delta[-(j-1)][k]$.
            - Nếu $k$ chẵn ($k = 2j$): Lấy $c_k = \Delta[-j][k]$.
    4. **Tính giá trị đa thức và đạo hàm:**
        - Khởi tạo đa thức kết quả $P = c_0$, đa thức tích lũy $T = 1$.
        - Lặp $k = 1, 2, \dots, n$: 
            - Nếu $k$ lẻ ($k = 2j - 1$): $T = T \cdot \frac{t + (j - 1)}{k}$.
            - Nếu $k$ chẵn ($k = 2j$): $T = T \cdot \frac{t - j}{k}$.
            - $P = P + c_k \cdot T$.
        - Tính xấp xỉ đạo hàm: $f'(x^*) \approx \frac{P'(t)}{h}$.
- **Output:**
        $$P(t) = y_0 + t\Delta y_0 + \frac{t(t-1)}{2!}\Delta^2 y_{-1} + \frac{(t+1)t(t-1)}{3!}\Delta^3 y_{-1} + \frac{(t+1)t(t-1)(t-2)}{4!}\Delta^4 y_{-2} + \dots$$
        
    - Giá trị xấp xỉ $f(x^*) \approx P(t)$.
### Thuật toán nội suy trung tâm Gauss 2 (Gauss lùi)
- **Input:**
    - Bảng dữ liệu mốc cách đều: $X = [x_{-m}, \dots, x_0, \dots, x_m]$, $Y = [y_{-m}, \dots, y_0, \dots, y_m]$ với $h = x_{i+1} - x_i$.
    - Bậc đa thức cần lập $n$ ($n \le 2m$).
    - Điểm cần tính giá trị $x^*$ (thỏa mãn $x^* \le x_0$, tức $t \le 0$).
- **Steps:**
    1. **Đổi biến số:**  
        $$t = \frac{x^* - x_0}{h}$$
        
    2. **Lập bảng sai phân hữu hạn:**  
        - Tương tự Bước 2 của Gauss 1.
    3. **Trích xuất hệ số:**  
        - Đặt $c_0 = y_0 = \Delta[0][0]$.
        - Lặp $k = 1, 2, \dots, n$:  
            - Nếu $k$ lẻ ($k = 2j - 1$): Lấy $c_k = \Delta[-j][k]$_.
            - Nếu $k$ chẵn ($k = 2j$): Lấy $c_k = \Delta[-j][k]$ _(chếch xuống)_.
    4. **Tính giá trị đa thức và đạo hàm:**
        - Khởi tạo đa thức kết quả $P = c_0$, đa thức tích lũy $T = 1$.
        - Lặp $k = 1, 2, \dots, n$:  
            - Nếu $k$ lẻ ($k = 2j - 1$): $T = T \cdot \frac{t - (j - 1)}{k}$.
            - Nếu $k$ chẵn ($k = 2j$): $T = T \cdot \frac{t + j}{k}$.
            - $P = P + c_k \cdot T$.
        - Tính xấp xỉ đạo hàm: $f'(x^*) \approx \frac{P'(t)}{h}$.
- **Output:**
        $$P(t) = y_0 + t\Delta y_{-1} + \frac{t(t+1)}{2!}\Delta^2 y_{-1} + \frac{(t+1)t(t-1)}{3!}\Delta^3 y_{-2} + \frac{(t+2)(t+1)t(t-1)}{4!}\Delta^4 y_{-2} + \dots$$
        
    - Giá trị xấp xỉ $f(x^*) \approx P(t)$.
        

### Đánh giá sai số

$$\vert{}R_n(x^*)\vert{} \le \frac{M_{n+1}}{(n+1)!} \vert{}w_{n+1}(x^*)\vert{}$$
- $M_{n+1} = \max_{\xi \in [x_{\min}, x_{\max}]} \vert{}f^{(n+1)}(\xi)\vert{}$.
- $w_{n+1}(x^*) = \prod_{i} (x^* - x_i)$ là tích khoảng cách từ $x^*$ đến $n+1$ mốc nội suy tương ứng đã duyệt.