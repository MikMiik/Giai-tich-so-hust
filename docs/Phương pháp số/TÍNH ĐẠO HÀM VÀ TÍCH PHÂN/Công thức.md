### 1. Tính gần đúng đạo hàm ($t = \frac{x - x_k}{h}$)

- **$n = 1$ (2 mốc: $x_k, x_{k+1}$):** Xấp xỉ tiếp tuyến bằng cát tuyến 2 điểm.
    - Tại $x_k$: $f'(x_k) \approx \frac{y_{k+1} - y_k}{h}$ — Sai số $O(h)$.
    - Tại $x_{k+1}$: $f'(x_{k+1}) \approx \frac{y_{k+1} - y_k}{h}$ — Sai số $O(h)$.
- **$n = 2$ (3 mốc: $x_k, x_{k+1}, x_{k+2}$):** Uốn Parabol $P_2(x)$ qua 3 điểm rồi lấy độ dốc tiếp tuyến.  
    - Tại $x_k$ ($t=0$): $f'(x_k) \approx \frac{-3y_k + 4y_{k+1} - y_{k+2}}{2h}$ — Sai số $O(h^2)$.
    - Tại $x_{k+1}$ ($t=1$): $f'(x_{k+1}) \approx \frac{y_{k+2} - y_k}{2h}$ — Sai số $O(h^2)$.
    - Tại $x_{k+2}$ ($t=2$): $f'(x_{k+2}) \approx \frac{y_k - 4y_{k+1} + 3y_{k+2}}{2h}$ — Sai số $O(h^2)$.
### 2. Tính gần đúng tích phân $\int_a^b f(x)\,dx$ (Lưới đều $h = \frac{b-a}{n}$)
- **1 điểm (Hình chữ nhật, $m = 0$):** Cắt miền thành các bậc thang ngang ($n$ bất kỳ).
    - Trái: $h \sum_{k=0}^{n-1} y_k$ — Sai số $\le \frac{M_1(b-a)}{2}h$.
    - Phải: $h \sum_{k=1}^{n} y_k$ — Sai số $\le \frac{M_1(b-a)}{2}h$.
    - Giữa: $h \sum_{k=1}^{n} f\left(\frac{x_{k-1}+x_k}{2}\right)$ — Sai số $\le \frac{M_2(b-a)}{24}h^2$.
    - ![[Pasted image 20261122170413.png]]
- **Hình thang ($m = 1$):** Nối các đỉnh đồ thị bằng dây cung thẳng ($n$ bất kỳ).
    - Công thức: $\frac{h}{2}\big[y_0 + 2(y_1 + \dots + y_{n-1}) + y_n\big]$.
    - Sai số: $\le \frac{M_2(b-a)}{12}h^2 = \frac{M_2(b-a)^3}{12n^2}$.
    - ![[Pasted image 20261122170444.png]]
- **Simpson ($m = 2$):** Úp Parabol qua từng cặp 2 đoạn (**$n$ chẵn**).
    - Công thức: $\frac{h}{3}\big[y_0 + 4(y_1 + y_3 + \dots + y_{n-1}) + 2(y_2 + y_4 + \dots + y_{n-2}) + y_n\big]$.
    - Sai số: $\le \frac{M_4(b-a)}{180}h^4 = \frac{M_4(b-a)^5}{180n^4}$.
    - ![[Pasted image 20261122170432.png]]
_(Với $M_k = \max_{[a,b]} \vert{}f^{(k)}(x)\vert{}$)_.
### 3. Ước lượng sai số lưới phủ Runge ($h = p \cdot \bar{h}$)

$$\Delta I_h = p^k \cdot \Delta I_{\bar{h}}$$
$$\Delta I_{\bar{h}} \le \frac{1}{p^k - 1} \vert{}I_{\bar{h}} - I_h\vert{} \quad (\text{Dừng lặp khi } \Delta I_{\bar{h}} \le \varepsilon)$$

- **Hình chữ nhật trái / phải ($k = 1$):** $\Delta I_{\bar{h}} \le \frac{1}{p - 1}\vert{}I_{\bar{h}} - I_h\vert{} \xrightarrow{p=2} \Delta I_{\bar{h}} \le \vert{}I_{\bar{h}} - I_h\vert{}$.
    
- **Hình chữ nhật điểm giữa ($k = 2$):** $\Delta I_{\bar{h}} \le \frac{1}{p^2 - 1}\vert{}I_{\bar{h}} - I_h\vert{} \xrightarrow{p=2} \Delta I_{\bar{h}} \le \frac{1}{3}\vert{}I_{\bar{h}} - I_h\vert{}$.
    
- **Hình thang ($k = 2$):** $\Delta I_{\bar{h}} \le \frac{1}{p^2 - 1}\vert{}I_{\bar{h}} - I_h\vert{} \xrightarrow{p=2} \Delta I_{\bar{h}} \le \frac{1}{3}\vert{}I_{\bar{h}} - I_h\vert{}$.
    
- **Simpson ($k = 4$):** $\Delta I_{\bar{h}} \le \frac{1}{p^4 - 1}\vert{}I_{\bar{h}} - I_h\vert{} \xrightarrow{p=2} \Delta I_{\bar{h}} \le \frac{1}{15}\vert{}I_{\bar{h}} - I_h\vert{}$.
- ![[Pasted image 20261122171641.png]]