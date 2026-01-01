// Definição de uma restrição adicional (Corte)

import { DualSimplexSolver } from "./DualSimplex";
import { OptimizationResult } from "./types";

// Ex: x1 <= 5  -> varIndex: 0, type: 'LTE', value: 5
interface BoundConstraint {
  varIndex: number;
  type: "LTE" | "GTE"; // Less Than Equal / Greater Than Equal
  value: number;
}

// Estrutura do Nó na pilha de processamento
interface BBNode {
  id: number; // ID único do nó
  parentId: number; // ID do pai (para reconstruir a árvore se necessário)
  constraints: BoundConstraint[];
  parentObjective: number;
}

// O que vamos gravar no histórico para a tabela
export interface NodeRecord {
  id: number;
  parentId: number;
  constraints: string; // Texto legível: "x0 <= 2, x1 >= 3"
  objectiveValue: number | string; // Número ou "N/A"
  status:
    | "Optimal"
    | "Infeasible"
    | "Pruned (Bound)"
    | "Integer Found"
    | "Branched";
  solution: string;
}

export class BranchAndBoundSolver {
  private bestObjective: number = Infinity; // Minimização: começa com infinito
  private bestSolution: number[] | null = null;

  private c: number[];
  private A: number[][];
  private b: number[];
  private integerVars: number[]; // Índices das variáveis que devem ser inteiras

  // Armazena o histórico de execução
  private history: NodeRecord[] = [];
  private nodeIdCounter = 0;

  /**
   * @param c Função objetivo
   * @param A Matriz de restrições original
   * @param b Lado direito original
   * @param integerVars Lista de índices das variáveis que PRECISAM ser inteiras (ex: [0, 1])
   */
  constructor(c: number[], A: number[][], b: number[], integerVars: number[]) {
    this.c = c;
    this.A = A;
    this.b = b;
    this.integerVars = integerVars;
  }

  public solve(): OptimizationResult {
    // Resetar histórico e contadores
    this.history = [];
    this.nodeIdCounter = 1; // Começa do 1
    this.bestObjective = Infinity;
    this.bestSolution = null;

    // Nó Raiz
    const rootNode: BBNode = {
      id: 1,
      parentId: 0,
      constraints: [],
      parentObjective: -Infinity,
    };

    // Inicializa a pilha (DFS) com o nó raiz (sem restrições extras)
    const stack: BBNode[] = [rootNode];
    let iterations = 0;

    while (stack.length > 0) {
      iterations++;
      // Pega o próximo nó (Deep First Search economiza memória e acha soluções rápido)
      const currentNode = stack.pop()!;

      // Resolve a Relaxação Linear deste nó
      const result = this.solveNode(currentNode);

      // Preparar registro para o histórico
      const record: NodeRecord = {
        id: currentNode.id,
        parentId: currentNode.parentId,
        constraints: this.formatConstraints(currentNode.constraints),
        objectiveValue: "N/A",
        solution: "N/A",
        status: "Infeasible", // Default, será atualizado abaixo
      };

      // Lógica de Poda (Pruning) ---

      // Caso A: Inviável (Dual Simplex não achou solução)
      if (
        result.status === "Infeasible" ||
        result.status === "NotDualFeasible"
      ) {
        record.status = "Infeasible";
        this.history.push(record);
        continue; // Poda por inviabilidade
      }

      // Se chegou aqui, temos solução viável
      record.objectiveValue = parseFloat(result.objectiveValue.toFixed(4));
      record.solution = `[${result.solution
        .map((n) => Number(n.toFixed(2)))
        .join(", ")}]`;

      // Caso B: Pior que a incumbente (Bound)
      // Se o valor relaxado já é pior que o melhor inteiro que já temos, não adianta descer.
      if (result.objectiveValue >= this.bestObjective) {
        record.status = "Pruned (Bound)";
        this.history.push(record);
        continue; // Poda por limite (Bound)
      }

      // Caso C: Solução Inteira Encontrada?
      if (this.isIntegerSolution(result.solution)) {
        // Atualizamos a melhor solução global (Incumbente)
        // Como passamos pelo check do "Caso B", sabemos que esta é melhor.
        this.bestObjective = result.objectiveValue;
        this.bestSolution = result.solution;
        // console.log(
        //   `Nova melhor solução inteira encontrada: ${this.bestObjective}`
        // );
        record.status = "Integer Found";
        this.history.push(record);
        continue; // Não precisamos ramificar a partir de uma solução inteira (folha)
      }

      // Caso D: Solução Fracionária -> Ramificar (Branch)
      record.status = "Branched";
      this.history.push(record);
      // Precisamos criar dois novos nós filhos
      const branchingVars = this.getBranchingCandidates(result.solution);

      // Estratégia simples: pega a primeira variável fracionária
      const varToBranch = branchingVars[0];
      const varValue = result.solution[varToBranch.index];

      // Criar Filhos
      this.nodeIdCounter++;
      const leftChildId = this.nodeIdCounter;

      this.nodeIdCounter++;
      const rightChildId = this.nodeIdCounter;

      // Filho 1: x <= floor
      const child1: BBNode = {
        id: leftChildId,
        parentId: currentNode.id,
        constraints: [
          ...currentNode.constraints,
          {
            varIndex: varToBranch.index,
            type: "LTE",
            value: Math.floor(varValue),
          },
        ],
        parentObjective: result.objectiveValue,
      };

      // Filho 2: x >= ceil
      const child2: BBNode = {
        id: rightChildId,
        parentId: currentNode.id,
        constraints: [
          ...currentNode.constraints,
          {
            varIndex: varToBranch.index,
            type: "GTE",
            value: Math.ceil(varValue),
          },
        ],
        parentObjective: result.objectiveValue,
      };

      // Empilhar (LIFO)
      stack.push(child2);
      stack.push(child1);
    }

    return {
      status: this.bestSolution ? "Optimal" : "Infeasible",
      objectiveValue: this.bestObjective,
      solution: this.bestSolution || [],
      iterations: iterations,
    };
  }

