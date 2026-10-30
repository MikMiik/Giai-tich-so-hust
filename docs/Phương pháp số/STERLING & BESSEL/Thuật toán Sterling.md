
- **Input:**
    - Bảng dữ liệu mốc cách đều: $X = [x_{-m}, \dots, x_0, \dots, x_m]$, $Y = [y_{-m}, \dots, y_0, \dots, y_m]$ với bước lưới $h = x_{i+1} - x_i$.
    - Bậc đa thức tối đa $n = 2m$ (để đảm bảo số lượng mốc $2m+1$ là số lẻ, chọn duy nhất $1$ mốc trung tâm $x_0$).
    - Điểm cần tính giá trị $x^*$.
- **Steps:**
    1. **Đổi biến số:**
        $$t = \frac{x^* - x_0}{h}$$
        
    2. **Lập bảng sai phân hữu hạn:**
        - Khởi tạo mảng 2 chiều $\Delta$ kích thước $(2m+1) \times (2m+1)$, gán cột đầu tiên $\Delta_{i, 0} = y_i$ (quy ước chỉ số dòng chạy từ $-m$ đến $m$).
        - Lặp $j = 1, 2, \dots, 2m$ (cấp sai phân):
            - Lặp $i = -m, \dots, m - j$:
                $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1}$$
                
    3. **Trích xuất hệ số Stirling (Tách Chẵn - Lẻ):**
        - Hệ số bậc 0: $C_{\text{chẵn}}[0] = y_0 = \Delta_{0, 0}$.
        - Lặp $i = 1, 2, \dots, m$:  
            - Hệ số phần Lẻ (Trung bình cộng cặp sai phân lẻ):
                $$C_{\text{lẻ}}[i] = \frac{\Delta_{-i+1, 2i-1} + \Delta_{-i, 2i-1}}{2 \cdot (2i-1)!}$$
                
            - Hệ số phần Chẵn (Sai phân chẵn trên hàng trung tâm):
                $$C_{\text{chẵn}}[i] = \frac{\Delta_{-i, 2i}}{(2i)!}$$
                
    1. **Tính tích lũy hai thành phần độc lập tại $t$:**
        - Khởi tạo giá trị: $P_{\text{chẵn}} = C_{\text{chẵn}}[0]$, và $P_{\text{lẻ}} = 0$.
        - Khởi tạo đa thức nền: $W = 1$.
        - Lặp $i = 1, 2, \dots, m$:
            - Nếu $i > 1$, cập nhật nền: $W = W \cdot (t^2 - (i-1)^2)$
            - Cộng dồn phần Lẻ:$$P_{\text{lẻ}} = P_{\text{lẻ}} + C_{\text{lẻ}}[i] \cdot W \cdot t$$
                
            - Cộng dồn phần Chẵn:
                $$P_{\text{chẵn}} = P_{\text{chẵn}} + C_{\text{chẵn}}[i] \cdot W \cdot t^2$$
                
    1. **(Tùy chọn) Tính đạo hàm:**
        - Lấy đạo hàm trực tiếp $P_{\text{chẵn}}'(t)$ và $P_{\text{lẻ}}'(t)$ từ các thành phần đa thức.
        - $$f'(x^*) \approx \frac{1}{h} \left( P_{\text{chẵn}}'(t) + P_{\text{lẻ}}'(t) \right)$$
            
- **Output:**  
    - Dạng công thức đa thức phân tách: $P(t) = P_{\text{chẵn}}(t) + P_{\text{lẻ}}(t)$.
    - Giá trị xấp xỉ hàm số: $f(x^*) \approx P_{\text{chẵn}} + P_{\text{lẻ}}$.