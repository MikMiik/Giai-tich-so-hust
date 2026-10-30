Câu 1:

Bộ điểm $\{x_i, y_i\}_{i=0, n}, \quad x_i \neq x_j$

$P_n(x) = a_0 + a_1 x + a_2 x^2 + \ldots + a_n x^n$

$P_n(x_i) = y_i \iff \begin{cases} a_0 + a_1 x_0 + a_2 x_0^2 + \ldots + a_n x_0^n = y_0 \\ a_0 + a_1 x_1 + a_2 x_1^2 + \ldots + a_n x_1^n = y_1 \\ \quad \vdots \\ a_0 + a_1 x_n + a_2 x_n^2 + \ldots + a_n x_n^n = y_n \end{cases}$

$$V_n = \begin{vmatrix} 1 & x_0 & x_0^2 & \ldots & x_0^n \\ 1 & x_1 & x_1^2 & \ldots & x_1^n \\ \vdots & \vdots & \vdots & \ddots & \vdots \\ 1 & x_n & x_n^2 & \ldots & x_n^n \end{vmatrix}$$

Biến đổi sơ cấp trên cột: $C_k - x_0 C_{k-1}$ sau đó khử theo dòng 1:

$$V_n = \begin{vmatrix} (x_1 - x_0) & x_1(x_1 - x_0) & \ldots & x_1^{n-1}(x_1 - x_0) \\ \vdots & \vdots & \ddots & \vdots \\ (x_n - x_0) & x_n(x_n - x_0) & \ldots & x_n^{n-1}(x_n - x_0) \end{vmatrix}$$

$$= (x_1 - x_0)(x_2 - x_0) \ldots (x_n - x_0) \cdot V_{n-1}(x_1, \ldots, x_n)$$

Quy nạp: $V_n = \prod_{0 \le j < i \le n} (x_i - x_j) \neq 0$
$\to$ Hệ có nghiệm duy nhất và đa thức nội suy tồn tại duy nhất.

---
**Bài 2**:

a) $T_n(x) = \cos(n \cdot \arccos x)$

Với $x \in [-1, 1]$, đặt $x = \cos \theta \quad (\theta = \arccos x)$

$T_n(x) = \cos(n\theta) \quad (n \ge 0)$

$\cos((n+1)\theta) + \cos((n-1)\theta) = 2 \cos \theta \cos(n\theta)$

$\Rightarrow T_{n+1}(x) + T_{n-1}(x) = 2x T_n(x)$

$\Rightarrow T_{n+1}(x) = 2x T_n(x) - T_{n-1}(x)$
b) **Cơ sở quy nạp:**

Với $n = 1: T_1(x) = x$ có bậc 1 và hệ số cao nhất $a_1 = 1 = 2^{1-1}$
Với $n = 2: T_2(x) = 2x^2 - 1$ có bậc 2, $a_2 = 2 = 2^{2-1}$ (đúng)
**Quy nạp:** Giả sử khẳng định đúng $n \ge 2$:
$T_n(x)$ có bậc $n$ với số hạng bậc cao nhất là $2^{n-1} x^n$
$T_{n-1}(x)$ có bậc $n-1$
Theo công thức truy hồi: $T_{n+1}(x) = 2x T_n(x) - T_{n-1}(x)$
Số hạng có bậc cao nhất của $T_{n+1}(x)$ từ phép nhân $2x \cdot T_n(x)$:
$2x \cdot (2^{n-1} x^n) = 2^n x^{n+1}$
Do đó, $T_{n+1}(x)$ là đa thức bậc $n+1$ với hệ số cao nhất là:
$a_{n+1} = 2^{(n+1)-1} = 2^n$
Vậy khẳng định đúng $\forall n \ge 1$.

---
**Bài 3**
a) Đa thức Chebyshev $T_n(t) = \cos(n \cdot \arccos t), \quad t \in [-1, 1]$
Trên đoạn tổng quát $x \in [a, b]$, ta tìm 1 ánh xạ song ánh tuyến tính:
$t = \varphi(x) = C_1 x + C_2$

Cần: $\begin{cases} \varphi(a) = -1 \\ \varphi(b) = 1 \end{cases}$

