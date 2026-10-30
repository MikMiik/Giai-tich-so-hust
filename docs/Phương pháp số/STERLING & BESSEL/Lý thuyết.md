
### 1. Ý tưởng xây dựng bản chất

Công thức Stirling được xây dựng bằng cách **lấy trung bình cộng** của hai đa thức nội suy Gauss I và Gauss II:

$$\text{Stirling} = \frac{\text{Gauss I} + \text{Gauss II}}{2}$$

  
- **Gauss I:** Xuất phát từ mốc trung tâm $x_0$, kết nạp mốc theo thứ tự Bên phải trước, rồi xen kẽ: $x_0 \to x_1 \to x_{-1} \to x_2 \to x_{-2} \dots$ (P, T, P, T, ...).
- **Gauss II:** Xuất phát từ mốc trung tâm $x_0$, kết nạp mốc theo thứ tự Bên trái trước, rồi xen kẽ: $x_0 \to x_{-1} \to x_1 \to x_{-2} \to x_2 \dots$ (T, P, T, P, ...).
Khi cộng hai đa thức này lại rồi chia đôi, công thức Stirling thác triển đối xứng về cả hai phía quanh mốc trung tâm $x_0$, giúp giảm thiểu sai số khi cần tính giá trị hàm số hoặc đạo hàm tại các điểm nằm rất gần $x_0$.

### 2. Công thức tổng quát

Đặt biến phụ biến đổi tọa độ:

$$t = \frac{x - x_0}{h}$$

#### a. Thành phần Chẵn (các bậc $t^2, t^4, \dots$)

Các số hạng ứng với sai phân cấp chẵn lấy trực tiếp sai phân đơn lẻ nằm trên hàng mốc trung tâm $x_0$:

$$\text{Chẵn}: \frac{\Delta^{2i} y_{-i}}{(2i)!} t^2 (t^2 - 1^2) (t^2 - 2^2) \dots \left[t^2 - (i-1)^2\right]$$
- _Ví dụ:_
    - Bậc 0: $y_0$
        
    - Bậc 2: $\frac{\Delta^2 y_{-1}}{2!} t^2$ 
        
    - Bậc 4: $\frac{\Delta^4 y_{-2}}{4!} t^2(t^2 - 1)$
        
#### b. Thành phần Lẻ (các bậc $t, t^3, \dots$)

Các số hạng ứng với sai phân cấp lẻ lấy **trung bình cộng** của cặp sai phân đối xứng qua hàng mốc trung tâm $x_0$:

$$\text{Lẻ}: \frac{1}{2} \left( \frac{\Delta^{2i+1} y_{-i} + \Delta^{2i+1} y_{-i-1}}{(2i+1)!} \right) t (t^2 - 1^2) (t^2 - 2^2) \dots (t^2 - i^2)$$

- _Ví dụ:_ 
    - Bậc 1: $\left( \frac{\Delta y_0 + \Delta y_{-1}}{2} \right) t$
        
    - Bậc 3: $\left( \frac{\Delta^3 y_{-1} + \Delta^3 y_{-2}}{2 \times 3!} \right) t(t^2 - 1)$
        

### 3. Đa thức Stirling đầy đủ

Kết hợp hai thành phần chẵn và lẻ, ta thu được dạng khai triển đầy đủ:

$$P(t) = y_0 + t \cdot \left(\frac{\Delta y_{-1} + \Delta y_0}{2}\right) + \frac{t^2}{2!} \Delta^2 y_{-1} + \frac{t(t^2 - 1)}{3!} \cdot \left(\frac{\Delta^3 y_{-2} + \Delta^3 y_{-1}}{2}\right) + \frac{t^2(t^2 - 1)}{4!} \Delta^4 y_{-2} + \dots$$

### 4. Phạm vi và ưu điểm sử dụng

