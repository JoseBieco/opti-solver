import { OptimizationResult } from "@/lib/optimization/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Info } from "lucide-react";

interface OptimizationResultsProps {
  result: OptimizationResult;
  problemType?: "maximize" | "minimize";
  iterations?: {
    primal?: number;
    dual?: number;
    nodes?: number;
    cuts?: number;
  };
  integerVars?: boolean[];
}

export function OptimizationResults({
  result,
  problemType = "maximize",
  iterations,
  integerVars,
}: OptimizationResultsProps) {
  
  // Status config
  const isOptimal = result.status.toLowerCase().includes("optimal");
  const isFeasible = result.status.toLowerCase().includes("feasible") || result.status.toLowerCase().includes("integer found");
  const isError = result.status.toLowerCase().includes("unbounded") || result.status.toLowerCase().includes("infeasible") || result.status.toLowerCase().includes("error");
  
  let StatusIcon = AlertCircle;
  let statusColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  
  if (isOptimal) {
    StatusIcon = CheckCircle2;
    statusColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
  } else if (isError) {
    StatusIcon = XCircle;
    statusColor = "bg-destructive/10 text-destructive border-destructive/20";
  } else if (isFeasible) {
    StatusIcon = CheckCircle2;
    statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  }

  return (
    <Card className="overflow-hidden border-2 shadow-sm">
      <div className={`h-1.5 w-full ${isOptimal ? "bg-green-500" : isError ? "bg-destructive" : "bg-blue-500"}`} />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Resultados da Otimização
            </CardTitle>
            <CardDescription className="mt-1.5">
              Solução encontrada pelo método
            </CardDescription>
          </div>
          <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium ${statusColor}`}>
            <StatusIcon className="h-4 w-4" aria-hidden="true" />
            {result.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        
        {/* Main Result Hero */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-primary/5 rounded-xl p-6 border border-primary/10 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Valor Ótimo (Z)</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold font-mono text-primary tracking-tight">
              {result.objectiveValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </div>
            {problemType && (
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {problemType === "maximize" ? "Maximização" : "Minimização"}
              </div>
            )}
          </div>
          
          {/* Iterations/Stats Box */}
          {iterations && (
            <div className="flex-1 grid grid-cols-2 gap-3">
              {iterations.primal !== undefined && (
                <div className="bg-muted/30 rounded-lg p-4 border flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fase Primal</span>
                  <span className="text-2xl font-mono font-medium">{iterations.primal} <span className="text-sm font-sans text-muted-foreground">iter</span></span>
                </div>
              )}
              {iterations.dual !== undefined && (
                <div className="bg-muted/30 rounded-lg p-4 border flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fase Dual</span>
                  <span className="text-2xl font-mono font-medium">{iterations.dual} <span className="text-sm font-sans text-muted-foreground">iter</span></span>
                </div>
              )}
              {iterations.nodes !== undefined && (
                <div className="bg-muted/30 rounded-lg p-4 border flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nós Visitados</span>
                  <span className="text-2xl font-mono font-medium">{iterations.nodes}</span>
                </div>
              )}
              {iterations.cuts !== undefined && (
                <div className="bg-muted/30 rounded-lg p-4 border flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cortes Adic.</span>
                  <span className="text-2xl font-mono font-medium">{iterations.cuts}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Variables List */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            Valores das Variáveis
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {result.solution.map((value, i) => {
              const isInteger = integerVars ? integerVars[i] : false;
              return (
                <div
                  key={`sol-${i}`}
                  className="relative flex flex-col p-3 bg-card border rounded-lg shadow-sm group hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      x<sub>{i + 1}</sub>
                    </span>
                    {isInteger && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono" title="Variável inteira">
                        INT
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-lg font-medium">
                    {value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
