
### 1. Đặt vấn đề và mục đích

- Khi điểm cần tính $x$ nằm ở **đầu bảng** dữ liệu mốc cách đều, ta dùng **Newton tiến**.
- Khi điểm $x$ nằm ở **cuối bảng**, ta dùng **Newton lùi**.
- Khi điểm $x$ nằm ở **khoảng giữa (trung tâm) của bảng mốc**, để đạt độ chính xác cao nhất và giảm thiểu sai số, người ta sử dụng các **công thức nội suy trung tâm**, tiêu biểu là **công thức Gauss I và Gauss II**.
### 2. Thiết lập hệ mốc trong nội suy trung tâm

Giả sử ta chọn một mốc trung tâm là $x_k$ (mốc gần với $x$ nhất). Tập hợp sử dụng gồm **$2n + 1$ mốc cách đều** đối xứng xung quanh $x_k$:

$$x_{k-n}, \dots, x_{k-1}, x_k, x_{k+1}, \dots, x_{k+n}$$

với bước nhảy $h = x_{i+1} - x_i$.

Thứ tự đưa các mốc vào đa thức nội suy sẽ quyết định công thức Gauss I hay Gauss II:
#### a) Công thức Gauss I (Gauss tiến)

- **Thứ tự lấy mốc** (mốc trung tâm $x_k$, sau đó luân phiên sang phải rồi sang trái):
    $$x_k \longrightarrow x_{k+1} \longrightarrow x_{k-1} \longrightarrow x_{k+2} \longrightarrow x_{k-2} \longrightarrow \dots \longrightarrow x_{k+n} \longrightarrow x_{k-n}$$
- Thường được ưu tiên dùng khi điểm $x$ nằm ở nửa khoảng bên phải của mốc trung tâm ($x_k \le x \le x_{k+1}$).
    
#### b) Công thức Gauss II (Gauss lùi)

- **Thứ tự lấy mốc** (mốc trung tâm $x_k$, sau đó luân phiên sang trái rồi sang phải):
    $$x_k \longrightarrow x_{k-1} \longrightarrow x_{k+1} \longrightarrow x_{k-2} \longrightarrow x_{k+2} \longrightarrow \dots \longrightarrow x_{k-n} \longrightarrow x_{k+n}$$
    
-  Thường được ưu tiên dùng khi điểm $x$ nằm ở nửa khoảng bên trái của mốc trung tâm ($x_{k-1} \le x \le x_k$).
    
### 3. Dạng công thức đa thức nội suy Gauss I theo tỷ sai phân

Từ thứ tự duyệt mốc của Gauss I, đa thức nội suy $P_{GI}(x)$ được viết dưới dạng Newton thông qua các tỷ sai phân:
$$\begin{aligned} P_{GI}(x) = y_k &+ f[x_k, x_{k+1}](x - x_k) \\ &+ f[x_{k-1}, x_k, x_{k+1}](x - x_k)(x - x_{k+1}) \\ &+ f[x_{k-1}, x_k, x_{k+1}, x_{k+2}](x - x_k)(x - x_{k+1})(x - x_{k-1}) \\ &+ \dots \\ &+ f[x_k, x_{k+1}, x_{k-1}, \dots, x_{k+n}, x_{k-n}](x - x_k)(x - x_{k+1})\dots(x - x_{k+n}) \end{aligned}$$

> **Ghi chú về tính chất đối xứng:** Trong ảnh có lưu ý tính chất quan trọng của tỷ sai phân: _Tỷ sai phân là hàm đối xứng với các đối số_. Với mọi hoán vị $\sigma$ của tập chỉ số, ta luôn có:
> 
$$f[x_k, x_{k+1}, x_{k-1}, \dots] = f[x_{\sigma(k)}, x_{\sigma(k+1)}, \dots]$$
> 
> Do đó, khi tính toán ta chỉ cần lập bảng sai phân / tỷ sai phân thông thường mà không phụ thuộc vào thứ tự viết các mốc bên trong dấu ngoặc vuông.
> 
>   
### 4. Đổi biến số sang sai phân hữu hạn (dạng tính toán thường gặp)

Khi chuyển sang sai phân hữu hạn với biến phụ $t = \frac{x - x_k}{h}$ (suy ra $x - x_k = th$):

- $x - x_{k+1} = (t - 1)h$
    
- $x - x_{k-1} = (t + 1)h$
    
- $x - x_{k+2} = (t - 2)h$
    
- ...
    

Công thức Gauss I biểu diễn qua sai phân hữu hạn tiến $\Delta$ có dạng chuẩn:

$$P(t) = y_k + t \Delta y_k + \frac{t(t-1)}{2!} \Delta^2 y_{k-1} + \frac{(t+1)t(t-1)}{3!} \Delta^3 y_{k-1} + \frac{(t+1)t(t-1)(t-2)}{4!} \Delta^4 y_{k-2} + \dots$$

### 5. Tính đạo hàm xấp xỉ

$$f(x) \approx P(t)$$

Áp dụng quy tắc đạo hàm hàm hợp với $t = \frac{x - x_k}{h}$ (dẫn tới $t'(x) = \frac{1}{h}$):

$$f'(x) \approx P'(t) \cdot t'(x) = \frac{P'(t)}{h}$$
