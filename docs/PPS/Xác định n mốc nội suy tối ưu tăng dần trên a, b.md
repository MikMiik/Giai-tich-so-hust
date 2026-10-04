- **Đầu vào:** Số mốc $n \in \mathbb{N}^*$; hai đầu mút $a, b$ ($a < b$).
    
- **Các bước thực hiện:**
    1. Đặt $x_c = \frac{a+b}{2}$, $r = \frac{b-a}{2}$.
    2. Với mỗi $k = 1, 2, \dots, n$:$$x_k = x_c - r \cos\left(\frac{2k-1}{2n}\pi\right)$$
- **Đầu ra:** Dãy $n$ mốc đã sắp xếp: $x_1 < x_2 < \dots < x_n$.