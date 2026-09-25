import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface Constraint {
  coefficients: number[];
  type?: "<=" | ">=" | "=";
  sense?: "<=" | ">=" | "==";
  rhs: number;
}

interface MathModelFormProps {
  problemType: "minimize" | "maximize";
  onProblemTypeChange: (v: "minimize" | "maximize") => void;
  numVars: number;
  onNumVarsChange: (v: string) => void;
  objective: number[];
  onObjectiveChange: (index: number, val: string) => void;
  constraints: Constraint[];
  onConstraintChange: (index: number, coeffIndex: number, val: string) => void;
  onConstraintTypeChange: (index: number, type: any) => void;
  onConstraintRhsChange: (index: number, val: string) => void;
  onAddConstraint: () => void;
  onRemoveConstraint: (index: number) => void;
  
  // Opicionais para problemas discretos
  integerVars?: boolean[];
  onIntegerVarChange?: (index: number, checked: boolean) => void;
  showIntegerVars?: boolean;
}

export function MathModelForm({
  problemType,
  onProblemTypeChange,
  numVars,
  onNumVarsChange,
  objective,
  onObjectiveChange,
  constraints,
  onConstraintChange,
  onConstraintTypeChange,
  onConstraintRhsChange,
  onAddConstraint,
  onRemoveConstraint,
  integerVars,
  onIntegerVarChange,
  showIntegerVars = false,
}: MathModelFormProps) {
  return (
    <div className="space-y-6">
      {/* Problem Type and Variables */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="problem-type">Tipo de Problema</Label>
          <Select value={problemType} onValueChange={onProblemTypeChange}>
            <SelectTrigger id="problem-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimize">Minimização</SelectItem>
              <SelectItem value="maximize">Maximização</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="num-vars">Número de Variáveis</Label>
          <Input
            id="num-vars"
            type="number"
            min="1"
            max="10"
            value={numVars}
            onChange={(e) => onNumVarsChange(e.target.value)}
          />
        </div>
      </div>

      {showIntegerVars && integerVars && onIntegerVarChange && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Variáveis Inteiras</Label>
          <div className="flex flex-wrap gap-4">
            {integerVars.map((isInt, i) => (
              <div key={`int-${i}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`int-var-${i}`}
                  checked={isInt}
                  onCheckedChange={(c) => onIntegerVarChange(i, !!c)}
                />
                <Label htmlFor={`int-var-${i}`} className="font-mono">
                  x<sub>{i + 1}</sub>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objective Function */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
        <Label className="text-base font-semibold">Função Objetivo</Label>
        <div className="flex flex-wrap items-center gap-2 text-lg">
          <span className="font-semibold text-primary">
            {problemType === "minimize" ? "Min" : "Max"} Z =
          </span>
          {objective.map((coef, i) => (
            <div key={`obj-${i}`} className="flex items-center gap-2">
              {i > 0 && <span>+</span>}
              <Input
                type="number"
                step="any"
                value={coef}
                onChange={(e) => onObjectiveChange(i, e.target.value)}
                className="w-20 text-center font-mono"
                aria-label={`Coeficiente da variável x${i + 1} na função objetivo`}
              />
              <span className="font-mono">
                x<sub>{i + 1}</sub>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Restrições (Sujeito a)</Label>
        <div className="space-y-3">
          {constraints.map((constraint, i) => {
            const cType = constraint.type || constraint.sense;
            return (
              <div key={`const-${i}`} className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 rounded-lg border">
                {constraint.coefficients.map((coef, j) => (
                  <div key={`const-${i}-coef-${j}`} className="flex items-center gap-2">
                    {j > 0 && <span>+</span>}
                    <Input
                      type="number"
                      step="any"
                      value={coef}
                      onChange={(e) => onConstraintChange(i, j, e.target.value)}
                      className="w-20 text-center font-mono"
                      aria-label={`Coeficiente da variável x${j + 1} na restrição ${i + 1}`}
                    />
                    <span className="font-mono">
                      x<sub>{j + 1}</sub>
                    </span>
                  </div>
                ))}
                
                <Select
                  value={cType === "==" ? "=" : cType}
                  onValueChange={(v) => onConstraintTypeChange(i, v)}
                >
                  <SelectTrigger className="w-20 mx-2 font-mono" aria-label={`Tipo de restrição ${i + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<=">
                      <span className="sr-only">Menor ou igual</span>
                      <span aria-hidden="true">≤</span>
                    </SelectItem>
                    <SelectItem value=">=">
                      <span className="sr-only">Maior ou igual</span>
                      <span aria-hidden="true">≥</span>
                    </SelectItem>
                    <SelectItem value="=">
                      <span className="sr-only">Igual a</span>
                      <span aria-hidden="true">=</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="number"
                  step="any"
                  value={constraint.rhs}
                  onChange={(e) => onConstraintRhsChange(i, e.target.value)}
                  className="w-24 text-center font-mono"
                  aria-label={`Valor do lado direito da restrição ${i + 1}`}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveConstraint(i)}
                  aria-label="Remover restrição"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={onAddConstraint}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Restrição
        </Button>
      </div>
    </div>
  );
}
