import type { Expression, Term, Variable } from "./types"

/**
 * Cria uma expressão linear a partir de uma lista de variáveis e termos.
 * Simula um somatório (Σ) da notação matemática.
 * @param items Um array que pode conter objetos Variable (coeficiente 1) ou Term.
 * @returns Uma Expression (Term[]) formatada para ser usada no modelo.
 */
export function LpSum(items: (Variable | Term)[]): Expression {
  return items.map((item) => {
    if ("coefficient" in item && "variable" in item) {
      return item
    }
    return { variable: item as Variable, coefficient: 1 }
  })
}

/**
 * Filtra as linhas de uma matriz densa e seu vetor RHS correspondente para
 * manter apenas as linhas que são linearmente independentes.
 * @param denseA A matriz de restrições em formato denso.
 * @param b O vetor do lado direito (RHS).
 * @returns Um objeto contendo a matriz A e o vetor b filtrados.
 */
export function filterLinearlyIndependentRows(denseA: number[][], b: number[]): { A: number[][]; b: number[] } {
  if (denseA.length === 0) {
    return { A: [], b: [] }
  }
  const numVars = denseA[0].length
  const independentRows: number[][] = []
  const independentB: number[] = []
  const basisVectors: number[][] = []

  const dot = (v1: number[], v2: number[]) => v1.reduce((acc, val, i) => acc + val * v2[i], 0)
  const norm = (v: number[]) => Math.sqrt(dot(v, v))

  for (let i = 0; i < denseA.length; i++) {
    const vector = denseA[i]
    const projection = [...vector]

    for (const basisVec of basisVectors) {
      const scalarProjection = dot(vector, basisVec)
      for (let j = 0; j < numVars; j++) {
        projection[j] -= scalarProjection * basisVec[j]
      }
    }

    if (norm(projection) > 1e-9) {
      independentRows.push(vector)
      independentB.push(b[i])
      const normalizedProjection = projection.map((val) => val / norm(projection))
      basisVectors.push(normalizedProjection)
    }
  }
  return { A: independentRows, b: independentB }
}
