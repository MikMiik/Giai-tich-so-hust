
- **Input:** Bậc của đa thức thương $m$ (với các hệ số $b_m, b_{m-1}, \dots, b_1$); hằng số $c \in \mathbb{R}$.
    
- **Steps:**
    
    1. Đặt dãy đầu vào bổ sung số 0 ở cuối: $B = [b_m, b_{m-1}, \dots, b_1, 0]$.
        
    2. Đặt $a_m = b_m$.
        
    3. Lặp $i = m - 1$ lùi về $0$:
        
        $$a_i = B[i] - c \cdot a_{i+1}$$
        
- **Output:** Dãy hệ số của đa thức tích: $a_m, a_{m-1}, \dots, a_0$.