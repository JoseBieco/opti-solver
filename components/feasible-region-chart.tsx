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
  ReferenceLine,
} from "recharts";
import { Star } from "lucide-react";

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

// Renderizador robusto para o ponto ótimo
const RenderOptimalPoint = (props: any) => {
  const { cx, cy } = props;

  // Verificação de segurança para coordenadas
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
      {/* Círculo pulsante (Halo) */}
      <circle r="15" fill="hsl(var(--destructive))" opacity="0.3">
        <animate
          attributeName="r"
          values="10;20;10"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Círculo Sólido Central */}
      <circle
        r="6"
        fill="hsl(var(--destructive))"
        stroke="white"
        strokeWidth="2"
      />

      {/* Estrela (Ícone) acima */}
      <g transform="translate(-8, -20)">
        <Star size={16} className="fill-yellow-400 stroke-yellow-600" />
      </g>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-md p-3 text-sm z-50">
        <p className="font-bold mb-2">x₁: {Number(label).toFixed(2)}</p>
        {payload.map((entry: any, index: number) => {
          if (entry.name === "Região Factível") return null;

          if (entry.name === "Solução Ótima") {
            // Pega o valor Y (x2) do ponto
            const valY = entry.payload.y;
            return (
              <div
                key={index}
                className="text-destructive font-bold mt-2 pt-2 border-t border-border"
              >
                ★ Solução Ótima (x₂ = {valY.toFixed(2)})
              </div>
            );
          }

          return (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-semibold text-muted-foreground">
                {entry.name}:
              </span>
              <span className="font-mono">
                {entry.payload[`equation_${entry.dataKey.split("_")[1]}`] ||
                  entry.value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function FeasibleRegionChart({
  constraints,
  solution,
  objective,
  problemType,
}: FeasibleRegionChartProps) {
  const bounds = useMemo(() => {
    let maxX = 10;
    let maxY = 10;

    constraints.forEach((c) => {
      const [a, b] = c.coefficients;
      const rhs = c.rhs;
      if (a !== 0) maxX = Math.max(maxX, Math.abs(rhs / a));
      if (b !== 0) maxY = Math.max(maxY, Math.abs(rhs / b));
    });

    if (solution[0] > 0) maxX = Math.max(maxX, solution[0]);
    if (solution[1] > 0) maxY = Math.max(maxY, solution[1]);

    return {
      maxX: Math.ceil(maxX * 1.1), // Margem menor para aproveitar espaço
      maxY: Math.ceil(maxY * 1.1),
    };
  }, [constraints, solution]);

  const formatEquation = (c: ConstraintData) => {
    const [a, b] = c.coefficients;
    return `${a}x₁ ${b >= 0 ? "+" : ""}${b}x₂ ${c.type} ${c.rhs}`;
  };

  const feasibleRegion = useMemo(() => {
    const vertices: Array<{ x: number; y: number }> = [];

    // Adiciona origem se válida
    if (isPointFeasible(0, 0, constraints)) vertices.push({ x: 0, y: 0 });

    // Interceptos
    constraints.forEach((constraint) => {
      const [a, b] = constraint.coefficients;
      const c = constraint.rhs;
      if (a !== 0) {
        const x = c / a;
        if (x >= 0 && x <= bounds.maxX && isPointFeasible(x, 0, constraints))
          vertices.push({ x, y: 0 });
      }
      if (b !== 0) {
        const y = c / b;
        if (y >= 0 && y <= bounds.maxY && isPointFeasible(0, y, constraints))
          vertices.push({ x: 0, y });
      }
    });

    // Interseções
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

    // Bordas do gráfico
    constraints.forEach((constraint) => {
      const [a, b] = constraint.coefficients;
      const c = constraint.rhs;
      if (b !== 0) {
        const y = (c - a * bounds.maxX) / b;
        if (
          y >= 0 &&
          y <= bounds.maxY &&
          isPointFeasible(bounds.maxX, y, constraints)
        )
          vertices.push({ x: bounds.maxX, y });
      }
      if (a !== 0) {
        const x = (c - b * bounds.maxY) / a;
        if (
          x >= 0 &&
          x <= bounds.maxX &&
          isPointFeasible(x, bounds.maxY, constraints)
        )
          vertices.push({ x, y: bounds.maxY });
      }
    });

    const uniqueVertices = removeDuplicates(vertices);
    return sortVerticesCounterClockwise(uniqueVertices);
  }, [constraints, bounds]);

  const chartData = useMemo(() => {
    const allData: any[] = [];
    const numPoints = 400;

    for (let i = 0; i <= numPoints; i++) {
      const x = (bounds.maxX / numPoints) * i;
      const point: any = { x };

      constraints.forEach((constraint, idx) => {
        const [a, b] = constraint.coefficients;
        const c = constraint.rhs;

        point[`equation_${idx}`] = formatEquation(constraint);

        if (b !== 0) {
          const y = (c - a * x) / b;
          // ALTERAÇÃO IMPORTANTE: Limite estrito de desenho [0, maxY]
          // Isso impede que a linha seja desenhada fora da área visível vertical
          if (y >= 0 && y <= bounds.maxY) {
            point[`constraint_${idx}`] = y;
          }
        }
      });

      if (feasibleRegion.length > 0) {
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
    // Garante que é um array válido para o Scatter
    if (solution && solution.length >= 2) {
      return [{ x: solution[0], y: solution[1] }];
    }
    return [];
  }, [solution]);

  return (
    <div className="w-full" role="img" aria-label="Gráfico da região factível">
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--stroke-chart)"
            opacity={0.5}
          />

          <ReferenceLine
            y={0}
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
          />
          <ReferenceLine
            x={0}
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
          />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, bounds.maxX]}
            allowDataOverflow={true} // Garante o corte estrito
            label={{
              value: "x₁",
              position: "insideBottomRight",
              offset: -10,
              style: {
                fontSize: 14,
                fontWeight: "bold",
                fill: "hsl(var(--foreground))",
              },
            }}
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--foreground))" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, bounds.maxY]}
            allowDataOverflow={true} // Garante o corte estrito
            label={{
              value: "x₂",
              angle: -90,
              position: "insideTopLeft",
              offset: 10,
              style: {
                fontSize: 14,
                fontWeight: "bold",
                fill: "hsl(var(--foreground))",
              },
            }}
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--foreground))" }}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
          />

          <Legend verticalAlign="top" height={36} iconType="plainline" />

          {feasibleRegion.length > 0 && (
            <Area
              type="monotone"
              dataKey="feasible"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              stroke="none"
              name="Região Factível"
              isAnimationActive={false}
            />
          )}

          {constraints.map((constraint, idx) => (
            <Line
              key={`constraint-${idx}`}
              type="linear" // Linear é melhor para restrições retas
              dataKey={`constraint_${idx}`}
              stroke={getConstraintColor(idx)}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6 }}
              name={constraint.name}
              connectNulls={false} // Não conecta se houver gaps (fora do limite)
              isAnimationActive={false}
            />
          ))}

          {/* O Scatter deve vir por último para ficar em cima */}
          <Scatter
            data={optimalPoint}
            name="Solução Ótima"
            shape={<RenderOptimalPoint />}
            isAnimationActive={false} // Desativar animação de entrada pode ajudar na compatibilidade
            legendType="star"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 border rounded-lg bg-muted/20">
        <p className="font-semibold text-sm mb-2">Legenda das Restrições:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {constraints.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-8 h-1 rounded"
                style={{ backgroundColor: getConstraintColor(idx) }}
              />
              <span className="font-mono text-muted-foreground">
                {formatEquation(c)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ... (Funções auxiliares isPointFeasible, getIntersection, etc. permanecem as mesmas)
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
  if (Math.abs(det) < 1e-10) return null;
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
    if (!isDuplicate) unique.push(v);
  }
  return unique;
}

function sortVerticesCounterClockwise(
  vertices: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if (vertices.length === 0) return [];
  const cx = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const cy = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
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
  const yValues: number[] = [];
  for (let i = 0; i < region.length; i++) {
    const p1 = region[i];
    const p2 = region[(i + 1) % region.length];
    if ((p1.x <= x && p2.x >= x) || (p1.x >= x && p2.x <= x)) {
      if (Math.abs(p2.x - p1.x) > 1e-6) {
        const t = (x - p1.x) / (p2.x - p1.x);
        const y = p1.y + t * (p2.y - p1.y);
        yValues.push(y);
      } else if (Math.abs(p1.x - x) < 1e-2) {
        yValues.push(p1.y);
        yValues.push(p2.y);
      }
    }
  }
  return yValues.length > 0 ? Math.max(...yValues) : null;
}

function getConstraintColor(index: number): string {
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  return colors[index % colors.length];
}
