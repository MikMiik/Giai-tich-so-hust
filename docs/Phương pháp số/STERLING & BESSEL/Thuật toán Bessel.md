### Thuật toán: Nội suy trung tâm Bessel

- **Input:** 
    - Bảng dữ liệu mốc cách đều: $X = [x_{-m+1}, \dots, x_0, x_1, \dots, x_m]$, $Y = [y_{-m+1}, \dots, y_0, y_1, \dots, y_m]$ với bước lưới $h = x_{i+1} - x_i$.
    - Bậc đa thức tối đa $n = 2m - 1$ (để đảm bảo số lượng mốc $2m$ là số chẵn, trung tâm nằm giữa $x_0$ và $x_1$).
    - Điểm cần tính giá trị $x^*$.
- **Steps:**  
    1. **Đổi biến số chuẩn hóa:**
        $$t = \frac{x^* - x_0}{h} \implies u = t - \frac{1}{2}$$
        
    2. **Lập bảng sai phân hữu hạn:**  
        - Khởi tạo mảng 2 chiều $\Delta$ kích thước $2m \times 2m$, gán cột đầu tiên $\Delta_{i, 0} = y_i$ (chỉ số dòng chạy từ $-m+1$ đến $m$).
        - Lặp $j = 1, 2, \dots, 2m - 1$ (cấp sai phân):  
            - Lặp $i = -m+1, \dots, m - j$:
                $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$
                
    3. **Trích xuất hệ số Bessel (Tách Chẵn - Lẻ):**
        - **Hệ số phần Chẵn (Trung bình cộng cặp sai phân chẵn):**
            - Cấp 0 ($i = 0$): $C_{\text{chẵn}}[0] = \frac{y_0 + y_1}{2} = \frac{\Delta_{0, 0} + \Delta_{1, 0}}{2}$.
            - Với $i = 1, 2, \dots, m-1$:
                $$C_{\text{chẵn}}[i] = \frac{\Delta_{-i, 2i} + \Delta_{-i+1, 2i}}{2 \cdot (2i)!}$$
                
        - **Hệ số phần Lẻ (Sai phân lẻ trực tiếp trên hàng chính giữa):**  
            - Với $i = 0, 1, \dots, m-1$:
                $$C_{\text{lẻ}}[i] = \frac{\Delta_{-i, 2i+1}}{(2i+1)!}$$
                
    1. **Tính tích lũy hai thành phần độc lập tại $u$:**
        - Khởi tạo giá trị: $P_{\text{chẵn}} = C_{\text{chẵn}}[0]$, $P_{\text{lẻ}} = C_{\text{lẻ}}[0] \cdot u$.
        - Khởi tạo đa thức nền chẵn: $W_{\text{chẵn}} = 1$.
        - Khởi tạo đa thức nền lẻ: $W_{\text{lẻ}} = u$.
        - Lặp $i = 1, 2, \dots, m-1$:  
            - Cập nhật nền:
                $$W_{\text{chẵn}} = W_{\text{chẵn}} \cdot \left(u^2 - \frac{(2i-1)^2}{4}\right)$$
                
            - Cộng dồn phần Chẵn:  
                $$P_{\text{chẵn}} = P_{\text{chẵn}} + C_{\text{chẵn}}[i] \cdot W_{\text{chẵn}}$$
                
            - Cập nhật nền lẻ & cộng dồn phần Lẻ:
                $$W_{\text{lẻ}} = W_{\text{lẻ}} \cdot \left(u^2 - \frac{(2i-1)^2}{4}\right)$$
                $$P_{\text{lẻ}} = P_{\text{lẻ}} + C_{\text{lẻ}}[i] \cdot W_{\text{lẻ}}$$
                
    1. **(Tùy chọn) Tính đạo hàm:**
        - Lấy đạo hàm trực tiếp $P_{\text{chẵn}}'(u)$ và $P_{\text{lẻ}}'(u)$ từ các thành phần đa thức theo $u$.
        - $$f'(x^*) \approx \frac{1}{h} \left( P_{\text{chẵn}}'(u) + P_{\text{lẻ}}'(u) \right)$$
            
- **Output:**
    - Dạng công thức đa thức phân tách: $P(u) = P_{\text{chẵn}}(u) + P_{\text{lẻ}}(u)$.
    - Giá trị xấp xỉ hàm số: $f(x^*) \approx P_{\text{chẵn}} + P_{\text{lẻ}}$.