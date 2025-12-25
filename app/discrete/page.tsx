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
import { BranchAndBoundTree } from "@/components/branch-and-bound-tree";

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
            <div className="grid grid-cols-2 gap-4 cursor-pointer">
              <div className="space-y-2 cursor-pointer">
                <Label htmlFor="problem-type-discrete cursor-pointer">
                  Tipo de Problema
                </Label>
                <Select
                  value={problemType}
                  onValueChange={(v) =>
                    setProblemType(v as "minimize" | "maximize")
                  }
                >
                  <SelectTrigger id="problem-type-discrete">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimize">Minimização</SelectItem>
                    <SelectItem value="maximize">Maximização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="num-vars-discrete">Número de Variáveis</Label>
                <Input
                  id="num-vars-discrete"
                  type="number"
                  min="1"
                  max="10"
                  value={numVars}
                  onChange={(e) => handleNumVarsChange(e.target.value)}
                  aria-describedby="num-vars-discrete-help"
                />
                <span id="num-vars-discrete-help" className="sr-only">
                  Escolha entre 1 e 10 variáveis
                </span>
              </div>
            </div>

            {/* Objective Function */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Função Objetivo</Label>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {problemType === "minimize" ? "Minimizar" : "Maximizar"} Z =
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {objective.map((coef, i) => (
                    <div key={`obj-${i}`} className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={coef}
                        onChange={(e) =>
                          handleObjectiveChange(i, e.target.value)
                        }
                        aria-label={`Coeficiente da variável x${i + 1}`}
                        className="text-center"
                      />
                      <span className="text-sm font-mono">
                        x<sub>{i + 1}</sub>
                      </span>
                      {i < objective.length - 1 && (
                        <span className="text-muted-foreground">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integer Variables Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Variáveis Inteiras
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecione quais variáveis devem ser inteiras
              </p>
              <div className="grid grid-cols-2 gap-3">
                {integerVars.map((isInteger, i) => (
                  <div key={`int-${i}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`integer-var-${i}`}
                      checked={isInteger}
                      onCheckedChange={() => toggleIntegerVar(i)}
                      aria-label={`Variável x${i + 1} deve ser inteira`}
                    />
                    <label
                      htmlFor={`integer-var-${i}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      x<sub>{i + 1}</sub> é inteira
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Restrições</Label>
                <Button
                  onClick={addConstraint}
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Adicionar Restrição
                </Button>
              </div>

              <div className="space-y-4">
                {constraints.map((constraint, idx) => (
                  <Card key={constraint.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">
                            R{idx + 1}
                          </Label>
                          <Button
                            onClick={() => removeConstraint(constraint.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 cursor-pointer"
                            disabled={constraints.length === 1}
                            aria-label={`Remover restrição ${idx + 1}`}
                          >
                            <Trash2
                              className="h-4 w-4 text-destructive"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {constraint.coefficients.map((coef, i) => (
                            <div
                              key={`${constraint.id}-${i}`}
                              className="flex items-center gap-2"
                            >
                              <Input
                                type="number"
                                step="any"
                                value={coef}
                                onChange={(e) =>
                                  updateConstraintCoefficient(
                                    constraint.id,
                                    i,
                                    e.target.value
                                  )
                                }
                                aria-label={`Coeficiente x${
                                  i + 1
                                } da restrição ${idx + 1}`}
                                className="text-center"
                              />
                              <span className="text-sm font-mono">
                                x<sub>{i + 1}</sub>
                              </span>
                              {i < constraint.coefficients.length - 1 && (
                                <span className="text-muted-foreground">+</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={constraint.type}
                            onValueChange={(v) =>
                              updateConstraintType(
                                constraint.id,
                                v as ConstraintType
                              )
                            }
                          >
                            <SelectTrigger
                              className="w-24"
                              aria-label={`Tipo de restrição ${idx + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="<=">{"<="}</SelectItem>
                              <SelectItem value=">=">{">="}</SelectItem>
                              <SelectItem value="=">{"="}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="any"
                            value={constraint.rhs}
                            onChange={(e) =>
                              updateConstraintRHS(constraint.id, e.target.value)
                            }
                            aria-label={`Valor do lado direito da restrição ${
                              idx + 1
                            }`}
                            className="text-center"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

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
                    <BranchAndBoundTree history={solver.getHistory()} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                  <CardDescription>Status: {result.status}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Valor Ótimo
                    </Label>
                    <p className="text-2xl font-bold font-mono">
                      {result.objectiveValue.toFixed(4)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Valores das Variáveis
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {result.solution.map((value, i) => (
                        <div
                          key={`sol-${i}`}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                          title={
                            integerVars[i]
                              ? "Variável inteira"
                              : "Variável contínua"
                          }
                        >
                          <span className="font-mono text-sm">
                            x<sub>{i + 1}</sub>
                            {integerVars[i] && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (int)
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-semibold">
                            {value.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Label className="text-sm text-muted-foreground">
                      Iterações (Nós Explorados)
                    </Label>
                    <p className="text-lg font-semibold">{result.iterations}</p>
                  </div>
                </CardContent>
              </Card>
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
