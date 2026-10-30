**Input:** Số mốc $n \in \mathbb{N}^*, a, b$
**Step:**
1. Đặt $x_c = \frac{a + b}{2}, \quad r = \frac{b - a}{2}$

2. Với mỗi $k = 1, 2, \ldots, n$

$$x_k = x_c - r \cos \left( \frac{2k - 1}{2n} \pi \right)$$

**Output:** $x_1, x_2, \ldots, x_n$