  /**
   * Resolve a relaxação linear combinando as matrizes originais
   * com as novas restrições de corte do nó atual.
   */
  private solveNode(node: BBNode): OptimizationResult {
    // Clona as estruturas originais para não corromper o problema base
    // Nota: Em implementações de altíssima performance, faríamos apenas updates incrementais,
    // mas reconstruir garante clareza e evita bugs de estado.
    const currentA = this.A.map((row) => [...row]);
    const currentB = [...this.b];
    const numVars = this.c.length;

    // Adiciona as restrições do nó (Bounds) na matriz A e vetor b
    for (const constr of node.constraints) {
      const newRow = new Array(numVars).fill(0);

      if (constr.type === "LTE") {
        // x_i <= val
        // Vetor: [0, ... 1, ... 0] <= val
        newRow[constr.varIndex] = 1;
        currentA.push(newRow);
        currentB.push(constr.value);
      } else {
        // x_i >= val  -->  -x_i <= -val
        // Vetor: [0, ... -1, ... 0] <= -val
        newRow[constr.varIndex] = -1;
        currentA.push(newRow);
        currentB.push(-constr.value);
      }
    }

    const solver = new DualSimplexSolver(this.c, currentA, currentB);
    return solver.solve();
  }

  /**
   * Verifica se todas as variáveis marcadas como inteiras
   * estão realmente inteiras (dentro de uma margem de erro).
   */
  private isIntegerSolution(solution: number[]): boolean {
    const EPSILON = 1e-5;
    for (const index of this.integerVars) {
      const val = solution[index];
      if (Math.abs(val - Math.round(val)) > EPSILON) {
        return false;
      }
    }
    return true;
  }

  /**
   * Retorna lista de variáveis que são fracionárias e precisam de branching.
   */
  private getBranchingCandidates(
    solution: number[]
  ): { index: number; value: number }[] {
    const candidates = [];
    const EPSILON = 1e-5;

    for (const index of this.integerVars) {
      const val = solution[index];
      // Se a distância para o inteiro mais próximo for grande, é fracionário
      if (Math.abs(val - Math.round(val)) > EPSILON) {
        candidates.push({ index, value: val });
      }
    }
    return candidates;
  }

  private formatConstraints(constraints: BoundConstraint[]): string {
    if (constraints.length === 0) return "Root";
    return constraints
      .map((c) => {
        const op = c.type === "LTE" ? "<=" : ">=";
        return `x${c.varIndex} ${op} ${c.value}`;
      })
      .join(", ");
  }

  /**
   * Retorna o histórico bruto para processamento externo
   */
  public getHistory(): NodeRecord[] {
    // Ordenar por ID para facilitar leitura cronológica/hierárquica
    return this.history.sort((a, b) => a.id - b.id);
  }

  /**
   * Exibe o histórico formatado no console
   */
  public printHistoryTable() {
    const sortedHistory = this.getHistory();
    console.table(sortedHistory);
  }
}
