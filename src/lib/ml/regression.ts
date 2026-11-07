// Ridge regression: w = (XtX + lambda I)^-1 Xt y, solved by Gaussian elimination with pivoting.
export function fitRidge(X: number[][], y: number[], lambda = 0.1): number[] {
  const n = X[0].length;
  const A = Array.from({ length: n }, (_, i) => {
    const row = Array.from({ length: n + 1 }, () => 0);
    for (let j = 0; j < n; j++) {
      for (const x of X) row[j] += x[i] * x[j];
    }
    row[i] += lambda;
    X.forEach((x, k) => {
      row[n] += x[i] * y[k];
    });
    return row;
  });

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / A[col][col];
      for (let c = col; c <= n; c++) A[r][c] -= factor * A[col][c];
    }
  }

  const w = Array.from({ length: n }, () => 0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = A[i][n];
    for (let j = i + 1; j < n; j++) sum -= A[i][j] * w[j];
    w[i] = sum / A[i][i];
  }
  return w;
}

export const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

export function r2(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((s, v) => s + v, 0) / actual.length;
  const ssTot = actual.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}
