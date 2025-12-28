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
import type { JSX } from "react";

interface BranchAndCutTreeProps {
  nodeHistory: BCNodeRecord[];
  cutHistory: CutRecord[];
}

interface TreeNode {
  id: number;
  parentId: number;
  depth: number;
  x: number;
  y: number;
  children: TreeNode[];
  data: BCNodeRecord;
  cutsApplied: CutRecord[];
  isOptimal?: boolean;
}

export function BranchAndCutTree({
  nodeHistory,
  cutHistory,
}: BranchAndCutTreeProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => {
    if (nodeHistory.length === 0) return null;

    const nodeMap = new Map<number, TreeNode>();

    const integerNodes = nodeHistory.filter((n) => n.status === "Inteiro");
    let optimalNodeId: number | null = null;
    if (integerNodes.length > 0) {
      const optimalNode = integerNodes.reduce((best, current) =>
        current.objectiveValue < best.objectiveValue ? current : best
      );
      optimalNodeId = optimalNode.id;
    }

    nodeHistory.forEach((record) => {
      nodeMap.set(record.id, {
        id: record.id,
        parentId: record.parentId,
        depth: record.depth,
        x: 0,
        y: 0,
        children: [],
        data: record,
        cutsApplied: cutHistory.filter(
          (cut) => cut.nodeId === record.id && cut.status === "Applied"
        ),
        isOptimal: record.id === optimalNodeId,
      });
    });

    let root: TreeNode | null = null;
    nodeMap.forEach((node) => {
      if (node.parentId === -1) {
        root = node;
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    if (!root) {
      return null;
    }

    const calculatePositions = (node: TreeNode, depth = 0): number => {
      node.y = depth * 120;

      if (node.children.length === 0) {
        return 1;
      }

      let totalWidth = 0;
      const childWidths: number[] = [];

      node.children.forEach((child) => {
        const width = calculatePositions(child, depth + 1);
        childWidths.push(width);
        totalWidth += width;
      });

      const spacing = 180;
      let currentOffset = -(totalWidth * spacing) / 2;

      node.children.forEach((child, index) => {
        const childWidth = childWidths[index];
        child.x = currentOffset + (childWidth * spacing) / 2;
        currentOffset += childWidth * spacing;
      });

      node.x = 0;

      return totalWidth;
    };

    calculatePositions(root, 0);

    return root;
  }, [nodeHistory, cutHistory]);

  useEffect(() => {
    if (tree && containerRef.current && pan.x === 0 && pan.y === 0) {
      const container = containerRef.current;
      const centerX = container.clientWidth / 2;
      const centerY = 50;
      setPan({ x: centerX, y: centerY });
    }
  }, [tree]);

  const renderNode = (node: TreeNode): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    node.children.forEach((child) => {
      elements.push(
        <line
          key={`line-${node.id}-${child.id}`}
          x1={node.x}
          y1={node.y + 30}
          x2={child.x}
          y2={child.y - 30}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray={node.data.status === "Branched" ? "5,5" : "none"}
          className="transition-all"
        />
      );
    });

    const getNodeColor = (status: BCNodeRecord["status"]) => {
      switch (status) {
        case "Inteiro":
          return "fill-green-500 dark:fill-green-600";
        case "Infeasible":
          return "fill-red-500 dark:fill-red-600";
        case "Pruned (Bound)":
          return "fill-amber-500 dark:fill-amber-600";
        case "Branched":
          return "fill-blue-500 dark:fill-blue-600";
        case "Corte Gerado":
          return "fill-purple-500 dark:fill-purple-600";
        default:
          return "fill-gray-500 dark:fill-gray-600";
      }
    };

    const isSelected = selectedNode?.id === node.id;
    const hasCuts = node.cutsApplied.length > 0;

    elements.push(
      <g
        key={`node-${node.id}`}
        className="cursor-pointer"
        onClick={() => setSelectedNode(node)}
      >
        {node.isOptimal && (
          <circle
            cx={node.x}
            cy={node.y}
            r={38}
            className="fill-none stroke-yellow-400 dark:stroke-yellow-500 animate-pulse"
            strokeWidth={3}
          />
        )}

        <circle
          cx={node.x}
          cy={node.y}
          r={hasCuts ? 32 : 28}
          className={`${getNodeColor(node.data.status)} ${
            isSelected ? "stroke-foreground" : "stroke-background"
          } transition-all hover:stroke-foreground`}
          strokeWidth={isSelected ? 4 : 3}
        />

        {hasCuts && (
          <g transform={`translate(${node.x - 20}, ${node.y - 24})`}>
            <ScissorsIcon size={14} className="fill-white" />
          </g>
        )}

        <text
          x={node.x}
          y={hasCuts ? node.y + 8 : node.y + 5}
          textAnchor="middle"
          className="fill-white text-sm font-bold pointer-events-none select-none"
        >
          {node.id}
        </text>

        {hasCuts && (
          <>
            <circle
              cx={node.x + 20}
              cy={node.y - 20}
              r={10}
              className="fill-purple-600 stroke-background"
              strokeWidth={2}
            />
            <text
              x={node.x + 20}
              y={node.y - 16}
              textAnchor="middle"
              className="fill-white text-xs font-bold pointer-events-none select-none"
            >
              {node.cutsApplied.length}
            </text>
          </>
        )}

        {node.isOptimal && (
          <g transform={`translate(${node.x - 10}, ${node.y + 18})`}>
            <Star
              size={20}
              className="fill-yellow-400 stroke-yellow-500 dark:fill-yellow-500 dark:stroke-yellow-600"
              strokeWidth={2}
            />
          </g>
        )}
      </g>
    );

    node.children.forEach((child) => {
      elements.push(...renderNode(child));
    });

    return elements;
  };

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
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Nenhuma árvore para visualizar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleZoomOut}
          size="sm"
          variant="outline"
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-mono w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          onClick={handleZoomIn}
          size="sm"
          variant="outline"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleReset}
          size="sm"
          variant="outline"
          aria-label="Resetar visualização"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4">
        <div
          ref={containerRef}
          className="flex-1 border rounded-lg overflow-hidden bg-muted/20 relative"
          style={{ height: "600px", cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} width="100%" height="100%" className="select-none">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {tree && renderNode(tree)}
            </g>
          </svg>
        </div>

        {selectedNode && (
          <Card className="w-80 h-fit">
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Nó
                </p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  #{selectedNode.id}
                  {selectedNode.isOptimal && (
                    <span className="flex items-center gap-1 text-sm font-normal text-yellow-600 dark:text-yellow-500">
                      <Star
                        size={16}
                        className="fill-yellow-400 stroke-yellow-500"
                      />
                      Ótima
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Status
                </p>
                <p className="text-sm">{selectedNode.data.status}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Valor Objetivo
                </p>
                <p className="text-sm font-mono">
                  {selectedNode.data.objectiveValue}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Solução
                </p>
                <p className="text-sm font-mono break-words">
                  {selectedNode.data.solution}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Profundidade
                </p>
                <p className="text-sm">{selectedNode.data.depth}</p>
              </div>

              {selectedNode.cutsApplied.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                    <Scissors
                      className="h-4 w-4 text-purple-600"
                      aria-hidden="true"
                    />
                    Cortes de Gomory Aplicados (
                    {selectedNode.cutsApplied.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedNode.cutsApplied.map((cut, idx) => (
                      <Card
                        key={`detail-cut-${idx}`}
                        className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                      >
                        <CardContent className="p-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Iteração {cut.iteration}
                          </p>
                          <p className="text-xs font-mono">
                            {cut.generatedConstraint}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