- **Điều kiện áp dụng:** Hệ mốc cách đều $h$ và **số lượng mốc lẻ** (để chọn đúng 1 mốc trung tâm $x_0$ duy nhất).
- **Phạm vi tối ưu:** Khi điểm $x$ cần tính nằm quanh khu vực trung tâm, đặc biệt là khoảng $\vert{}t\vert{} \le 0.25$ hoặc $\vert{}x - x_0\vert{} \le \frac{h}{4}$.


### VD:

### **1. Chọn mốc trung tâm và đổi biến**

- Bảng dữ liệu có $9$ mốc cách đều với bước nhảy $h = 0.1$.
- Điểm cần tính $\bar{x} = 1.63 \in [1.6, 1.7]$.
- Chọn mốc trung tâm $x_0 = 1.6$.
- Công thức đổi biến:
    $$t = \frac{x - x_0}{h} = \frac{x - 1.6}{0.1} \implies \text{Tại } \bar{x} = 1.63: \quad t = \frac{1.63 - 1.6}{0.1} = 0.3$$
    
### **2. Bảng sai phân hữu hạn (quanh mốc trung tâm $x_0 = 1.6$)**

Lập bảng sai phân so le quanh $x_0 = 1.6$ (lấy từ mốc $x_{-2} = 1.4$ đến $x_2 = 1.8$):

|**iii**|**xix_ixi​**|**yiy_iyi​**|**Δy\Delta yΔy**|**Δ2y\Delta^2 yΔ2y**|**Δ3y\Delta^3 yΔ3y**|**Δ4y\Delta^4 yΔ4y**|
|---|---|---|---|---|---|---|
|$-2$|$1.4$|$2.4347052$|||||
||||$0.1126575$||||
|$-1$|$1.5$|$2.5473627$||$-0.0104650$|||
||||$\mathbf{0.1021925}$||$0.0009683$||
|$\mathbf{0}$|$\mathbf{1.6}$|$\mathbf{2.6495552}$||$\mathbf{-0.0094967}$||$\mathbf{-0.0000853}$|
||||$\mathbf{0.0917058}$||$0.0008830$||
|$1$|$1.7$|$2.7412610$||$-0.0086137$|||
||||$0.0813017$||||
|$2$|$1.8$|$2.8225627$|||||

- **Trích xuất các hệ số cho công thức Stirling**:
    - **Hệ số Chẵn** (lấy trực tiếp trên hàng ngang $x_0 = 1.6$):
        
$$y_0 = 2.6495552, \quad \Delta^2 y_{-1} = -0.0094967, \quad \Delta^4 y_{-2} = -0.0000853$$
        
    - **Hệ số Lẻ** (lấy trung bình cộng cặp sai phân đối xứng qua hàng $x_0 = 1.6$):
          
        - Cấp 1: $\dfrac{\Delta y_{-1} + \Delta y_0}{2} = \dfrac{0.1021925 + 0.0917058}{2} = 0.09694915$
            
        - Cấp 3: $\dfrac{\Delta^3 y_{-2} + \Delta^3 y_{-1}}{2} = \dfrac{0.0009683 + 0.0008830}{2} = 0.00092565$
### **3. Lời giải chi tiết các câu hỏi**
#### **a) Lập đa thức nội suy Stirling**
Tách đa thức Stirling $P(t)$ thành hai phần độc lập **Chẵn** và **Lẻ**:

$$P(t) = P_{\text{chẵn}}(t) + P_{\text{lẻ}}(t)$$
1. **Thành phần Chẵn (Hàm chẵn theo $t$):**
    $$P_{\text{chẵn}}(t) = y_0 + \frac{\Delta^2 y_{-1}}{2!} t^2 + \frac{\Delta^4 y_{-2}}{4!} t^2(t^2 - 1)$$
    $$P_{\text{chẵn}}(t) = 2.6495552 - \frac{0.0094967}{2} t^2 - \frac{0.0000853}{24} t^2(t^2 - 1)$$
    
