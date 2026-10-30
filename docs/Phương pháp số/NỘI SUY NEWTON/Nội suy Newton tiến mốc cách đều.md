### Thuật toán 1: Nội suy Newton tiến mốc cách đều (Đầu vào toàn bộ mảng)
- **Input:** $n \in \mathbb{N}$; mảng $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ cách đều.
- **Steps:**
    1. **Tính bước lưới:**
        $$h = x_1 - x_0$$
        
    2. **Lập bảng sai phân tiến:**
        - Khởi tạo mảng 2 chiều $\Delta$ kích thước $(n+1) \times (n+1)$, gán cột đầu tiên: $\Delta[i][0] = y_i$ với $i = 0, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$ (cấp sai phân):
            - Lặp $i = 0, 1, \dots, n-j$:
                $$\Delta[i][j] = \Delta[i+1][j-1] - \Delta[i][j-1]$$
                
    3. **Trích xuất hệ số đa thức:**  
        - Mảng hệ số $C = [c_0, c_1, \dots, c_n]$ với $c_k = \Delta[0][k]$ (lấy hàng đầu tiên của bảng).
- **Output:** Mảng hệ số $C$.
- **Optional (Tính giá trị):** Cho $x$ cần tính:
    - Đổi biến: $t = \frac{x - x_0}{h}$.
        
    - Tính $f(x) \approx P_n(t) = c_0 + \sum_{k=1}^n \frac{c_k}{k!} \prod_{j=0}^{k-1} (t-j)$.
        
    - Tính $f'(x) \approx \frac{1}{h} P'_n(t)$ (bằng cách lấy đạo hàm trực tiếp biểu thức $P_n(t)$ theo $t$).
        
### Thuật toán 2: Nội suy Newton tiến (Tự động chọn mốc tối ưu quanh điểm cần tính)

- **Input:** Mảng dữ liệu lớn $X = [x_0, \dots, x_N], Y = [y_0, \dots, y_N]$ cách đều; điểm cần tính $x^*$.
- **Steps:**  
    1. **Tính bước lưới và số lượng mốc cần thiết:**  
        - $h = x_1 - x_0$.
        - Để đoạn nội suy có độ dài $\approx 1$, số khoảng cần lấy là $K = \text{round}(1/h)$.
        - Số mốc cần chọn: $n = K + 1$.
    2. **Xác định chỉ số mốc bắt đầu (chọn mốc trung tâm):**
          
        - Tính vị trí tương đối của $x^*$ so với toàn bảng: $pos = \lfloor \frac{x^* - x_0}{h} \rfloor$. (Tức là $x^*$ nằm giữa $x_{pos}$ và $x_{pos+1}$).
        - Để $x^*$ nằm ở khoảng giữa đoạn nội suy, chọn chỉ số bắt đầu: $idx = \max(0, pos - \lfloor \frac{n}{2} \rfloor)$.
        - Kiểm tra vượt biên: Nếu $idx + n - 1 > N$, gán lại $idx = N - n + 1$.
    3. **Trích xuất mảng con:**
        - Mảng mốc sử dụng: $X_{sub} = X[idx : idx + n]$.
        - Mảng giá trị tương ứng: $Y_{sub} = Y[idx : idx + n]$.
    4. **Lập bảng sai phân tiến trên mảng con:**  
        - Áp dụng Step 2 của **Thuật toán 1** cho mảng $Y_{sub}$ (kích thước $n$).
    5. **Trích xuất hệ số:**
        - Mảng hệ số $C = [c_0, c_1, \dots, c_{n-1}]$ lấy từ hàng đầu tiên của bảng sai phân mới lập.
- **Output:** Mảng mốc đã chọn $X_{sub}$, mảng hệ số $C$.
- **Optional (Tính giá trị):**
    - Đổi biến với mốc xuất phát mới: $t = \frac{x^* - X_{sub}[0]}{h}$.
    - Ráp vào công thức $P_{n-1}(t)$ tương tự Thuật toán 1.
### **Ví dụ thuật toán 1**

Cho bảng dữ liệu gồm 5 mốc nội suy ($n = 4$):

