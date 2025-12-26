import { OptimizationResult, SolutionStatus } from "./types";

/**
 * Configurações e Constantes
 * EPSILON é usado para lidar com erros de ponto flutuante.
 */
const EPSILON = 1e-10;

export class DualSimplexSolver {
  private tableau: number[][] = [];
  private numRows: number = 0;
  private numCols: number = 0;
  private numDecisionVars: number = 0;

  // Rastreia quais variáveis estão na base (por índice de linha)
  private basicVars: number[] = [];

  // Para evitar loops infinitos
  private maxIterations;

  /**
   * Inicializa o Solver.
   * Assume problema de **MINIMIZAÇÃO** na forma padrão:
   * Min z = c^T * x
   * Sujeito a: Ax <= b
   * @param c Coeficientes da função objetivo
   * @param A Matriz de restrições
   * @param b Lado direito das restrições (RHS)
   */
  constructor(
    c: number[],
    A: number[][],
    b: number[],
    maxIterations: number = 1000
  ) {
    this.buildTableau(c, A, b);

    this.maxIterations = maxIterations;
  }

  /**
   * Constrói o Tableau inicial incluindo variáveis de folga.
   * Estrutura do Tableau:
   * [ A  |  I  |  b ]
   * [ c  |  0  |  0 ] (Última linha é a função objetivo - custos reduzidos)
   */
  private buildTableau(c: number[], A: number[][], b: number[]) {
    const m = A.length; // Número de restrições
    const n = c.length; // Número de variáveis de decisão

    this.numDecisionVars = n;
    this.numRows = m + 1; // +1 para a linha da função objetivo
    this.numCols = n + m + 1; // Variáveis decisão + Folgas + RHS

    this.tableau = new Array(this.numRows)
      .fill(0)
      .map(() => new Array(this.numCols).fill(0));
    this.basicVars = new Array(m).fill(0);

    // Preencher restrições e identidade (folgas)
    for (let i = 0; i < m; i++) {
      // Copia coeficientes de A
      for (let j = 0; j < n; j++) {
        this.tableau[i][j] = A[i][j];
      }
      // Matriz Identidade para variáveis de folga
      this.tableau[i][n + i] = 1;
      // Lado direito (b) na última coluna
      this.tableau[i][this.numCols - 1] = b[i];

      // Inicialmente, as variáveis básicas são as de folga (índices n a n+m-1)
      this.basicVars[i] = n + i;
    }

    // Preencher função objetivo (última linha)
    // Nota: No Dual Simplex, começamos com c >= 0 (condição de otimalidade satisfeita)
    for (let j = 0; j < n; j++) {
      this.tableau[m][j] = c[j];
    }
  }

  /**
   * Verifica se o tableau está em uma forma Dual-Viável (custos reduzidos >= 0).
   * O Dual Simplex só funciona se começarmos de uma base ótima (dual-viável).
   */
  private isDualFeasible(): boolean {
    const objectiveRow = this.numRows - 1;
    for (let j = 0; j < this.numCols - 1; j++) {
      if (this.tableau[objectiveRow][j] < -EPSILON) {
        return false;
      }
    }
    return true;
  }

  public solve(): OptimizationResult {
    // FASE 1: Garantir Dual-Viabilidade (Otimizar custos negativos)
    // Se começamos com custos negativos (ex: problema de Max transformado),
    // usamos o Simplex Primal para chegar numa base ótima relaxada.
    if (!this.isDualFeasible()) {
      const primalStatus = this.runPrimalSimplex();
      if (primalStatus !== "Optimal") {
        return this.extractSolution(0, primalStatus); // Unbounded ou falha
      }
    }

    // FASE 2: Dual Simplex (Resolver Inviabilidades Primal/Cortes)
    // Agora que c >= 0, usamos o Dual Simplex para corrigir RHS negativos.
    return this.runDualSimplex();
  }

  /**
   * Executa o algoritmo Simplex Primal padrão.
   * Objetivo: Eliminar custos reduzidos negativos na linha Z.
   */
  private runPrimalSimplex(): SolutionStatus {
    let iterations = 0;
    const maxIterations = 1000;

    while (iterations < maxIterations) {
      // Escolher quem ENTRA (Coluna com custo mais negativo)
      const pivotCol = this.getPrimalEnteringVariable();

      // Se não há custo negativo, estamos Ótimos (Dual Viável)
      if (pivotCol === -1) {
        return "Optimal";
      }

      // Escolher quem SAI (Menor Razão Primal: b / a para a > 0)
      const pivotRow = this.getPrimalLeavingVariable(pivotCol);

      // Se não há candidato a sair, o problema é Ilimitado
      if (pivotRow === -1) {
        return "Unbounded";
      }

      // Pivotar
      this.pivot(pivotRow, pivotCol);
      iterations++;
    }
    return "MaxIterations";
  }

