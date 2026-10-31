
### Thuật toán 1: Nội suy Newton lùi mốc cách đều (Đầu vào toàn bộ mảng)

- **Input:** $n \in \mathbb{N}$; mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ cách đều.
- **Steps:**  
    1. **Tính bước lưới:**
        $$h = x_1 - x_0$$
        
    2. **Lập bảng sai phân lùi:**  
        - Khởi tạo mảng 2 chiều $\nabla$ kích thước $(n+1) \times (n+1)$, gán cột đầu tiên: $\nabla[i][0] = y_i$ với $i = 0, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$ (cấp sai phân):  
            - Lặp $i = n, n-1, \dots, j$:
                $$\nabla[i][j] = \nabla[i][j-1] - \nabla[i-1][j-1]$$
                
    3. **Trích xuất hệ số đa thức:**
        - Mảng hệ số $C = [c_0, c_1, \dots, c_n]$ với $c_k = \nabla[n][k]$ (lấy hàng cuối cùng của bảng sai phân).
- **Output:** Mảng hệ số $C$.
- **Optional (Tính giá trị):** Cho $x$ cần tính (thường nằm ở cuối bảng):
      
    - Đổi biến: $t = \frac{x - x_n}{h}$.
    - Tính $f(x) \approx P_n(t) = c_0 + \sum_{k=1}^n \frac{c_k}{k!} \prod_{j=0}^{k-1} (t+j)$.
    - Tính $f'(x) \approx \frac{1}{h} P'_n(t)$ (lấy đạo hàm trực tiếp biểu thức $P_n(t)$ theo $t$).
### Thuật toán 2: Nội suy Newton lùi (Tự động chọn mốc tối ưu quanh điểm cần tính)
- **Input:** Mảng dữ liệu lớn $X = [x_0, \dots, x_N], Y = [y_0, \dots, y_N]$ cách đều; điểm cần tính $x^*$.
- **Steps:** 
    1. **Tính bước lưới và số lượng mốc cần thiết:**
        - $h = x_1 - x_0$.
        - Để đoạn nội suy có độ dài $\approx 1$, số khoảng cần lấy là $K = \text{round}(1/h)$.
        - Số mốc cần chọn: $n = K + 1$.
    2. **Xác định chỉ số mốc bắt đầu (chọn mốc trung tâm):**
        - Tính vị trí tương đối của $x^*$ so với toàn bảng: $pos = \lfloor \frac{x^* - x_0}{h} \rfloor$.
        - Để $x^*$ nằm ở khoảng giữa đoạn nội suy, chọn chỉ số bắt đầu: $idx = \max(0, pos - \lfloor \frac{n}{2} \rfloor)$.
        - Kiểm tra vượt biên: Nếu $idx + n - 1 > N$, gán lại $idx = N - n + 1$.
    3. **Trích xuất mảng con:**
        - Mảng mốc sử dụng: $X_{sub} = X[idx : idx + n]$.
        - Mảng giá trị tương ứng: $Y_{sub} = Y[idx : idx + n]$.
    4. **Lập bảng sai phân lùi trên mảng con:**  
        - Áp dụng Step 2 của **Thuật toán 1** cho mảng $Y_{sub}$ (kích thước $n$).
    5. **Trích xuất hệ số:**
        - Mảng hệ số $C = [c_0, c_1, \dots, c_{n-1}]$ lấy từ hàng cuối cùng của bảng sai phân vừa lập.
- **Output:** Mảng mốc đã chọn $X_{sub}$, mảng hệ số $C$.
- **Optional (Tính giá trị):**
      
    - Đổi biến với mốc kết thúc mới: $t = \frac{x^* - X_{sub}[n-1]}{h}$.
    - Ráp vào công thức $P_{n-1}(t) = c_0 + \sum_{k=1}^{n-1} \frac{c_k}{k!} \prod_{j=0}^{k-1} (t+j)$.
        
