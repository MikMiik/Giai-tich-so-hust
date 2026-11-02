- **Input:** Bậc đa thức $n \in \mathbb{N}$; dãy hệ số $a_n, a_{n-1}, \dots, a_0$; cấp đạo hàm $k \in \mathbb{N}$ ($0 \le k \le n$); điểm $c \in \mathbb{R}$.
- **Steps:**
  1. Đặt dãy hệ số $b_j = a_j$ với mọi $j = 0, 1, \dots, n$ (trong đó $b_j$ tương ứng với hệ số của $x^j$, tức $b_n = a_n, b_0 = a_0$).
  2. Lặp $m = 0, 1, \dots, k$:
     Lặp $j = n - 1, n - 2, \dots, m$:
     $$b_j = b_{j+1} \cdot c + b_j$$
  3. Tính đạo hàm:
     $$P_n^{(k)}(c) = k! \cdot b_k$$
- **Output:** Giá trị đạo hàm $P_n^{(k)}(c)$.
