- **Đầu vào:** Bậc đa thức $n \in \mathbb{N}^*$; dãy nghiệm $c_1, c_2, \dots, c_n \in \mathbb{R}$ tương ứng với các nhân tử $(x - c_k)$ cần khai triển.
- **Các bước thực hiện:**
    1. Khởi tạo mảng hệ số hàng thứ 0 độ dài $n + 1$ (chỉ số cột $i = 0, 1, \dots, n$):
        $$A = [0, 0, \dots, 0, 1]$$
        
        _(tương ứng $A_0 = A_1 = \dots = A_{n-1} = 0$, $A_n = 1$)_
        
    2. Với mỗi $k = 1, 2, \dots, n$ (ứng với nghiệm $c_k$):  
        - Tạo mảng hàng mới $B$ có độ dài $n + 1$.
        - Với mỗi cột $i = n, n - 1, \dots, 0$:
              
            $$B_i = A_{i+1} - c_k \cdot A_i$$
            
            _(với quy ước khi $i = n$ thì $A_{n+1} = 0$)_
            
        - Cập nhật lại hàng: $A = B$.
            
    3. Gán các hệ số tương ứng:
        $$a_j = A_{n-j} \quad \text{với } j = n, n-1, \dots, 0$$
        
- **Đầu ra:**
    - Dãy hệ số: $[a_n, a_{n-1}, \dots, a_0] = [A_0, A_1, \dots, A_n]$.
    - Đa thức hoàn chỉnh:
        $$P(x) = a_n x^n + a_{n-1} x^{n-1} + \dots + a_1 x + a_0 = \sum_{j=0}^{n} a_j x^j$$