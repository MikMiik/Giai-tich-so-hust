
## 1. Định nghĩa mốc cách đều và Sai phân

### Mốc cách đều

Xét $n+1$ mốc nội suy sắp xếp theo thứ tự: $x_0 < x_1 < \dots < x_n$. Khoảng cách giữa hai mốc liên tiếp luôn là một hằng số $h$ (gọi là bước lưới):

  

$$x_{k+1} - x_k = h \implies x_k = x_0 + k \cdot h \quad (k = 0, 1, \dots, n) \text{}$$

### Sai phân

- **Sai phân tiến:**
    $$\Delta y_k = y_{k+1} - y_k $$
    
    Sai phân cấp cao hơn: $\Delta^2 y_k = \Delta(\Delta y_k) = y_{k+2} - 2y_{k+1} + y_k$, tổng quát là $\Delta^m y_k$.
    
- **Sai phân lùi:**
    $$\nabla y_k = y_k - y_{k-1} $$
    
    Tổng quát: $\nabla^m y_k = \nabla(\nabla^{m-1} y_k)$.

> **Mối liên hệ giữa Tỉ sai phân và Sai phân:**
> $$f[x_0, x_1, \dots, x_k] = \frac{\Delta^k y_0}{k! \cdot h^k} = \frac{\nabla^k y_k}{k! \cdot h^k} $$

## 2. Công thức Đa thức nội suy Newton mốc cách đều

Đặt biến phụ chuẩn hóa:

  

$$t = \frac{x - x_k}{h} \implies x = x_k + t \cdot h $$

Khi đó: $x - x_{k+i} = (t - i)h$. 

### a. Đa thức Newton tiến (Xuất phát từ mốc $x_k$)

Thường dùng khi điểm cần tính $x$ nằm ở **đầu bảng số liệu:

$$P_n(x) = y_k + \frac{t}{1!} \Delta y_k + \frac{t(t-1)}{2!} \Delta^2 y_k + \dots + \frac{t(t-1)\dots(t-n+1)}{n!} \Delta^n y_k $$

### b. Đa thức Newton lùi (Xuất phát từ mốc $x_k$)

Thường dùng khi điểm cần tính $x$ nằm ở **cuối bảng số liệu**: 

$$P_n(x) = y_k + \frac{t}{1!} \nabla y_k + \frac{t(t+1)}{2!} \nabla^2 y_k + \dots + \frac{t(t+1)\dots(t+n-1)}{n!} \nabla^n y_k $$

- Sự biến đổi từ biến $t$ sang biến $x$

Công thức Gauss I theo biến $t$ (với $t = \frac{x - x_0}{h}$ và bước lưới $h$):

$$P(t) = y_0 + t\,\Delta y_0 + \frac{t(t-1)}{2!}\Delta^2 y_{-1} + \frac{(t+1)t(t-1)}{3!}\Delta^3 y_{-1} + \frac{(t+1)t(t-1)(t-2)}{4!}\Delta^4 y_{-2} + \dots$$

Khi thay $t = \frac{x - x_0}{h}$, các thừa số chứa $t$ chuyển thành tích các khoảng cách từ $x$ đến các mốc $x_i$:

- $t = \frac{x - x_0}{h}$
    
- $t(t-1) = \frac{x - x_0}{h} \cdot \frac{x - x_1}{h} = \frac{(x - x_0)(x - x_1)}{h^2}$
    
- $(t+1)t(t-1) = \frac{x - x_{-1}}{h} \cdot \frac{x - x_0}{h} \cdot \frac{x - x_1}{h} = \frac{(x - x_{-1})(x - x_0)(x - x_1)}{h^3}$
    
- $(t+1)t(t-1)(t-2) = \frac{(x - x_{-1})(x - x_0)(x - x_1)(x - x_2)}{h^4}$
    

Lúc này, đa thức theo biến $x$ được viết dưới dạng:

$$P(x) = y_0 + \frac{\Delta y_0}{1!\,h}(x - x_0) + \frac{\Delta^2 y_{-1}}{2!\,h^2}(x - x_0)(x - x_1) + \frac{\Delta^3 y_{-1}}{3!\,h^3}(x - x_{-1})(x - x_0)(x - x_1) + \dots$$

