##### Thuật toán 3: Phương pháp Simpson (Simpson's 1/3 Rule)

- **Input:**
    - Hàm $f(x)$, đoạn $[a, b]$, sai số $\varepsilon > 0$.
- **Steps:**
    1. **Khoảng chia chẵn $n$:**
        - Tính đạo hàm cấp 4 và $M_4 = \max_{x \in [a, b]} \vert{}f^{(4)}(x)\vert{}$.
            
        - Xác định $n$: $n = \left\lceil \sqrt[4]{\frac{(b-a)^5 M_4}{180\varepsilon}} \right\rceil$.
            
        - Nếu $n$ là số lẻ, gán $n = n + 1$
            
    2. **Tính bước lưới:** $h = \frac{b-a}{n}$.
        
    3. **Khởi tạo :**
        - $S_{\text{lẻ}} = 0$
        - $S_{\text{chẵn}} = 0$
    4. **Phân loại mốc và cộng dồn:**
        - Lặp $i = 1, 2, \dots, n-1$:
            - Tính mốc: $x_i = a + i \cdot h$
            - Nếu $i$ lẻ: $S_{\text{lẻ}} = S_{\text{lẻ}} + f(x_i)$
            - Nếu $i$ chẵn: $S_{\text{chẵn}} = S_{\text{chẵn}} + f(x_i)$
    5. **Tính kết quả và sai số lý thuyết:*
        - Giá trị tích phân: $I \approx \frac{h}{3} \Big[ f(a) + f(b) + 4S_{\text{lẻ}} + 2S_{\text{chẵn}} \Big]$.
        - Sai số: $\vert{}R_n\vert{} \le \frac{(b-a)^5}{180n^4} M_4$.
- **Output:** $I$ và $\vert{}R_n\vert{}$.