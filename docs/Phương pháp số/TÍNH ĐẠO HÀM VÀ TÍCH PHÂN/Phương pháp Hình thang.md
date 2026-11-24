##### Thuật toán 2: Phương pháp Hình thang
- **Input:**
    - Hàm $f(x)$, đoạn $[a, b]$, sai số $\varepsilon > 0$.
- **Steps:**
    1. **Khoảng chia $n$:**
        - Tính $M_2 = \max_{x \in [a, b]} \vert{}f''(x)\vert{}$.
        - Xác định $n$: $n = \left\lceil \sqrt{\frac{(b-a)^3 M_2}{12\varepsilon}} \right\rceil$.
    2. **Tính bước lưới:** $h = \frac{b-a}{n}$.
    3. **Khởi tạo:**
        - $S = \frac{f(a) + f(b)}{2}$.
    4. **Cộng dồn các mốc trung gian:**
        - Lặp $i = 1, 2, \dots, n-1$:
            $$S = S + f(a + i \cdot h)$$
            
    5. **Tính kết quả và sai số lý thuyết:**
        - Giá trị tích phân: $I \approx h \cdot S$.
        - Sai số: $\vert{}R_n\vert{} \le \frac{(b-a)^3}{12n^2} M_2$.
            
- **Output:** $I$ và $\vert{}R_n\vert{}$.
