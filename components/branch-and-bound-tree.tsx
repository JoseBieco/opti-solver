"use client";

import { useState, useMemo } from "react";
import type { NodeRecord } from "@/lib/optimization/BranchAndBound";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  id: number;
  parentId: number;
  constraints: string;
  objectiveValue: number | string;
  status: string;
  solution: string;
  children: TreeNode[];
  depth: number;
}

interface BranchAndBoundTreeProps {
  history: NodeRecord[];
}

export function BranchAndBoundTree({ history }: BranchAndBoundTreeProps) {
  const [selectedNode, setSelectedNode] = useState<NodeRecord | null>(null);
  const [zoom, setZoom] = useState(1);

  const tree = useMemo(() => {
    if (history.length === 0) return null;

    const nodeMap = new Map<number, TreeNode>();

    for (const record of history) {
      nodeMap.set(record.id, {
        ...record,
        children: [],
        depth: 0,
      });
    }

    let root: TreeNode | null = null;
    for (const node of nodeMap.values()) {
      if (node.parentId === 0) {
        root = node;
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
          node.depth = parent.depth + 1;
        }
      }
    }

    return root;
  }, [history]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Optimal":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50";
      case "Integer Found":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50";
      case "Branched":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50";
      case "Pruned (Bound)":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50";
      case "Infeasible":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const renderNode = (node: TreeNode) => {
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <button
          onClick={() =>
            setSelectedNode(history.find((h) => h.id === node.id) || null)
          }
          className={cn(
            "relative px-4 py-3 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-w-32 cursor-pointer",
            isSelected
              ? "border-primary bg-primary/10 shadow-lg"
              : "border-border bg-card hover:border-primary/50"
          )}
          aria-pressed={isSelected}
          aria-label={`Nó ${node.id}: ${node.constraints}, Status: ${node.status}`}
        >
          <div className="text-center space-y-1">
            <div className="font-mono text-sm font-bold">Nó {node.id}</div>
            <div className="text-xs font-mono text-muted-foreground truncate max-w-24">
              {typeof node.objectiveValue === "number"
                ? node.objectiveValue.toFixed(2)
                : node.objectiveValue}
            </div>
          </div>
        </button>

        {hasChildren && (
          <>
            <div className="flex items-center justify-center h-8 relative w-full">
              <div
                className="absolute top-0 h-8 w-0.5 bg-border"
                aria-hidden="true"
              />
            </div>
            <div className="flex gap-8 relative">
              {node.children.length > 1 && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-border"
                  aria-hidden="true"
                />
              )}
              {node.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="h-8 w-0.5 bg-border" aria-hidden="true" />
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  if (!tree) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma árvore para exibir
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      role="region"
      aria-label="Árvore Branch and Bound"
    >
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
        <span className="text-sm font-medium">
          Zoom: {(zoom * 100).toFixed(0)}%
        </span>
        <div className="flex gap-2">
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="outline"
            disabled={zoom <= 0.5}
            aria-label="Diminuir zoom"
            className="cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleResetZoom}
            size="sm"
            variant="outline"
            disabled={zoom === 1}
            aria-label="Resetar zoom"
            className="cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="outline"
            disabled={zoom >= 2}
            aria-label="Aumentar zoom"
            className="cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto pb-4 max-h-[600px] border rounded-lg">
        <div
          className="inline-flex min-w-full justify-center p-8 bg-muted/30 transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {renderNode(tree)}
        </div>
      </div>

      {selectedNode ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Detalhes do Nó {selectedNode.id}
              </h3>
              <Badge
                className={cn("border", getStatusColor(selectedNode.status))}
              >
                {selectedNode.status}
              </Badge>
            </div>

            <div className="grid gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Restrições Adicionadas
                </div>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {selectedNode.constraints}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Valor da Relaxação
                  </div>
                  <div className="font-mono text-lg font-semibold">
                    {typeof selectedNode.objectiveValue === "number"
                      ? selectedNode.objectiveValue.toFixed(4)
                      : selectedNode.objectiveValue}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Solução
                  </div>
                  <div className="font-mono text-sm">
                    {selectedNode.solution}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Tipo de Poda/Status
                </div>
                <div className="space-y-1 text-sm">
                  {selectedNode.status === "Infeasible" && (
                    <p>
                      Este nó foi podado por inviabilidade. A relaxação linear
                      não tem solução viável.
                    </p>
                  )}
                  {selectedNode.status === "Pruned (Bound)" && (
                    <p>
                      Este nó foi podado por limite (bound). O valor da
                      relaxação é pior que a melhor solução inteira encontrada.
                    </p>
                  )}
                  {selectedNode.status === "Integer Found" && (
                    <p>
                      Este nó encontrou uma solução inteira viável. Esta solução
                      foi registrada como candidata à solução ótima.
                    </p>
                  )}
                  {selectedNode.status === "Branched" && (
                    <p>
                      Este nó foi ramificado. A solução da relaxação era
                      fracionária, então foram criados dois subproblemas.
                    </p>
                  )}
                  {selectedNode.status === "Optimal" && (
                    <p>
                      Este é o nó raiz com a relaxação linear inicial do
                      problema.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Clique em um nó para ver os detalhes</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2" aria-label="Legenda dos status dos nós">
        <h4 className="text-sm font-semibold">Legenda:</h4>
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("border", getStatusColor("Integer Found"))}>
            Solução Inteira Encontrada
          </Badge>
          <Badge className={cn("border", getStatusColor("Branched"))}>
            Ramificado
          </Badge>
          <Badge className={cn("border", getStatusColor("Pruned (Bound)"))}>
            Podado por Limite
          </Badge>
          <Badge className={cn("border", getStatusColor("Infeasible"))}>
            Inviável
          </Badge>
        </div>
      </div>
    </div>
  );
}
