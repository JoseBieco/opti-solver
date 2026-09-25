"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Play, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BranchAndBoundSolver } from "@/lib/optimization/BranchAndBound";
import type { OptimizationResult } from "@/lib/optimization/types";
import { MathModelForm } from "@/components/math-model-form";
import { BranchAndCutTree } from "@/components/branch-and-cut-tree";
import { OptimizationResults } from "@/components/optimization-results";

type ConstraintType = "<=" | ">=" | "=";

interface Constraint {
  id: string;
  coefficients: number[];
  type: ConstraintType;
  rhs: number;
}

export default function DiscreteOptimizationPage() {
  const [numVars, setNumVars] = useState(2);
  const [problemType, setProblemType] = useState<"minimize" | "maximize">(
    "minimize"
  );
  const [objective, setObjective] = useState<number[]>([1, 1]);
  const [integerVars, setIntegerVars] = useState<boolean[]>([true, true]);
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: "1", coefficients: [1, 1], type: "<=", rhs: 10 },
  ]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [solver, setSolver] = useState<BranchAndBoundSolver | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNumVarsChange = (value: string) => {
    const num = Number.parseInt(value);
    if (num > 0 && num <= 10) {
      setNumVars(num);
      setObjective(Array(num).fill(1));
      setIntegerVars(Array(num).fill(true));
      setConstraints(
        constraints.map((c) => ({
          ...c,
          coefficients: Array(num).fill(0),
        }))
      );
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjective = [...objective];
    newObjective[index] = Number.parseFloat(value) || 0;
    setObjective(newObjective);
  };

  const toggleIntegerVar = (index: number) => {
    const newIntegerVars = [...integerVars];
    newIntegerVars[index] = !newIntegerVars[index];
    setIntegerVars(newIntegerVars);
  };

  const addConstraint = () => {
    const newId = (
      Math.max(...constraints.map((c) => Number.parseInt(c.id)), 0) + 1
    ).toString();
    setConstraints([
      ...constraints,
      { id: newId, coefficients: Array(numVars).fill(0), type: "<=", rhs: 0 },
    ]);
  };

  const removeConstraint = (id: string) => {
    if (constraints.length > 1) {
      setConstraints(constraints.filter((c) => c.id !== id));
    }
  };

  const updateConstraintCoefficient = (
    id: string,
    index: number,
    value: string
  ) => {
    setConstraints(
      constraints.map((c) => {
        if (c.id === id) {
          const newCoeffs = [...c.coefficients];
          newCoeffs[index] = Number.parseFloat(value) || 0;
          return { ...c, coefficients: newCoeffs };
        }
        return c;
      })
    );
  };

  const updateConstraintType = (id: string, type: ConstraintType) => {
    setConstraints(constraints.map((c) => (c.id === id ? { ...c, type } : c)));
  };

  const updateConstraintRHS = (id: string, value: string) => {
    setConstraints(
      constraints.map((c) =>
        c.id === id ? { ...c, rhs: Number.parseFloat(value) || 0 } : c
      )
    );
  };

  const solve = () => {
    try {
      setError(null);
      setResult(null);
      setSolver(null);

      // Verificar se há pelo menos uma variável inteira
      if (!integerVars.some((v) => v)) {
        setError(
          "Selecione pelo menos uma variável inteira para usar Branch and Bound"
        );
        return;
      }

      // Converter problema de maximização para minimização (multiplicar por -1)
      const c =
        problemType === "maximize" ? objective.map((v) => -v) : objective;

      // Converter restrições para forma padrão (Ax <= b)
      const A: number[][] = [];
      const b: number[] = [];

      for (const constraint of constraints) {
        if (constraint.type === "<=") {
          A.push(constraint.coefficients);
          b.push(constraint.rhs);
        } else if (constraint.type === ">=") {
          // x >= c --> -x <= -c
          A.push(constraint.coefficients.map((v) => -v));
          b.push(-constraint.rhs);
        } else if (constraint.type === "=") {
          // x = c --> x <= c AND -x <= -c
          A.push(constraint.coefficients);
          b.push(constraint.rhs);
          A.push(constraint.coefficients.map((v) => -v));
          b.push(-constraint.rhs);
        }
      }

      // Índices das variáveis inteiras
      const integerIndices = integerVars
        .map((isInt, i) => (isInt ? i : -1))
        .filter((i) => i !== -1);

      const bbSolver = new BranchAndBoundSolver(c, A, b, integerIndices);
      const solution = bbSolver.solve();

      // Se foi maximização, converter o valor objetivo de volta
      if (problemType === "maximize") {
        solution.objectiveValue = -solution.objectiveValue;
      }

      setResult(solution);
      setSolver(bbSolver);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao resolver o problema"
      );
      console.error(err);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Otimização Discreta</h1>
        <p className="text-muted-foreground">
          Resolva problemas de programação inteira usando o método Branch and
          Bound
        </p>
      </div>

      {/* Input Section - Full Width */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Problema</CardTitle>
            <CardDescription>
              Defina a função objetivo, variáveis inteiras e as restrições
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problem Type and Variables */}
            <MathModelForm
              problemType={problemType}
              onProblemTypeChange={setProblemType}
              numVars={numVars}
              onNumVarsChange={handleNumVarsChange}
              objective={objective}
              onObjectiveChange={handleObjectiveChange}
              constraints={constraints}
              onConstraintChange={(i, j, val) => updateConstraintCoefficient(constraints[i].id, j, val)}
              onConstraintTypeChange={(i, type) => updateConstraintType(constraints[i].id, type)}
              onConstraintRhsChange={(i, val) => updateConstraintRHS(constraints[i].id, val)}
              onAddConstraint={addConstraint}
              onRemoveConstraint={(i) => removeConstraint(constraints[i].id)}
              integerVars={integerVars}
              onIntegerVarChange={(i) => toggleIntegerVar(i)}
              showIntegerVars={true}
            />


            <Button
              onClick={solve}
              className="w-full gap-2 cursor-pointer"
              size="lg"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              Resolver Problema
            </Button>
          </CardContent>
        </Card>

        {/* Results Section - Full Width Below */}
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-6">
              {solver && (
                <Card>
                  <CardHeader>
                    <CardTitle>Árvore Branch and Bound</CardTitle>
                    <CardDescription>
                      Clique nos nós para ver detalhes. Use os botões de zoom
                      para navegar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* <BranchAndBoundTree history={solver.getHistory()} /> */}

                    <BranchAndCutTree
                      nodeHistory={solver.getHistory().map((node) => ({
                        ...node,
                        // O novo componente espera 'cutsApplied' e 'depth'
                        cutsApplied: 0,
                        depth: 0,
                      }))}
                      cutHistory={[]} // B&B puro não tem cortes
                    />
                  </CardContent>
                </Card>
              )}

              <OptimizationResults
                result={result}
                problemType={problemType}
                iterations={{
                  nodes: result.iterations
                }}
                integerVars={integerVars}
              />
            </div>
          )}

          {!result && !error && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Configure e resolva o problema para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