### Ví dụ thuật toán 1: Nội suy Newton lùi mốc cách đều
Cho bảng dữ liệu gồm 5 mốc nội suy ($n = 4$):

|**xi​**|**1.0**|**1.2**|**1.4**|**1.6**|**1.8**|
|---|---|---|---|---|---|
|**$y_i$**|1.00|1.28|1.76|2.48|3.48|

**Yêu cầu:**
1. Lập đa thức nội suy Newton lùi cho bảng số liệu trên.
2. Tính gần đúng giá trị $f(1.7)$.
#### **Lời giải chi tiết**
**Bước 1: Xác định bước lưới và biến chuẩn hóa $t$**
- Bước lưới: $h = x_1 - x_0 = 1.2 - 1.0 = 0.2$.
- Đặt biến chuẩn hóa $t$ xuất phát từ mốc cuối cùng $x_4 = 1.8$:
    $$t = \frac{x - x_4}{h} = \frac{x - 1.8}{0.2} \text{[cite: 2]}$$
    
**Bước 2: Lập bảng sai phân lùi** Tính các sai phân lùi $\nabla^k y_i$ bằng cách lấy giá trị hiện tại trừ giá trị liền trước ở cột trước đó ($\nabla y_i = y_i - y_{i-1}$):

|**xi​**|**yi​**|**Sai phân cấp 1 (∇y)**|**Sai phân cấp 2 (∇2y)**|**Sai phân cấp 3 (∇3y)**|**Sai phân cấp 4 (∇4y)**|
|---|---|---|---|---|---|
|1.0|1.00|||||
|1.2|1.28|0.28||||
|1.4|1.76|0.48|0.20|||
|1.6|2.48|0.72|0.24|0.04||
|**1.8**|**3.48**|**1.00**|**0.28**|**0.04**|**0.00**|

**Bước 3: Viết đa thức nội suy Newton lùi**
Đa thức nội suy Newton lùi bậc 4 theo biến $t$ có dạng tổng quát:

$$P_4(t) = y_4 + \frac{t}{1!} \nabla y_4 + \frac{t(t+1)}{2!} \nabla^2 y_4 + \frac{t(t+1)(t+2)}{3!} \nabla^3 y_4 + \frac{t(t+1)(t+2)(t+3)}{4!} \nabla^4 y_4$$

Thay các hệ số $C$ trên hàng cuối cùng ($c_0 = 3.48, c_1 = 1.00, c_2 = 0.28, c_3 = 0.04, c_4 = 0.00$) vào công thức:

$$P_4(t) = 3.48 + 1.00 \cdot t + \frac{0.28}{2} \cdot t(t+1) + \frac{0.04}{6} \cdot t(t+1)(t+2) + 0$$

Rút gọn hệ số:
$$P_4(t) = 3.48 + 1.00t + 0.14t(t+1) + \frac{1}{150}t(t+1)(t+2)$$

**Bước 4: Tính gần đúng giá trị $f(1.7)$**
- Tại $x = 1.7$, giá trị của biến $t$ là:
    $$t = \frac{1.7 - 1.8}{0.2} = -0.5$$
    
- Thay $t = -0.5$ vào đa thức $P_4(t)$:
$$f(1.7) \approx P_4(-0.5) = 3.48 + 1.00(-0.5) + 0.14(-0.5)(-0.5 + 1) + \frac{1}{150}(-0.5)(-0.5 + 1)(-0.5 + 2)$$
    
    $$P_4(-0.5) = 3.48 - 0.50 + 0.14(-0.5)(0.5) + \frac{1}{150}(-0.5)(0.5)(1.5)$$
    
    $$P_4(-0.5) = 2.98 - 0.035 - \frac{0.375}{150}$$
    
    $$P_4(-0.5) = 2.945 - 0.0025 = \mathbf{2.9425}$$
    
**Kết luận:** $f(1.7) \approx 2.9425$.