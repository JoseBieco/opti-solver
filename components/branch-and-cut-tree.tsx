"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  ScissorsIcon,
  Star,
} from "lucide-react";
import type { BCNodeRecord, CutRecord } from "@/lib/optimization/types";

export interface TreeProps {
  nodeHistory: (BCNodeRecord | any)[];
  cutHistory?: CutRecord[];
}

// Estrutura interna para o layout
interface LayoutNode {
  id: number;
  parentId: number;
  x: number; // Coordenada Absoluta X
  y: number; // Coordenada Absoluta Y
  data: any;
  cutsApplied: CutRecord[];
  isOptimal: boolean;
  children: LayoutNode[]; // Mantemos a referência para percurso, se necessário
}

interface TreeLayout {
  nodes: LayoutNode[];
  edges: { from: LayoutNode; to: LayoutNode; type: string }[];
}

export function BranchAndCutTree({ nodeHistory, cutHistory = [] }: TreeProps) {
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Lógica de Layout (Calcula coordenadas absolutas) ---
  const layout = useMemo<TreeLayout | null>(() => {
    if (nodeHistory.length === 0) return null;

    // 1. Preparação dos dados e identificação do Ótimo
    const integerNodes = nodeHistory.filter(
      (n: any) => n.status === "Inteiro" || n.status === "Integer Found"
    );
    let optimalNodeId: number | null = null;
    if (integerNodes.length > 0) {
      const getVal = (n: any) =>
        typeof n.objectiveValue === "string"
          ? parseFloat(n.objectiveValue)
          : n.objectiveValue;
      const optimalNode = integerNodes.reduce((best: any, current: any) =>
        getVal(current) < getVal(best) ? current : best
      );
      optimalNodeId = optimalNode.id;
    }

    // Mapa temporário para construir a árvore
    const nodeMap = new Map<number, any>();
    nodeHistory.forEach((record: any) => {
      nodeMap.set(record.id, {
        ...record,
        children: [],
        cuts: cutHistory.filter(
          (c) => c.nodeId === record.id && c.status === "Applied"
        ),
        isOptimal: record.id === optimalNodeId,
        // Campos de layout temporários
        relX: 0,
        absX: 0,
        absY: 0,
        width: 0,
      });
    });

    // 2. Construir Hierarquia
    let root: any = null;
    const nodesList = Array.from(nodeMap.values()).sort((a, b) => a.id - b.id);

    nodesList.forEach((node) => {
      if (node.parentId === -1) {
        root = node;
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        } else if (!root) {
          // Fallback para B&B onde raiz pode não ter parent -1 explícito
          root = node;
        }
      }
    });

    if (!root) return null;

    // 3. Algoritmo de Layout (Reingold-Tilford simplificado)
    // Passo A: Calcular larguras e posições RELATIVAS (bottom-up)
    const calculateRelativePositions = (node: any, depth: number) => {
      node.depth = depth;

      if (node.children.length === 0) {
        node.width = 160; // Largura fixa para nó folha
        return;
      }

      let totalWidth = 0;
      node.children.forEach((child: any) => {
        calculateRelativePositions(child, depth + 1);
        totalWidth += child.width;
      });

      node.width = totalWidth;

      // Distribui os filhos centralizados abaixo do pai
      let currentX = -totalWidth / 2;
      node.children.forEach((child: any) => {
        child.relX = currentX + child.width / 2;
        currentX += child.width;
      });
    };

    calculateRelativePositions(root, 0);

    // Passo B: Calcular coordenadas ABSOLUTAS (top-down)
    const finalNodes: LayoutNode[] = [];
    const finalEdges: { from: LayoutNode; to: LayoutNode; type: string }[] = [];

    const calculateAbsoluteCoordinates = (node: any, x: number, y: number) => {
      const layoutNode: LayoutNode = {
        id: node.id,
        parentId: node.parentId,
        x: x,
        y: y,
        data: node,
        cutsApplied: node.cuts,
        isOptimal: node.isOptimal,
        children: [], // Será preenchido se necessário, mas para render basta flat
      };

      finalNodes.push(layoutNode);

      node.children.forEach((child: any) => {
        // O X do filho é o X do pai + o deslocamento relativo do filho
        const childAbsX = x + child.relX;
        const childAbsY = y + 120; // Espaçamento vertical fixo

        const childLayoutNode = calculateAbsoluteCoordinates(
          child,
          childAbsX,
          childAbsY
        );

        finalEdges.push({
          from: layoutNode,
          to: childLayoutNode,
          type: child.status,
        });
      });

      return layoutNode;
    };

    calculateAbsoluteCoordinates(root, 0, 50); // 50 é o padding inicial do topo

    return { nodes: finalNodes, edges: finalEdges };
  }, [nodeHistory, cutHistory]);

  // Centralizar a árvore na primeira renderização
  useEffect(() => {
    if (layout && containerRef.current && pan.x === 0 && pan.y === 0) {
      const container = containerRef.current;
      setPan({ x: container.clientWidth / 2, y: 50 });
    }
  }, [layout]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Helpers de Estilo
  const getNodeColor = (status: string) => {
    switch (status) {
      case "Inteiro":
      case "Integer Found":
        return "fill-green-500 dark:fill-green-600";
      case "Infeasible":
        return "fill-red-500 dark:fill-red-600";
      case "Pruned (Bound)":
        return "fill-amber-500 dark:fill-amber-600";
      case "Branched":
        return "fill-blue-500 dark:fill-blue-600";
      case "Corte Gerado":
        return "fill-purple-500 dark:fill-purple-600";
      case "Optimal":
        return "fill-blue-400 dark:fill-blue-500";
      default:
        return "fill-gray-500 dark:fill-gray-600";
    }
  };

  if (!layout) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <p>Aguardando dados da solução...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de Zoom */}
      <div className="flex items-center gap-2 justify-end">
        <Button onClick={handleZoomOut} size="sm" variant="outline">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-mono w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button onClick={handleZoomIn} size="sm" variant="outline">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button onClick={handleReset} size="sm" variant="outline">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Área do Gráfico */}
        <div
          ref={containerRef}
          className="flex-1 border rounded-lg overflow-hidden bg-muted/10 relative shadow-inner"
          style={{ height: "600px", cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} width="100%" height="100%" className="select-none">
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  className="text-border/20"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* 1. Camada de Arestas (Linhas) */}
              {layout.edges.map((edge, i) => (
                <line
                  key={`edge-${i}`}
                  x1={edge.from.x}
                  y1={edge.from.y + 28} // Sai de baixo do pai
                  x2={edge.to.x}
                  y2={edge.to.y - 28} // Chega em cima do filho
                  className="stroke-gray-400 dark:stroke-gray-500"
                  strokeWidth="2"
                  strokeDasharray={edge.type === "Branched" ? "5,5" : "none"}
                />
              ))}

              {/* 2. Camada de Nós */}
              {layout.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const hasCuts = node.cutsApplied.length > 0;

                return (
                  <g
                    key={`node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {node.isOptimal && (
                      <circle
                        r={38}
                        className="fill-none stroke-yellow-400 animate-pulse"
                        strokeWidth={3}
                      />
                    )}

                    <circle
                      r={hasCuts ? 30 : 26}
                      className={`${getNodeColor(node.data.status)} ${
                        isSelected ? "stroke-foreground" : "stroke-background"
                      } transition-all hover:stroke-foreground`}
                      strokeWidth={isSelected ? 4 : 3}
                      stroke={isSelected ? "currentColor" : "none"}
                    />

                    {hasCuts && (
                      <g transform="translate(-20, -24)">
                        <ScissorsIcon size={14} className="fill-white" />
                      </g>
                    )}

                    <text
                      y={5}
                      textAnchor="middle"
                      className="fill-white font-bold text-sm pointer-events-none select-none"
                    >
                      {node.id}
                    </text>

                    {hasCuts && (
                      <g transform="translate(20, -20)">
                        <circle
                          r={10}
                          className="fill-purple-700 stroke-background"
                          strokeWidth={2}
                        />
                        <text
                          y={4}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-bold select-none"
                        >
                          {node.cutsApplied.length}
                        </text>
                      </g>
                    )}

                    {node.isOptimal && (
                      <g transform="translate(-10, 28)">
                        <Star
                          size={20}
                          className="fill-yellow-400 stroke-yellow-500"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Painel de Detalhes (Sidebar) */}
        {selectedNode && (
          <Card className="w-full lg:w-80 h-fit shadow-md">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nó #{selectedNode.id}
                  </p>
                </div>
                {selectedNode.isOptimal && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-200 dark:border-yellow-800 flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> Melhor Solução
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedNode.data.status}</p>
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Valor Obj.</p>
                  <p className="font-medium font-mono">
                    {typeof selectedNode.data.objectiveValue === "number"
                      ? selectedNode.data.objectiveValue.toFixed(4)
                      : selectedNode.data.objectiveValue}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Solução
                </p>
                <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all max-h-32 overflow-y-auto">
                  {selectedNode.data.solution || "N/A"}
                </div>
              </div>

              {selectedNode.cutsApplied.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Cortes ({selectedNode.cutsApplied.length})
                  </p>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {selectedNode.cutsApplied.map((cut, idx) => (
                      <div
                        key={idx}
                        className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded text-[10px] font-mono border border-purple-200 dark:border-purple-800"
                      >
                        {cut.generatedConstraint}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>Inteiro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span>Ramificado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span>Corte Gerado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500" />
          <span>Podado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>Inviável</span>
        </div>
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-purple-600" />
          <span>Tem cortes aplicados</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-500" />
          <span>Solução Ótima</span>
        </div>
      </div>
    </div>
  );
}
