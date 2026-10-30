
- **Input:** Bậc đa thức $n \in \mathbb{N}^*$; dãy hệ số của đa thức bị chia $a_n, a_{n-1}, \dots, a_0$; hằng số $c \in \mathbb{R}$.
- **Steps:**
    1. Đặt $b_n = a_n$.
    2. Lặp $i = n - 1, n - 2, \dots, 1$:$$b_i = b_{i+1} \cdot c + a_i$$
    3. Tính số dư:$$r = b_1 \cdot c + a_0$$
- **Output:**
    - Đa thức thương bậc $n-1$: $Q(x) = b_n x^{n-1} + b_{n-1} x^{n-2} + \dots + b_1$.
    - Phần dư: $r$.