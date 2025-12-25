"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ConstraintData {
  coefficients: number[];
  type: "<=" | ">=" | "=";
  rhs: number;
  name: string;
}

interface FeasibleRegionChartProps {
  constraints: ConstraintData[];
  solution: number[];
  objective: number[];
  problemType: "minimize" | "maximize";
}

export function FeasibleRegionChart({
  constraints,
  solution,
  objective,
  problemType,
}: FeasibleRegionChartProps) {
  const bounds = useMemo(() => {
    let maxX = 10;
    let maxY = 10;

    // Analisar interceptos das restrições
    constraints.forEach((c) => {
      const [a, b] = c.coefficients;
      const rhs = c.rhs;
      if (a !== 0) maxX = Math.max(maxX, Math.abs(rhs / a));
      if (b !== 0) maxY = Math.max(maxY, Math.abs(rhs / b));
    });

    // Considerar a solução
    if (solution[0] > 0) maxX = Math.max(maxX, solution[0]);
    if (solution[1] > 0) maxY = Math.max(maxY, solution[1]);

    return {
      maxX: Math.ceil(maxX * 1.3),
      maxY: Math.ceil(maxY * 1.3),
    };
  }, [constraints, solution]);

  const feasibleRegion = useMemo(() => {
    const vertices: Array<{ x: number; y: number }> = [];

    // Adicionar origem se for factível
    if (isPointFeasible(0, 0, constraints)) {
      vertices.push({ x: 0, y: 0 });
    }

    // Interceptos com os eixos
    constraints.forEach((constraint) => {
      const [a, b] = constraint.coefficients;
      const c = constraint.rhs;

      // Intercepto com eixo X (y=0)
      if (a !== 0) {
        const x = c / a;
        if (x >= 0 && x <= bounds.maxX && isPointFeasible(x, 0, constraints)) {
          vertices.push({ x, y: 0 });
        }
      }

      // Intercepto com eixo Y (x=0)
      if (b !== 0) {
        const y = c / b;
        if (y >= 0 && y <= bounds.maxY && isPointFeasible(0, y, constraints)) {
          vertices.push({ x: 0, y });
        }
      }
    });

    // Interseções entre pares de restrições
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        const intersection = getIntersection(constraints[i], constraints[j]);
        if (
          intersection &&
          intersection.x >= 0 &&
          intersection.y >= 0 &&
          intersection.x <= bounds.maxX &&
          intersection.y <= bounds.maxY &&
          isPointFeasible(intersection.x, intersection.y, constraints)
        ) {
          vertices.push(intersection);
        }
      }
    }

    // Interseções das restrições com os limites do gráfico
    constraints.forEach((constraint) => {
      const [a, b] = constraint.coefficients;
      const c = constraint.rhs;

      if (b !== 0) {
        // Interseção com x = maxX
        const y = (c - a * bounds.maxX) / b;
        if (
          y >= 0 &&
          y <= bounds.maxY &&
          isPointFeasible(bounds.maxX, y, constraints)
        ) {
          vertices.push({ x: bounds.maxX, y });
        }
      }

      if (a !== 0) {
        // Interseção com y = maxY
        const x = (c - b * bounds.maxY) / a;
        if (
          x >= 0 &&
          x <= bounds.maxX &&
          isPointFeasible(x, bounds.maxY, constraints)
        ) {
          vertices.push({ x, y: bounds.maxY });
        }
      }
    });

    // Remover duplicatas e ordenar em sentido anti-horário
    const uniqueVertices = removeDuplicates(vertices);
    return sortVerticesCounterClockwise(uniqueVertices);
  }, [constraints, bounds]);

  const constraintLinesData = useMemo(() => {
    const allData: any[] = [];
    const numPoints = 200;

    for (let i = 0; i <= numPoints; i++) {
      const x = (bounds.maxX / numPoints) * i;
      const point: any = { x };

      constraints.forEach((constraint, idx) => {
        const [a, b] = constraint.coefficients;
        const c = constraint.rhs;
        if (b !== 0) {
          const y = (c - a * x) / b;
          if (y >= -1 && y <= bounds.maxY + 1) {
            point[`constraint_${idx}`] = y;
          }
        }
      });

      // Adicionar região factível
      if (feasibleRegion.length > 0) {
        // Interpolar o valor Y da região factível para este X
        const regionY = interpolateFeasibleRegion(x, feasibleRegion);
        if (regionY !== null) {
          point.feasible = regionY;
        }
      }

      allData.push(point);
    }

    return allData;
  }, [constraints, bounds, feasibleRegion]);

  const optimalPoint = useMemo(() => {
    return [{ x: solution[0], y: solution[1] }];
  }, [solution]);

  return (
    <div className="w-full" role="img" aria-label="Gráfico da região factível">
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={constraintLinesData}
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, bounds.maxX]}
            label={{
              value: "x₁",
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 16, fill: "hsl(var(--foreground))" },
            }}
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--foreground))" }}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, bounds.maxY]}
            label={{
              value: "x₂",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 16, fill: "hsl(var(--foreground))" },
            }}
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--foreground))" }}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value: any) =>
              typeof value === "number" ? value.toFixed(2) : value
            }
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
            )}
          />

          {/* Região factível preenchida */}
          {feasibleRegion.length > 0 && (
            <Area
              type="monotone"
              dataKey="feasible"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              stroke="none"
              name="Região Factível"
            />
          )}

          {/* Linhas das restrições */}
          {constraints.map((constraint, idx) => (
            <Line
              key={`constraint-${idx}`}
              type="monotone"
              dataKey={`constraint_${idx}`}
              stroke={getConstraintColor(idx)}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name={constraint.name}
              connectNulls
            />
          ))}

          {/* Ponto ótimo */}
          <Scatter
            data={optimalPoint}
            fill="hsl(var(--destructive))"
            shape="circle"
            name="Solução Ótima"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Descrição textual para acessibilidade */}
      <div className="mt-4 space-y-2 text-sm" aria-live="polite">
        <p className="font-semibold">Descrição do Gráfico:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            Solução ótima: x₁ = {solution[0].toFixed(2)}, x₂ ={" "}
            {solution[1].toFixed(2)}
          </li>
          {constraints.map((c, idx) => (
            <li key={`desc-${idx}`} style={{ color: getConstraintColor(idx) }}>
              {c.name}: {c.coefficients[0].toFixed(2)}x₁{" "}
              {c.coefficients[1] >= 0 ? "+" : ""} {c.coefficients[1].toFixed(2)}
              x₂ {c.type} {c.rhs.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function isPointFeasible(
  x: number,
  y: number,
  constraints: ConstraintData[]
): boolean {
  const EPSILON = 1e-6;

  for (const constraint of constraints) {
    const [a, b] = constraint.coefficients;
    const value = a * x + b * y;
    const rhs = constraint.rhs;

    if (constraint.type === "<=") {
      if (value > rhs + EPSILON) return false;
    } else if (constraint.type === ">=") {
      if (value < rhs - EPSILON) return false;
    } else {
      // type === "="
      if (Math.abs(value - rhs) > EPSILON) return false;
    }
  }

  return x >= -EPSILON && y >= -EPSILON;
}

function getIntersection(
  c1: ConstraintData,
  c2: ConstraintData
): { x: number; y: number } | null {
  const [a1, b1] = c1.coefficients;
  const rhs1 = c1.rhs;
  const [a2, b2] = c2.coefficients;
  const rhs2 = c2.rhs;

  const det = a1 * b2 - a2 * b1;

  if (Math.abs(det) < 1e-10) {
    return null; // Linhas paralelas
  }

  const x = (rhs1 * b2 - rhs2 * b1) / det;
  const y = (a1 * rhs2 - a2 * rhs1) / det;

  return { x, y };
}

function removeDuplicates(
  vertices: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  const EPSILON = 1e-6;
  const unique: Array<{ x: number; y: number }> = [];

  for (const v of vertices) {
    const isDuplicate = unique.some(
      (u) => Math.abs(u.x - v.x) < EPSILON && Math.abs(u.y - v.y) < EPSILON
    );
    if (!isDuplicate) {
      unique.push(v);
    }
  }

  return unique;
}

function sortVerticesCounterClockwise(
  vertices: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if (vertices.length === 0) return [];

  // Calcular centroide
  const cx = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const cy = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;

  // Ordenar por ângulo em relação ao centroide
  return vertices.sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });
}

function interpolateFeasibleRegion(
  x: number,
  region: Array<{ x: number; y: number }>
): number | null {
  if (region.length === 0) return null;

  // Encontrar os pontos da região que envolvem este X
  const pointsAtX = region.filter((p) => Math.abs(p.x - x) < 0.01);
  if (pointsAtX.length > 0) {
    return Math.max(...pointsAtX.map((p) => p.y));
  }

  // Encontrar segmentos que cruzam este X
  const yValues: number[] = [];
  for (let i = 0; i < region.length; i++) {
    const p1 = region[i];
    const p2 = region[(i + 1) % region.length];

    if ((p1.x <= x && p2.x >= x) || (p1.x >= x && p2.x <= x)) {
      if (Math.abs(p2.x - p1.x) > 1e-6) {
        const t = (x - p1.x) / (p2.x - p1.x);
        const y = p1.y + t * (p2.y - p1.y);
        yValues.push(y);
      }
    }
  }

  return yValues.length > 0 ? Math.max(...yValues) : null;
}

function getConstraintColor(index: number): string {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  return colors[index % colors.length];
}