$$\begin{cases} C_1 a + C_2 = -1 \quad (1) \\ C_1 b + C_2 = 1 \end{cases}$$

$\Rightarrow C_1(b - a) = 2 \Rightarrow C_1 = \frac{2}{b - a}$

Thay vào (1): $\frac{2a}{b - a} + C_2 = -1$

$\Rightarrow C_2 = -1 - \frac{2a}{b - a} = -\frac{b + a}{b - a}$

$\Rightarrow t = C_1 x + C_2 = \frac{2x}{b - a} - \frac{b + a}{b - a} = \frac{2x - (b + a)}{b - a}$

$\Rightarrow x = \frac{a + b}{2} + \frac{b - a}{2} t$

$$t_i = \cos \left( \frac{2i + 1}{2n + 2} \pi \right), \quad i = 0, 1, \ldots, n$$

$\to$ Các mốc tối ưu $x_i$ trên $[a, b]$:

$$x_i = \frac{a + b}{2} + \frac{b - a}{2} \cos \left( \frac{2i + 1}{2n + 2} \pi \right), \quad i = 0, 1, \ldots, n$$

b) 
**Input:** Số mốc $n \in \mathbb{N}^*, a, b$

**Step:**
1. $x_c = \frac{a + b}{2}, \quad r = \frac{b - a}{2}$

2. Với mỗi $k = 1, 2, \ldots, n$

$$x_k = x_c - r \cos \left( \frac{2k - 1}{2n} \pi \right)$$

**Output:** $x_1, x_2, \ldots, x_n$

c)
* **Với $n = 9, a = -1, b = 1$:**

$$x_k = -\cos \left( \frac{2k - 1}{18} \pi \right) \quad (k = 1 \ldots 9)$$
$$x_1 = -\cos \left( \frac{\pi}{18} \right)$$
$$x_2 = -\cos \left( \frac{3\pi}{18} \right)$$
$$\vdots$$
$$x_8 = -x_2$$
$$x_9 = -x_1$$
* **Với $n = 12, a = 3, b = 6$:**
$$x_1 = 4.5 - 1.5 \cos \left( \frac{\pi}{24} \right)$$
$$x_2 = 4.5 - 1.5 \cos \left( \frac{3\pi}{24} \right)$$
$$\vdots$$
$$x_{12} = 4.5 - 1.5 \cos \left( \frac{23\pi}{24} \right)$$---

**Bài 4**
**a)**
- **Input:** Bậc của đa thức $n \in \mathbb{N}$, hệ số $a_n, a_{n-1}, \ldots, a_0$; $c \in \mathbb{R}$

- **Steps:**  
    1. Đặt $p = a_n$
    2. Lặp $i = n-1, n-2, \ldots, 0$:
        $$p = p \cdot c + a_i$$
- **Output:** $P(c) = p$
**b)**
- **Input:** Bậc đa thức $n \in \mathbb{N}^*$, dãy hệ số của đa thức bị chia $a_n, a_{n-1}, \ldots, a_0$; hằng số $c \in \mathbb{R}$

- **Steps:**
    1. Đặt $b_n = a_n$
    2. Lặp $i = n-1, n-2, \ldots, 1$:
$$b_i = b_{i+1} \cdot c + a_i$$
    3. Tính số dư:
$$r = b_1 \cdot c + a_0$$
        
- **Output:**
    
$$Q_{n-1}(x) = b_n x^{n-1} + b_{n-1} x^{n-2} + \ldots + b_1$$$$r$$
**c)**
- **Input:** Bậc đa thức $n \in \mathbb{N}$; dãy hệ số $a_n, a_{n-1}, \ldots, a_0$; cấp đạo hàm $k \in \mathbb{N}$; $c \in \mathbb{R}$
    
- **Steps:**
    1. Đặt dãy hệ số $b_j = a_j, \quad \forall j = 0, 1, \ldots, n$
    2. Lặp $m = 1, 2, \ldots, k$: 
        - Lặp $j = n-1, n-2, \ldots, m-1$:
            $$b_j = b_{j+1} \cdot c + b_j$$

            
    3. Tính đạo hàm:
        $$P_n^{(k)}(c) = k! \cdot b_{k-1}$$
        
- **Output:** $P_n^{(k)}(c)$

