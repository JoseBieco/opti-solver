import { DualSimplexSolver } from "./DualSimplex";
import { BCNodeRecord, CutRecord, OptimizationResult } from "./types";

// Adicionar ao arquivo types.ts
interface BCNode {
  id: number;
  parentId: number;
  depth: number;
  constraints: number[][]; // Matriz A acumulada
  rhs: number[]; // Vetor b acumulado
  parentObjective: number;
}

export class BranchAndCutSolver {
  private bestObjective: number = Infinity;
  private bestSolution: number[] | null = null;

  private c: number[];
  private initialA: number[][]; // Guarda a estrutura original para reconstrução de folgas
  private initialB: number[];
  private integerVars: number[];

  // --- Históricos ---
  private nodeHistory: BCNodeRecord[] = [];
  private cutHistory: CutRecord[] = [];
  private nodeIdCounter = 0;

  constructor(c: number[], A: number[][], b: number[], integerVars: number[]) {
    this.c = c;
    this.initialA = A; // Importante: Guardar referência imutável
    this.initialB = b;
    this.integerVars = integerVars;
  }

  public solve(): OptimizationResult {
    // Resetar histórico e contadores
    this.nodeHistory = [];
    this.cutHistory = [];
    this.nodeIdCounter = 0;
    this.bestObjective = Infinity;
    this.bestSolution = null;

    // Inicializa fila com Nó Raiz
    const queue: BCNode[] = [
      {
        id: 0,
        parentId: -1,
        depth: 0,
        constraints: this.initialA.map((r) => [...r]),
        rhs: [...this.initialB],
        parentObjective: -Infinity,
      },
    ];

    let totalIterations = 0;

    while (queue.length > 0) {
      totalIterations++;

      // Estratégia Best-First ou Depth-First? Usaremos Depth (pop) para economizar memória
      const node = queue.pop()!;

      // Resolve Relaxação
      // Loop de Cortes: Resolve -> Tenta Cortar -> Resolve -> ...
      let solver: DualSimplexSolver;
      let result: OptimizationResult;
      let cutsAddedInNode = 0;
      const MAX_CUTS_PER_NODE = 5; // Evita loop infinito de cortes
      let loopIteration = 0;

      while (true) {
        loopIteration++;
        solver = new DualSimplexSolver(this.c, node.constraints, node.rhs);
        result = solver.solve();

        // [LOG] Preparar registro base
        const currentRecord: BCNodeRecord = {
          id: node.id,
          parentId: node.parentId,
          depth: node.depth,
          status: "Infeasible", // Placeholder
          objectiveValue: "N/A",
          solution: "N/A",
          cutsApplied: cutsAddedInNode,
        };

        // Caso A: Inviável
        if (result.status !== "Optimal") {
          currentRecord.status = "Infeasible";
          this.logNode(currentRecord);
          break; // Sai do loop de cortes (nó morto)
        }

        // Se viável, guarda dados
        currentRecord.objectiveValue = parseFloat(
          result.objectiveValue.toFixed(4)
        );
        currentRecord.solution = `[${result.solution
          .map((n) => Number(n.toFixed(2)))
          .join(", ")}]`;

        // Caso B: Poda por Limite (Bound)
        if (result.objectiveValue >= this.bestObjective) {
          currentRecord.status = "Pruned (Bound)";
          this.logNode(currentRecord);
          break; // Sai do loop (nó inútil)
        }

        // Caso C: Inteiro Encontrado
        if (this.isInteger(result.solution)) {
          this.bestObjective = result.objectiveValue;
          this.bestSolution = result.solution;
          currentRecord.status = "Inteiro";
          this.logNode(currentRecord);
          break; // Sai do loop (nó resolvido)
        }

        // Caso D: Tentar Cortes (Se ainda não é inteiro e não estourou limite)
        if (cutsAddedInNode < MAX_CUTS_PER_NODE) {
          // const cut = solver.generateGomoryCut(
          //   this.integerVars,
          //   this.initialA,
          //   this.initialB
          // );

          // Passamos 'node.constraints' e 'node.rhs' em vez de 'this.initialA/B'.
          // Isso garante que as folgas dos cortes anteriores sejam substituídas corretamente.
          const cut = solver.generateGomoryCut(
            this.integerVars,
            node.constraints,
            node.rhs
          );

          if (cut) {
            // [LOG] Registra o sucesso do corte
            this.logCut({
              nodeId: node.id,
              iteration: loopIteration,
              cutType: "Gomory",
              status: "Applied",
              generatedConstraint: this.formatCut(cut.row, cut.rhs),
            });

            // Aplica corte e repete o loop (não sai do while(true))
            node.constraints.push(cut.row);
            node.rhs.push(cut.rhs);
            cutsAddedInNode++;

            // Não logamos o nó ainda, pois ele vai ser re-resolvido!
            // Opcional: Logar como "Corte Gerado" se quiser ver passos intermediários
            continue;
          } else {
            // [LOG] Registra falha (fraco demais ou numérico)
            this.logCut({
              nodeId: node.id,
              iteration: loopIteration,
              cutType: "Gomory",
              status: "Rejected (Too weak)",
              generatedConstraint: "N/A",
            });
          }
        }

        // Caso E: Branching (Se chegou aqui, não é inteiro e não dá pra cortar mais)
        currentRecord.status = "Branched";
        this.logNode(currentRecord);

        this.branch(node, result.solution, queue);
        console.log(`Length queue: ${queue.length}`);

        break; // Sai do loop de cortes
      }
    }

    return {
      status: this.bestSolution ? "Optimal" : "Infeasible",
      objectiveValue: this.bestObjective,
      solution: this.bestSolution || [],
      iterations: totalIterations,
    };
  }

