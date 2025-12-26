export type SolutionStatus =
  | "Optimal"
  | "Infeasible"
  | "Unbounded"
  | "MaxIterations"
  | "NotDualFeasible";

export interface OptimizationResult {
  status: SolutionStatus;
  objectiveValue: number;
  solution: number[]; // Valores das variáveis de decisão
  iterations: number;
  message?: string;
}

/** Representa uma variável de decisão no modelo. */
export interface Variable {
  id: number;
  name: string;
  type: "Continuous" | "Integer" | "Binary";
  lowerBound: number;
  upperBound: number;
}

/** Representa um termo em uma expressão linear, como '5*x1'. */
export interface Term {
  variable: Variable;
  coefficient: number;
}

/** Define uma expressão linear como uma soma de termos. */
export type Expression = Term[];

/** Representa uma restrição completa do modelo. */
export interface Constraint {
  name: string;
  expression: Expression;
  sense: "<=" | ">=" | "==";
  rhs: number;
}

/** Representa a função objetivo do modelo. */
export interface Objective {
  sense: "minimize" | "maximize";
  expression: Expression;
}

export interface SolverResult {
  status: string;
  objectiveValue: number;
  solution: { [varName: string]: number }; // Mapa: Nome -> Valor
  iterations: number;
}

/**
 * Branch and Cut
 */
// Registro de cada NÓ visitado
export interface BCNodeRecord {
  id: number;
  parentId: number;
  depth: number; // Profundidade na árvore
  status:
    | "Optimal"
    | "Infeasible"
    | "Inteiro"
    | "Corte Gerado"
    | "Branched"
    | "Pruned (Bound)";
  objectiveValue: number | string; // Valor ou "N/A"
  solution: string; // Texto legível da solução
  cutsApplied: number; // Quantos cortes foram aplicados NESTE nó
}

// Registro de cada CORTE tentado
export interface CutRecord {
  nodeId: number;
  iteration: number; // Iteração dentro do nó (0 = relaxação original)
  cutType: "Gomory"; // Pode haver outros no futuro
  status: "Applied" | "Rejected (Too weak)" | "Rejected (Numerical)";
  generatedConstraint: string; // Ex: "0.5*x1 + 0.2*x3 <= -2.5"
  improvement?: number; // O quanto a função objetivo mudou (opcional)
}
