
- **Input:**
    - Bậc đa thức $p \in \mathbb{N}^*$ ($p \le n$);
    - Mảng dữ liệu cách đều $X = [x_0, x_1, \dots, x_n]$, $Y = [y_0, y_1, \dots, y_n]$ với bước lưới $h = x_1 - x_0$.
- **Steps:**  
    1. **Lập ma trận hệ số đạo hàm Lagrange $D$ kích thước $(p+1) \times (p+1)$:**
        - Lặp $k = 0, 1, \dots, p$; $i = 0, 1, \dots, p$:
            $$D_{k, i} = \begin{cases} \displaystyle \prod_{\substack{j=0 \\ j \neq i, k}}^{p} \frac{k - j}{i - j} \cdot \frac{1}{i - k} & \text{nếu } k \neq i \\ \displaystyle \sum_{\substack{j=0 \\ j \neq i}}^{p} \frac{1}{i - j} & \text{nếu } k = i \end{cases}$$
    2. **Tính mảng đạo hàm $DY = [dy_0, dy_1, \dots, dy_n]$:**
        - Đặt $L = \lfloor \frac{p}{2} \rfloor$.
        - Lặp $m = 0, 1, \dots, n$:  
            - Xác định chỉ số bắt đầu $s$ và vị trí tương đối $k$:
                $$s = \max\big(0, \min(n - p, m - L)\big), \quad k = m - s$$
            - Tính giá trị đạo hàm tại $x_m$:
                $$dy_m = \frac{1}{h} \sum_{i=0}^{p} D_{k, i} \cdot y_{s + i}$$
- **Output:** Mảng giá trị đạo hàm gần đúng $DY = [dy_0, dy_1, \dots, dy_n]$.


---
# Giải thích thuật toán tính đạo hàm bằng công thức Lagrange với $p+1$ điểm

## 1. Xuất phát từ công thức nội suy Lagrange

Giả sử ta có 3 điểm dữ liệu:

$$(1,1),\quad (2,4),\quad (3,9)$$

Theo nội suy Lagrange, ta tìm được đa thức:

$$P_2(x)=x^2$$

Đây là đa thức đi qua cả 3 điểm.

Muốn tính đạo hàm tại các điểm đó, ta lấy đạo hàm của đa thức:

$$P_2'(x)=2x$$

Suy ra:

|**Điểm**|**Giá trị hàm số**|**Đạo hàm**|
|---|---|---|
|$x=1$|1|2|
|$x=2$|4|4|
|$x=3$|9|6|

**Ý tưởng cốt lõi của thuật toán:** thay vì tính đạo hàm trực tiếp từ hàm số ban đầu, ta lấy một nhóm điểm dữ liệu, xây dựng đa thức nội suy Lagrange đi qua nhóm điểm đó, lấy đạo hàm đa thức rồi tính tại tọa độ cần xét.

Nếu có rất nhiều điểm, ta không muốn xây dựng lại đa thức và tính đạo hàm thủ công cho từng điểm. Thuật toán giải quyết việc này bằng cách tính sẵn các hệ số đạo hàm trong ma trận $D$.

## 2. Từ công thức Lagrange chuyển sang công thức đạo hàm

Giả sử có $p+1$ điểm:

$$(x_0,y_0),(x_1,y_1),\ldots,(x_p,y_p)$$

Công thức Lagrange:

$$P_p(x)=\sum_{i=0}^{p}y_iL_i(x)$$
Trong đó:
$$L_i(x)= \prod_{\substack{j=0\\j\neq i}}^p \frac{x-x_j}{x_i-x_j}$$
Lấy đạo hàm hai vế:
$$P_p'(x)=\sum_{i=0}^{p}y_iL_i'(x)$$

Đây là bước chuyển quan trọng:
- $y_i$ là dữ liệu đã biết.
- $L_i'(x)$ là đạo hàm của đa thức cơ sở Lagrange.
Nếu tính được $L_i'(x)$, ta sẽ tính được đạo hàm của đa thức nội suy.

