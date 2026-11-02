- **Input:**
    - Mảng mốc cách đều $X = [x_0, x_1, \dots, x_N]$ (bước lưới $h = x_1 - x_0$).
    - Số mốc cần trích xuất: $k$.
    - Điểm cần tính: $\bar{x}$.
- **Steps:**
    1. Tính vị trí tương đối: $pos = \left\lfloor \frac{\bar{x} - x_0}{h} \right\rfloor$.
    2. Tính chỉ số xuất phát: $idx = \max\left(0, pos - \left\lfloor \frac{k-1}{2} \right\rfloor\right)$.
    3. Kiểm tra tràn biên: Nếu $idx + k - 1 > N$, gán lại $idx = N - k + 1$.
    4. Trích xuất mảng con: $X_{sub} = X[idx : idx + k]$.
- **Output:** Danh sách $k$ mốc nội suy $X_{sub}$.

