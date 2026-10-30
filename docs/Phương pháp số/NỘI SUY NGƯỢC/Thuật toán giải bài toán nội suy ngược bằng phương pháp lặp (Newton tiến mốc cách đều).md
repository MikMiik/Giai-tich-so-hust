
- **Input:** 
    - Giá trị cần tìm nghiệm: $\bar{y} \in \mathbb{R}$.
    - Độ chính xác yêu cầu: $\varepsilon > 0$.
    - Bảng dữ liệu mốc cách đều: $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với bước lưới $h = x_1 - x_0$, khoảng cách ly nghiệm chứa $\bar{y}$ là $[x_k, x_{k+1}]$.
- **Steps:**
    1. **Lập bảng sai phân tiến $\Delta$ (Kích thước $(n+1) \times (n+1)$):**
        - Gán $\Delta_{i, 0} = y_i$ với mọi $i = 0, 1, \dots, n$.
        - Lặp $j = 1, 2, \dots, n$:
            - Lặp $i = 0, 1, \dots, n - j$:
                $$\Delta_{i, j} = \Delta_{i+1, j-1} - \Delta_{i, j-1} \quad \text{[cite: 3]}$$
                
    2. **Trích xuất mảng sai phân xuất phát từ $x_k$:**
        - Trích xuất các giá trị $\Delta^j y_k = \Delta_{k, j}$ với $j = 1, 2, \dots, n-k$.
    3. **Khởi tạo quá trình lặp:** 
        - Giá trị lặp ban đầu (bỏ qua các sai phân cấp cao):
            $$t_0 = \frac{\bar{y} - y_k}{\Delta y_k} \quad \text{[cite: 7]}$$
            
        - Đặt $j = 0$.
    4. **Thực hiện vòng lặp tìm biến chuẩn hóa $t$:**  
        - Lặp:
            - Tính giá trị đa thức phụ $S(t_j)$ từ sai phân cấp 2 trở lên bằng sơ đồ Horner hoặc nhân dồn:
                $$S(t_j) = \sum_{m=2}^{n-k} \frac{\Delta^m y_k}{m!} \prod_{r=0}^{m-1} (t_j - r) \quad \text{[cite: 7]}$$
                
            - Cập nhật xấp xỉ mới:
                $$t_{j+1} = \frac{\bar{y} - y_k - S(t_j)}{\Delta y_k} \quad \text{[cite: 7]}$$
                
            - Nếu $\vert{}t_{j+1} - t_j\vert{} < \frac{\varepsilon}{h}$: Dừng vòng lặp.
            - Ngược lại: Gán $j = j + 1$.
    1. **Tính nghiệm gần đúng $\bar{x}$:**
        $$\bar{x} = x_k + t_{j+1} \cdot h \quad \text{[cite: 7]}$$
        
- **Output:** Giá trị nghiệm gần đúng $\bar{x} \approx f^{-1}(\bar{y})$.