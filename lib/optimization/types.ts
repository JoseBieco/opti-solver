export type SolutionStatus = "Optimal" | "Infeasible" | "Unbounded" | "MaxIterations" | "NotDualFeasible"

export interface OptimizationResult {
  status: SolutionStatus
  objectiveValue: number
  solution: number[] // Valores das variáveis de decisão
  iterations: number
  message?: string
}

/** Representa uma variável de decisão no modelo. */
export interface Variable {
  id: number
  name: string
  type: "Continuous" | "Integer" | "Binary"
  lowerBound: number
  upperBound: number
}

/** Representa um termo em uma expressão linear, como '5*x1'. */
export interface Term {
  variable: Variable
  coefficient: number
}

/** Define uma expressão linear como uma soma de termos. */
export type Expression = Term[]

/** Representa uma restrição completa do modelo. */
export interface Constraint {
  name: string
  expression: Expression
  sense: "<=" | ">=" | "=="
  rhs: number
}

/** Representa a função objetivo do modelo. */
export interface Objective {
  sense: "minimize" | "maximize"
  expression: Expression
}

export interface SolverResult {
  status: string
  objectiveValue: number
  solution: { [varName: string]: number } // Mapa: Nome -> Valor
  iterations: number
}