  /**
   * Critério de entrada do PRIMAL Simplex:
   * Coluna com o coeficiente mais negativo na função objetivo.
   */
  private getPrimalEnteringVariable(): number {
    let minVal = -1e-9;
    let pivotCol = -1;
    const objectiveRow = this.numRows - 1;

    for (let j = 0; j < this.numCols - 1; j++) {
      if (this.tableau[objectiveRow][j] < minVal) {
        minVal = this.tableau[objectiveRow][j];
        pivotCol = j;
      }
    }
    return pivotCol;
  }

  /**
   * Critério de saída do PRIMAL Simplex (Teste da Razão):
   * Min (RHS / a_ij) para a_ij > 0.
   */
  private getPrimalLeavingVariable(col: number): number {
    let minRatio = Infinity;
    let pivotRow = -1;
    const rhsCol = this.numCols - 1;

    for (let i = 0; i < this.numRows - 1; i++) {
      const numerator = this.tableau[i][rhsCol];
      const denominator = this.tableau[i][col];

      // Primal Simplex só pivoteia em denominadores positivos
      if (denominator > 1e-9) {
        const ratio = numerator / denominator;
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRow = i;
        }
      }
    }
    return pivotRow;
  }

  /**
   * Executa o algoritmo Dual Simplex.
   */
  private runDualSimplex(): OptimizationResult {
    let iterations = 0;

    while (iterations < this.maxIterations) {
      // Escolher quem SAI (Linha com RHS mais negativo)
      const pivotRow = this.getLeavingVariable(); // (Método original do Dual)

      // Se todos RHS >= 0, temos a solução Ótima e Viável
      if (pivotRow === -1) {
        return this.extractSolution(iterations, "Optimal");
      }

      // Escolher quem ENTRA (Teste da Razão Dual)
      const pivotCol = this.getEnteringVariable(pivotRow); // (Método original do Dual)

      // Se impossível pivotar, o problema é inviável
      if (pivotCol === -1) {
        return this.extractSolution(iterations, "Infeasible");
      }

      // Pivotar
      this.pivot(pivotRow, pivotCol);
      iterations++;
    }

    return this.extractSolution(iterations, "MaxIterations");
  }

  /**
   * Critério de saída do Dual Simplex:
   * Seleciona a linha com o valor mais negativo no RHS (coluna b).
   */
  private getLeavingVariable(): number {
    let minVal = -EPSILON;
    let pivotRow = -1;
    const rhsCol = this.numCols - 1;

    // Itera sobre as linhas de restrição (exclui a linha Z)
    for (let i = 0; i < this.numRows - 1; i++) {
      if (this.tableau[i][rhsCol] < minVal) {
        minVal = this.tableau[i][rhsCol];
        pivotRow = i;
      }
    }
    return pivotRow;
  }

  /**
   * Critério de entrada do Dual Simplex (Teste da Razão):
   * Busca min(|cj / aij|) para aij < 0.
   * Isso mantém a condição de otimalidade (custos reduzidos >= 0).
   */
  private getEnteringVariable(row: number): number {
    let minRatio = Infinity;
    let pivotCol = -1;
    const objectiveRow = this.numRows - 1;

    for (let j = 0; j < this.numCols - 1; j++) {
      const a_ij = this.tableau[row][j];

      // Só consideramos coeficientes negativos na linha pivô
      if (a_ij < -EPSILON) {
        const c_j = this.tableau[objectiveRow][j];
        const ratio = Math.abs(c_j / a_ij);

        if (ratio < minRatio) {
          minRatio = ratio;
          pivotCol = j;
        }
      }
    }
    return pivotCol;
  }

  /**
   * Executa a eliminação de Gauss-Jordan para atualizar o Tableau.
   */
  private pivot(row: number, col: number) {
    const pivotElement = this.tableau[row][col];

    // Atualiza a variável básica desta linha
    this.basicVars[row] = col;

    // Normalizar a linha pivô (dividir tudo pelo elemento pivô)
    for (let j = 0; j < this.numCols; j++) {
      this.tableau[row][j] /= pivotElement;
    }

    // Zerar a coluna pivô nas outras linhas
    for (let i = 0; i < this.numRows; i++) {
      if (i !== row) {
        const factor = this.tableau[i][col];
        if (Math.abs(factor) > EPSILON) {
          for (let j = 0; j < this.numCols; j++) {
            this.tableau[i][j] -= factor * this.tableau[row][j];
          }
        }
      }
    }
  }

  private extractSolution(
    iterations: number,
    status: SolutionStatus
  ): OptimizationResult {
    const solution = new Array(this.numDecisionVars).fill(0);
    const rhsCol = this.numCols - 1;

    if (status === "Optimal" || status === "MaxIterations") {
      for (let i = 0; i < this.numRows - 1; i++) {
        const varIndex = this.basicVars[i];
        // Se o índice da variável básica for uma variável de decisão (não folga)
        if (varIndex < this.numDecisionVars) {
          solution[varIndex] = this.tableau[i][rhsCol];
        }
      }
    }

    // O valor da função objetivo está na última célula do tableau.
    // Dependendo da formulação, pode precisar inverter o sinal.
    // Nesta formulação padrão de Minimização, o valor costuma ficar negativo no tableau se Z foi movido.
    // Mas numa implementação direta de array: valor atual = - (canto inferior direito) se usarmos Z - cx = 0
    // Aqui simplificamos: pegamos o valor acumulado.
    const objectiveValue = -this.tableau[this.numRows - 1][rhsCol];

    return {
      status,
      objectiveValue,
      solution,
      iterations,
    };
  }

  /**
   * Gera um corte de Gomory robusto, substituindo variáveis de folga
   * pelas suas definições originais para ajustar coeficientes e RHS.
   * * @param integerVars Índices das variáveis que devem ser inteiras
   * @param originalA Matriz de restrições original (para expandir folgas)
   * @param originalB Vetor RHS original (para ajustar o RHS do corte)
   */
  public generateGomoryCut(
    integerVars: number[],
    originalA: number[][],
    originalB: number[]
  ): { row: number[]; rhs: number } | null {
    const rhsCol = this.numCols - 1;
    let bestRowIndex = -1;
    let maxFraction = -1;

    // Selecionar a linha da base com a maior parte fracionária (f_i)
    for (let i = 0; i < this.numRows - 1; i++) {
      const basicVarIdx = this.basicVars[i];
      if (integerVars.includes(basicVarIdx)) {
        const val = this.tableau[i][rhsCol];
        const frac = val - Math.floor(val + 1e-10); // Ajuste para precisão numérica

        if (frac > 1e-5 && frac < 1 - 1e-5) {
          if (frac > maxFraction) {
            maxFraction = frac;
            bestRowIndex = i;
          }
        }
      }
    }

    if (bestRowIndex === -1) return null;

    // Inicializar o Corte
    // Queremos chegar em: sum(coef * x) <= rhs
    const numOriginalVars = this.numDecisionVars;
    const cutCoefficients = new Array(numOriginalVars).fill(0);

    // Na fórmula padrão Gomory (>=), o RHS seria f_i.
    // Convertendo para forma (<=), começamos com -f_i.
    const f_i = maxFraction;
    let cutRhs = -f_i;

    // Iterar sobre as colunas não-básicas para compor o corte
    for (let j = 0; j < this.numCols - 1; j++) {
      const a_ij = this.tableau[bestRowIndex][j];
      // f_ij: parte fracionária do coeficiente
      const f_ij = a_ij - Math.floor(a_ij + 1e-10);

      if (f_ij < 1e-9) continue; // Ignora coeficientes inteiros/nulos

      if (j < numOriginalVars) {
        // CASO A: Variável de Decisão Original (x_j)
        // Contribuição original: + f_ij * x_j >= ...
        // Invertendo para <=: subtrai f_ij
        cutCoefficients[j] -= f_ij;
      } else {
        // CASO B: Variável de Folga (s_k)
        // Índice da restrição original que gerou essa folga
        const constraintIndex = j - numOriginalVars;

        // Verificação de segurança
        if (constraintIndex < originalA.length) {
          // Substituição: s_k = b_k - sum(A_kv * x_v)
          // Termo no corte (>=): f_ij * (b_k - sum(A_kv * x_v))
          // Termo expandido: (f_ij * b_k) - sum(f_ij * A_kv * x_v)

          // O termo constante (f_ij * b_k) passa para o RHS (subtraindo)
          // Como estamos na forma <= (multiplicado por -1), ele SOMA no RHS final.
          cutRhs += f_ij * originalB[constraintIndex];

          // Os termos variáveis (- f_ij * A_kv * x_v) ficam no LHS.
          // Na forma >= eles são negativos.
          // Na forma <= (invertida), eles viram POSITIVOS.
          const originalRow = originalA[constraintIndex];
          for (let v = 0; v < numOriginalVars; v++) {
            cutCoefficients[v] += f_ij * originalRow[v];
          }
        }
      }
    }

    return {
      row: cutCoefficients,
      rhs: cutRhs,
    };
  }
}
