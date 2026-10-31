export function solveLinearSystem(matrix: number[][], rhs: number[]): number[] {
  const n = matrix.length;
  const augmented = matrix.map((row, index) => [...row, rhs[index]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) pivot = row;
    }
    if (Math.abs(augmented[pivot][col]) < 1e-12) throw new Error("Hệ phương trình suy biến.");
    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];
    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  const solution = Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = 0;
    for (let col = row + 1; col < n; col++) sum += augmented[row][col] * solution[col];
    solution[row] = (augmented[row][n] - sum) / augmented[row][row];
  }
  return solution;
}