2. **Thành phần Lẻ (Hàm lẻ theo $t$):**
    $$P_{\text{lẻ}}(t) = \left( \frac{\Delta y_{-1} + \Delta y_0}{2} \right) t + \left( \frac{\Delta^3 y_{-2} + \Delta^3 y_{-1}}{2 \times 3!} \right) t(t^2 - 1)$$
    $$P_{\text{lẻ}}(t) = 0.09694915 \, t + \frac{0.00092565}{6} t(t^2 - 1)$$
    
**Đa thức Stirling tổng hợp:**

$$P(t) = \left[ 2.6495552 - 0.00474835\,t^2 - 0.000003554\,t^2(t^2 - 1) \right] + \left[ 0.09694915\,t + 0.000154275\,t(t^2 - 1) \right]$$

_(với $t = \frac{x - 1.6}{0.1}$)_
#### **b) Tính gần đúng giá trị hàm số và đạo hàm tại $\bar{x} = 1.63$**
Tại $\bar{x} = 1.63 \implies t = 0.3$: Các giá trị đa thức cơ sở: $t = 0.3$, $t^2 = 0.09$, $t^2 - 1 = -0.91$.
##### **1. Giá trị hàm số $f(1.63) \approx P(0.3)$:**

- **Tính riêng phần Chẵn tại $t = 0.3$:**
    
$$P_{\text{chẵn}}(0.3) = 2.6495552 - 0.00474835(0.09) - 0.000003554(0.09)(-0.91)$$
    $$P_{\text{chẵn}}(0.3) = 2.6495552 - 0.00042735 + 0.00000029 = \mathbf{2.64912814}$$
    
- **Tính riêng phần Lẻ tại $t = 0.3$:**
    $$P_{\text{lẻ}}(0.3) = 0.09694915(0.3) + 0.000154275(0.3)(-0.91)$$
    $$P_{\text{lẻ}}(0.3) = 0.02908475 - 0.00004212 = \mathbf{0.02904263}$$
    
- **Tổng hợp giá trị hàm:**
    $$f(1.63) \approx P_{\text{chẵn}}(0.3) + P_{\text{lẻ}}(0.3) = 2.64912814 + 0.02904263 = \mathbf{2.6781708}$$
    
##### **2. Giá trị đạo hàm $f'(1.63) \approx \frac{P'(0.3)}{h}$:**
Lấy đạo hàm riêng từng phần theo $t$:
- **Đạo hàm phần Chẵn (trở thành hàm Lẻ theo $t$):**
    $$P_{\text{chẵn}}'(t) = \Delta^2 y_{-1} \cdot t + \frac{\Delta^4 y_{-2}}{24} (4t^3 - 2t)$$
    
    Tại $t = 0.3 \implies 4t^3 - 2t = 4(0.027) - 0.6 = -0.492$:
    $$P_{\text{chẵn}}'(0.3) = (-0.0094967)(0.3) + \left( \frac{-0.0000853}{24} \right)(-0.492) = -0.00284901 + 0.00000175 = \mathbf{-0.00284726}$$
    
- **Đạo hàm phần Lẻ (trở thành hàm Chẵn theo $t$):**
    $$P_{\text{lẻ}}'(t) = \left( \frac{\Delta y_{-1} + \Delta y_0}{2} \right) + \left( \frac{\Delta^3 y_{-2} + \Delta^3 y_{-1}}{2 \times 3!} \right) (3t^2 - 1)$$
    
    Tại $t = 0.3 \implies 3t^2 - 1 = 3(0.09) - 1 = -0.73$:
    $$P_{\text{lẻ}}'(0.3) = 0.09694915 + 0.000154275(-0.73) = 0.09694915 - 0.00011262 = \mathbf{0.09683653}$$
    
- **Tổng hợp đạo hàm theo $x$ với $h = 0.1$:**
    $$P'(0.3) = P_{\text{chẵn}}'(0.3) + P_{\text{lẻ}}'(0.3) = -0.00284726 + 0.09683653 = 0.09398927$$
    $$f'(1.63) \approx \frac{P'(0.3)}{h} = \frac{0.09398927}{0.1} = \mathbf{0.9398927}$$