> **Lưu ý:** Các hệ số dạng $\frac{\Delta^k y_j}{k!\,h^k}$ chính là các **tỷ sai phân** $f[x_0, x_1, \dots]$ tương ứng. Do đó, khi viết theo biến $x$, công thức Gauss I trở về đúng dạng **đa thức nội suy Newton theo thứ tự mốc Gauss**:
> 
> $$P(x) = y_0 + f[x_0, x_1](x - x_0) + f[x_{-1}, x_0, x_1](x - x_0)(x - x_1) + f[x_{-1}, x_0, x_1, x_2](x - x_{-1})(x - x_0)(x - x_1) + \dots$$


## 3. Tính đạo hàm gần đúng từ đa thức nội suy

Khi tính xấp xỉ đạo hàm cấp 1 $f'(x)$: Dùng quy tắc đạo hàm hàm hợp theo $t$:

$$f'(x) \approx P'_n(x) = \frac{d P_n(t)}{dt} \cdot \frac{dt}{dx} = \frac{P'(t)}{h} \quad \left(\text{vì } \frac{dt}{dx} = \frac{1}{h}\right) $$


## 4. Cách giải cụ thể

**Bước 1: Tính bước lưới $h$** Kiểm tra và tính khoảng cách không đổi giữa các mốc: $h = x_{k+1} - x_k$.

**Bước 2: Lập bảng sai phân** Lập bảng tính các giá trị sai phân cấp 1, cấp 2, ..., cấp $n$ từ dữ liệu $y_i$ ban đầu. (Tính sai phân tiến $\Delta$ hoặc lùi $\nabla$ tùy vào vị trí $x$ cần nội suy nằm ở đầu hay cuối bảng).

**Bước 3: Chọn mốc $x_k$ và tính biến $t$**

- Xác định vị trí điểm $x$ cần nội suy.
    
- Chọn mốc xuất phát $x_k$:
    
    - Chọn $x_k$ ở đầu bảng nếu dùng công thức Newton tiến.
        
    - Chọn $x_k$ ở cuối bảng nếu dùng công thức Newton lùi.
        
- Tính $t = \frac{x - x_k}{h}$.
    

**Bước 4: Thay các đại lượng vào công thức nội suy**

Ráp $y_k$, $t$, và các giá trị sai phân tương ứng trên cùng một đường chéo (hoặc hàng ngang) vào công thức đã đổi biến:

- **Công thức tiến:** $P_n(t) = y_k + \frac{t}{1!} \Delta y_k + \frac{t(t-1)}{2!} \Delta^2 y_k + \dots + \frac{t(t-1)\dots(t-n+1)}{n!} \Delta^n y_k$.
    
- **Công thức lùi:** $P_n(t) = y_k + \frac{t}{1!} \nabla y_k + \frac{t(t+1)}{2!} \nabla^2 y_k + \dots + \frac{t(t+1)\dots(t+n-1)}{n!} \nabla^n y_k$.
    

**Bước 5 (Nếu có): Đánh giá sai số** Nếu bài toán yêu cầu ước lượng sai số phần dư, áp dụng công thức: $\vert{}R(x)\vert{} \leq \frac{M_{n+1}}{(n+1)!} \vert{}w_{n+1}(x)\vert{}$.

## 5. Ví dụ minh họa cách chọn mốc (theo bài toán trong vở)

- **Dữ liệu bài toán:**  
    - Bảng số liệu: $x_0 = 1.2$, $x_{93} = 19.8$, bước $h = 0.2$.
    - Cần tính: $f(10.15)$ và $f'(10.15)$ dùng đa thức bậc 5 (chọn $n+1 = 6$ mốc nội suy).
- **Cách tư duy chọn mốc:**
    - Ta tìm vị trí của $x = 10.15$ trong bảng:
        $$t = \frac{10.15 - 1.2}{0.2} = 44.75 $$
    - Nghĩa là $10.15$ nằm kẹp giữa mốc $x_{44}$ ($= 1.2 + 44 \times 0.2 = 10.0$) và $x_{45}$ ($= 10.2$).
    - Điểm cần tính nằm ở giữa bảng, nếu dùng 6 mốc:
        - **Theo Newton tiến:** Lấy mốc bắt đầu là $x_{42}$, gồm 6 mốc $\{x_{42}, x_{43}, x_{44}, x_{45}, x_{46}, x_{47}\}$.
        - **Theo Newton lùi:** Lấy mốc kết thúc là $x_{47}$ lùi về trước.
        - **Theo Gauss:** Chọn mốc trung tâm xung quanh khoảng $[x_{44}, x_{45}]$ để hội tụ sai số tốt nhất.