|**xi​**|**1.0**|**1.2**|**1.4**|**1.6**|**1.8**|
|---|---|---|---|---|---|
|$y_i$|1.00|1.28|1.76|2.48|3.48|
**Yêu cầu:**
1. Lập đa thức nội suy Newton tiến cho bảng số liệu trên.
2. Tính gần đúng giá trị $f(1.1)$.
### **Lời giải chi tiết**

**Bước 1: Xác định bước lưới và biến chuẩn hóa $t$**
- Các mốc $x_i$ cách đều nhau một khoảng (bước lưới) $h = x_1 - x_0 = 1.2 - 1.0 = 0.2$.
- Đặt biến chuẩn hóa $t$ xuất phát từ mốc đầu tiên $x_0 = 1.0$:
    
$$t = \frac{x - x_0}{h} = \frac{x - 1.0}{0.2} \text{[cite: 2]}$$
    

**Bước 2: Lập bảng sai phân tiến** Ta tính các sai phân tiến $\Delta^k y_i$ bằng cách lấy giá trị dưới trừ giá trị trên liền kề ở cột trước đó ($\Delta y_i = y_{i+1} - y_i$).

|**xi​**|**yi​**|**Sai phân cấp 1 (Δy)**|**Sai phân cấp 2 (Δ2y)**|**Sai phân cấp 3 (Δ3y)**|**Sai phân cấp 4 (Δ4y)**|
|---|---|---|---|---|---|
|**1.0**|$\mathbf{1.00}$|||||
|1.2|1.28|$\mathbf{0.28}$||||
|1.4|1.76|0.48|$\mathbf{0.20}$|||
|1.6|2.48|0.72|0.24|$\mathbf{0.04}$||
|1.8|3.48|1.00|0.28|0.04|$\mathbf{0.00}$|

**Bước 3: Viết đa thức nội suy Newton tiến**

Đa thức nội suy Newton tiến bậc 4 theo biến $t$ có dạng tổng quát:


$$P_4(t) = y_0 + \frac{t}{1!} \Delta y_0 + \frac{t(t-1)}{2!} \Delta^2 y_0 + \frac{t(t-1)(t-2)}{3!} \Delta^3 y_0 + \frac{t(t-1)(t-2)(t-3)}{4!} \Delta^4 y_0 \text{}$$

Thay các hệ số $C$ trên đường chéo vào công thức, ta có:

$$P_4(t) = 1.00 + 0.28 \cdot t + \frac{0.20}{2} \cdot t(t-1) + \frac{0.04}{6} \cdot t(t-1)(t-2) + 0 \text{}$$

Rút gọn các hệ số:

  

$$P_4(t) = 1.00 + 0.28t + 0.10t(t-1) + \frac{1}{150}t(t-1)(t-2)$$

_(Nếu cần biểu diễn dạng tường minh theo $x$, ta thay $t = \frac{x - 1.0}{0.2}$ vào biểu thức trên)._

  

**Bước 4: Tính gần đúng giá trị $f(1.1)$**
- Tại $x = 1.1$, giá trị của biến $t$ là:
    
    $$t = \frac{1.1 - 1.0}{0.2} = 0.5 \text{}$$
    
- Thay $t = 0.5$ vào đa thức $P_4(t)$ vừa tìm được:
$$f(1.1) \approx P_4(0.5) = 1.00 + 0.28(0.5) + 0.10(0.5)(0.5 - 1) + \frac{1}{150}(0.5)(0.5 - 1)(0.5 - 2)$$
    
    $$P_4(0.5) = 1.00 + 0.14 + 0.10(0.5)(-0.5) + \frac{1}{150}(0.5)(-0.5)(-1.5)$$
    $$P_4(0.5) = 1.00 + 0.14 - 0.025 + \frac{0.375}{150}$$
    $$P_4(0.5) = 1.115 + 0.0025 = \mathbf{1.1175}$$
    

**Kết luận:** $f(1.1) \approx 1.1175$.


### Ví dụ thuật toán 2

Cho bảng dữ liệu lớn gồm 9 mốc nội suy:

