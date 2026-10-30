Phương pháp **Nội suy ngược** (Inverse Interpolation) dùng để giải phương trình $f(x) = \bar{y}$ khi hàm $y = f(x)$ chỉ được cho dưới dạng bảng điểm $\{(x_i, y_i), i = \overline{0, n}\}$.
Nội dung phương pháp gồm 2 cách tiếp cận chính tùy thuộc vào điều kiện của dữ liệu:
### 1. Phương pháp hàm ngược

- **Điều kiện áp dụng:** Hàm $y = f(x)$ đơn điệu (có hàm ngược $x = f^{-1}(y)$) trên khoảng đang xét, các mốc $x_i$ **không nhất thiết phải cách đều**.
- **Cách thực hiện:**
    1. Tráo đổi vai trò của $x$ và $y$: Xem $y_i$ là các mốc nội suy và $x_i$ là giá trị hàm số tương ứng.
    2. Lập đa thức nội suy $x = P(y)$ (dùng Lagrange hoặc Newton mốc bất kỳ) cho tập điểm $\{(y_i, x_i)\}_{i=\overline{0,n}}$.
    3. Thay giá trị $\bar{y}$ vào đa thức vừa lập để tìm nghiệm gần đúng: $\bar{x} = P(\bar{y})$.
### 2. Phương pháp lặp (Dùng cho mốc $x_i$ cách đều)

- **Điều kiện áp dụng:** Các mốc $x_i$ cách đều với bước lưới $h$, nghiệm thuộc khoảng cách ly $(x_k, x_{k+1})$.
- **Cách thực hiện:** Biến đổi phương trình nội suy Newton về dạng lặp $t = \varphi(t)$ với biến chuẩn hóa $t = \frac{x - x_k}{h}$:
#### a. Xuất phát từ $x_k$ (dùng Newton tiến)

- **Công thức lặp:**
    $$t = \frac{\bar{y} - y_k}{\Delta y_k} - \frac{1}{\Delta y_k} \left[ \frac{\Delta^2 y_k}{2!} t(t-1) + \dots \right] = \varphi(t) \quad $$
    
- **Sơ đồ lặp:**
    1. Xấp xỉ đầu: $t_0 = \frac{\bar{y} - y_k}{\Delta y_k}$.
    2. Lặp: $t_{j+1} = \varphi(t_j)$ cho đến khi đạt độ chính xác yêu cầu.
    3. Tính nghiệm: $\bar{x} = x_k + t_{j+1} \cdot h$.

#### b. Xuất phát từ $x_{k+1}$ (dùng Newton lùi)
- **Công thức lặp:**
    $$t = \frac{\bar{y} - y_{k+1}}{\nabla y_{k+1}} - \frac{1}{\nabla y_{k+1}} \left[ \frac{\nabla^2 y_{k+1}}{2!} t(t+1) + \dots \right] = \psi(t) \quad \text{[cite: 9]}$$
    
- **Sơ đồ lặp:**
    1. Xấp xỉ đầu: $t_0 = \frac{\bar{y} - y_{k+1}}{\nabla y_{k+1}}$.
        
    2. Lặp: $t_{j+1} = \psi(t_j)$.
        
    3. Tính nghiệm: $\bar{x} = x_{k+1} + t_{j+1} \cdot h$[cite: 9].
        
### Tóm tắt lựa chọn

- Khi các giá trị $y_i$ tăng/giảm đơn điệu và mốc $x_i$ không cách đều: **Dùng phương pháp hàm ngược**.
- Khi các mốc $x_i$ cách đều và cần độ chính xác cao bằng phương pháp tiến/lùi: **Dùng phương pháp lặp**.