Thuật toán trong file tìm cách tính trước các giá trị $L_i'(x)$ để tái sử dụng.
## 3. Tại sao xuất hiện ma trận D?

Giả sử các điểm cách đều nhau một khoảng $h$. Ta chuyển tọa độ thực về tọa độ tương đối:
$$t=\frac{x-x_s}{h}$$

Khi lấy $p+1$ điểm liên tiếp, tọa độ tương đối của chúng luôn là:

  

$$0,1,2,\ldots,p$$

Ví dụ, lấy 3 điểm có tọa độ thực $1,2,3$, với $h=1$, tọa độ tương đối là $0,1,2$.
Ta có thể xây dựng đa thức Lagrange trên các tọa độ chuẩn $0,1,2$, không cần tính lại theo tọa độ thực mỗi lần.
### 3.1. Ví dụ với 3 điểm ($p=2$)
Công thức Lagrange trên tọa độ chuẩn:
$$P(t)=y_0L_0(t)+y_1L_1(t)+y_2L_2(t)$$

Các đa thức cơ sở:

$$L_0(t)=\frac{(t-1)(t-2)}{2}$$

$$L_1(t)=-t(t-2)$$

$$L_2(t)=\frac{t(t-1)}{2}$$

Lấy đạo hàm:
$$L_0'(t)=\frac{2t-3}{2}$$
$$L_1'(t)=2-2t$$
$$L_2'(t)=\frac{2t-1}{2}$$

Thay lần lượt $t=0,1,2$ vào ba đạo hàm trên:

||**L0′​(t)**|**L1′​(t)**|**L2′​(t)**|
|---|---|---|---|
|$t=0$|-1.5|2|-0.5|
|$t=1$|-0.5|0|0.5|
|$t=2$|0.5|-2|1.5|

Ta thu được ma trận:

$$\boxed{ D= \begin{bmatrix} -1.5&2&-0.5\\ -0.5&0&0.5\\ 0.5&-2&1.5 \end{bmatrix} }$$

**Ma trận D từ đâu ra?**
1. Lấy đạo hàm từng đa thức cơ sở Lagrange.
2. Thay các tọa độ chuẩn $0,1,2$ vào đạo hàm.
3. Đưa kết quả vào ma trận.
Mỗi hàng là một vị trí cần tính đạo hàm. Mỗi cột là hệ số tương ứng với một giá trị $y_i$.
### 3.2. Dùng ma trận D để tính đạo hàm

Giả sử ba giá trị dữ liệu là:

  

$$Y= \begin{bmatrix} 1\\4\\9 \end{bmatrix}$$

Muốn tính đạo hàm tại vị trí đầu tiên trong nhóm, ta lấy hàng đầu tiên của $D$:
$$dy_0=-1.5(1)+2(4)-0.5(9)=2$$

Tại vị trí giữa, lấy hàng thứ hai:
$$dy_1=-0.5(1)+0(4)+0.5(9)=4$$

Tại vị trí cuối, lấy hàng thứ ba:
$$dy_2=0.5(1)-2(4)+1.5(9)=6$$

Kết quả:
$$DY=[2,4,6]$$

Đúng với đạo hàm của $f(x)=x^2$ tại các điểm $1,2,3$.

Có thể hiểu ma trận $D$ như một bảng công thức tính nhanh. Thay vì mỗi lần lại xây dựng đa thức Lagrange, lấy đạo hàm và thay tọa độ, ta đã tính sẵn các hệ số và chỉ cần nhân với dữ liệu $Y$.

### 3.3. Liên hệ với công thức D trong file

Công thức tính $D_{k,i}$ trong file chính là:

$$\boxed{D_{k,i}=L_i'(k)}$$

Khi $k\neq i$:
$$L_i'(k)= \prod_{\substack{j=0\\j\neq i,k}}^p \frac{k-j}{i-j} \cdot\frac{1}{i-k}$$

Khi $k=i$:

$$L_i'(i)= \sum_{\substack{j=0\\j\neq i}}^p \frac{1}{i-j}$$

Hai công thức này được suy ra từ việc lấy đạo hàm của đa thức cơ sở Lagrange.


