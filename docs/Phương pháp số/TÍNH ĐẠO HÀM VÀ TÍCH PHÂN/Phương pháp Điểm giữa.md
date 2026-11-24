
- **Input:**
    - Hàm $f(x)$, đoạn $[a, b]$, sai số: $\varepsilon > 0$.
- **Steps:**
    1. **Khoảng chia $n$:**
        - Tính đạo hàm cấp 2 và $M_2 = \max_{x \in [a, b]} \vert{}f''(x)\vert{}$.
        - Tính $n$ thỏa: $n = \left\lceil \sqrt{\frac{(b-a)^3 M_2}{24\varepsilon}} \right\rceil$.
    2. **Tính bước lưới:** $h = \frac{b-a}{n}$.
    3. **Khởi tạo tổng:** $S = 0$.
    4. **Cộng dồn giá trị tại các mốc điểm giữa:**
        - Lặp $i = 0, 1, \dots, n-1$:$$S = S + f\left(a + (i + 0.5)h\right)$$
    5. **Tính kết quả và sai số lý thuyết:**
        - Giá trị tích phân: $I \approx h \cdot S$.
        - Sai số: $\vert{}R_n\vert{} \le \frac{(b-a)^3}{24n^2} M_2$.
            
- **Output:**  $I$ và $\vert{}R_n\vert{}$.