  private branch(node: BCNode, solution: number[], queue: BCNode[]) {
    // Escolhe variável para ramificar (primeira fracionária)
    const branchVarIdx = this.getBranchingCandidate(solution);
    if (branchVarIdx === -1) return;

    const val = solution[branchVarIdx];

    // Filho 1: x <= floor
    this.nodeIdCounter++;
    const leftId = this.nodeIdCounter;

    const child1Constraints = node.constraints.map((r) => [...r]);
    const child1Rhs = [...node.rhs];

    const rowLte = new Array(this.c.length).fill(0);
    rowLte[branchVarIdx] = 1;
    child1Constraints.push(rowLte);
    child1Rhs.push(Math.floor(val));

    queue.push({
      id: leftId,
      parentId: node.id,
      depth: node.depth + 1,
      constraints: child1Constraints,
      rhs: child1Rhs,
      parentObjective: -Infinity,
    });

    // Filho 2: x >= ceil  --> -x <= -ceil
    this.nodeIdCounter++;
    const rightId = this.nodeIdCounter;

    const child2Constraints = node.constraints.map((r) => [...r]);
    const child2Rhs = [...node.rhs];

    const rowGte = new Array(this.c.length).fill(0);
    rowGte[branchVarIdx] = -1;
    child2Constraints.push(rowGte);
    child2Rhs.push(-Math.ceil(val));

    queue.push({
      id: node.id + 2,
      parentId: node.id,
      depth: node.depth + 1,
      constraints: child2Constraints,
      rhs: child2Rhs,
      parentObjective: -Infinity,
    });
  }

  private isInteger(sol: number[]): boolean {
    return this.integerVars.every(
      (idx) => Math.abs(sol[idx] - Math.round(sol[idx])) < 1e-5
    );
  }

  private getBranchingCandidate(sol: number[]): number {
    for (const idx of this.integerVars) {
      if (Math.abs(sol[idx] - Math.round(sol[idx])) > 1e-5) return idx;
    }
    return -1;
  }

  // --- Helpers de Log ---

  private logNode(record: BCNodeRecord) {
    this.nodeHistory.push(record);
  }

  private logCut(record: CutRecord) {
    this.cutHistory.push(record);
  }

  private formatCut(row: number[], rhs: number): string {
    // Formata: "1*x0 - 0.5*x2 <= -2.5"
    const terms = row
      .map((coef, i) => {
        if (Math.abs(coef) < 1e-4) return null;
        return `${coef.toFixed(2)}*x${i}`;
      })
      .filter(Boolean);
    return `${terms.join(" + ")} <= ${rhs.toFixed(2)}`;
  }

  public getHistory() {
    return {
      nodes: this.nodeHistory.sort((a, b) => a.id - b.id),
      cuts: this.cutHistory,
    };
  }

  public printFullHistory() {
    console.log("\n=== Histórico de Nós (Árvore) ===");
    console.table(this.getHistory().nodes);

    console.log("\n=== Histórico de Cortes (Cuts) ===");
    if (this.cutHistory.length === 0) {
      console.log("Nenhum corte foi gerado.");
    } else {
      console.table(this.getHistory().cuts);
    }
  }
}
