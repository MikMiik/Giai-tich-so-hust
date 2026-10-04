
- **Input:** Bậc đa thức $n \in \mathbb{N}$; dãy hệ số $a_n, a_{n-1}, \dots, a_0$; cấp đạo hàm $k \in \mathbb{N}$ ($0 \le k \le n$); $c \in \mathbb{R}$.
- **Steps:**
    1. Đặt dãy hệ số $b_j = a_j$ với mọi $j = 0, 1, \dots, n$.
    2. Lặp $m = 1, 2, \dots, k$:
        Lặp $j = n - 1, n - 2, \dots, m - 1$:$$b_j = b_{j+1} \cdot c + b_j$$
    3. Tính đạo hàm:$$P_n^{(k)}(c) = k! \cdot b_{k-1}$$
- **Output:** Giá trị $P_n^{(k)}(c)$.