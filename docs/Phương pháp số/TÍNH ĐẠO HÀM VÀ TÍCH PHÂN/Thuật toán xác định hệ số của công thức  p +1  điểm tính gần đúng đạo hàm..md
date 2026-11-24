- **Input:**
    - Bậc đa thức $p \in \mathbb{N}^*$ ($p + 1$ mốc).
- **Steps:**
    1. **Ma trận Lagrange $A$ (kích thước $(p+1) \times (p+1)$):**  
        - Lặp $i = 0, 1, \dots, p$:  
            - $M_i = \prod_{\substack{j=0 \\ j \neq i}}^{p} (i - j)$
            - Tạo $B = [1, 0, \dots, 0]$ (độ dài $p+1$, $B_0$ là hệ số bậc cao nhất $t^p$).
            - Lặp $j = 0, 1, \dots, p$:  
                - Nếu $j \neq i$:
                    - Lặp $r = p, p-1, \dots, 1$:
                        $$B_r = B_r - j \cdot B_{r-1} \text{[cite: 18]}$$
                        
            - Lặp $r = 0, 1, \dots, p$:
                $$A_{i, r} = \frac{B_r}{M_i}$$
                
    1. **Ma trận hệ số đạo hàm $D$ (kích thước $(p+1) \times (p+1)$):**
        - Lặp $k = 0, 1, \dots, p$:  
            - Lặp $i = 0, 1, \dots, p$:
                - $d = 0$
                - Lặp $r = 0, 1, \dots, p - 1$:$$d = d \cdot k + (p - r) \cdot A_{i, r}$$
                - $D_{k, i} = d$
- **Output:**
    - Ma trận hệ số $D = [D_{k, i}]_{(p+1) \times (p+1)}$ ($f'(x_k) \approx \frac{1}{h} \sum_{i=0}^{p} D_{k, i} y_i$).