|**i**|**0**|**1**|**2**|**3**|**4**|**5**|**6**|**7**|**8**|
|---|---|---|---|---|---|---|---|---|---|
|$x_i$|0.00|0.25|0.50|0.75|1.00|1.25|1.50|1.75|2.00|
|$y_i$|0.0|1.0|2.0|4.0|7.0|11.0|16.0|22.0|29.0|

**Yêu cầu:** Tính giá trị gần đúng của $f(1.1)$ bằng thuật toán tự động chọn mốc nội suy tối ưu (giới hạn độ dài đoạn nội suy $\approx 1$).
### **Lời giải chi tiết**

**Bước 1: Tính bước lưới và số lượng mốc cần thiết**
- Bước lưới $h = x_1 - x_0 = 0.25$.
- Để đoạn nội suy có độ dài xấp xỉ 1 nhằm tối ưu sai số, số khoảng cần lấy là:
    $$K = \text{round}\left(\frac{1}{0.25}\right) = 4 \text{ khoảng}$$
    
- Số mốc nội suy cần chọn là: $n = K + 1 = 5$ mốc.

**Bước 2: Xác định chỉ số mốc bắt đầu (chọn mốc trung tâm)**
- Vị trí tương đối của $x^* = 1.1$ so với toàn bảng:
    $$pos = \left\lfloor \frac{1.1 - 0.00}{0.25} \right\rfloor = \lfloor 4.4 \rfloor = 4$$
    
    _(Nghĩa là $1.1$ nằm kẹp giữa $x_4 = 1.00$ và $x_5 = 1.25$)._
- Chọn chỉ số bắt đầu để $x^*$ nằm ở giữa mảng con:
$$idx = \max\left(0, pos - \left\lfloor \frac{n}{2} \right\rfloor\right) = \max\left(0, 4 - \lfloor 2.5 \rfloor\right) = 4 - 2 = 2$$
    
- Kiểm tra vượt biên: $idx + n - 1 = 2 + 5 - 1 = 6$. Kích thước bảng là 8, thoả mãn không bị tràn mảng.

**Bước 3: Trích xuất mảng con**
Ta lấy 5 mốc bắt đầu từ chỉ số $idx = 2$:
- $X_{sub} = [0.50, 0.75, 1.00, 1.25, 1.50]$
- $Y_{sub} = [2.0, 4.0, 7.0, 11.0, 16.0]$

**Bước 4: Lập bảng sai phân tiến trên mảng con**

|**xi​**|**yi​**|**Δy**|**Δ2y**|**Δ3y**|**Δ4y**|
|---|---|---|---|---|---|
|**0.50**|$\mathbf{2.0}$|||||
|0.75|4.0|$\mathbf{2.0}$||||
|1.00|7.0|3.0|$\mathbf{1.0}$|||
|1.25|11.0|4.0|1.0|$\mathbf{0.0}$||
|1.50|16.0|5.0|1.0|0.0|$\mathbf{0.0}$|

**Bước 5: Viết đa thức và tính $f(1.1)$**
- Đổi biến $t$ xuất phát từ mốc đầu tiên của mảng con ($x_{sub}[0] = 0.50$):
    
$$t = \frac{x^* - 0.50}{0.25} = \frac{1.1 - 0.50}{0.25} = 2.4$$
    
- Áp dụng công thức Newton tiến với các hệ số $C$ thu được:
    
$$P_4(t) = c_0 + \frac{t}{1!}c_1 + \frac{t(t-1)}{2!}c_2 + \frac{t(t-1)(t-2)}{3!}c_3 + \frac{t(t-1)(t-2)(t-3)}{4!}c_4$$
    
- Thay số (với $c_3 = 0, c_4 = 0$):
    
$$P_4(2.4) = 2.0 + 2.0(2.4) + \frac{1.0}{2}(2.4)(2.4 - 1) + 0 + 0$$
    
$$P_4(2.4) = 2.0 + 4.8 + 0.5(2.4)(1.4)$$
    
$$P_4(2.4) = 6.8 + 1.68 = \mathbf{8.48}$$