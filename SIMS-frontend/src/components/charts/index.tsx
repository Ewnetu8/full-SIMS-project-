'use client';

/**
 * Chart Components —  Recharts wrappers
 * All charts are responsive, theme-aware, and accept configurable props.
 * They include placeholder data so they render standalone without an API.
 */

import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { cn } from '@/lib';

// ─── Design system chart colours ─────────────────────────────────────────────

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

// ─── Shared defaults ──────────────────────────────────────────────────────────

const GRID_STYLE = { stroke: 'var(--color-border)', strokeDasharray: '3 3' };

const AXIS_STYLE = {
  tick:     { fill: 'var(--color-muted-foreground)', fontSize: 11 },
  axisLine: { stroke: 'var(--color-border)' },
  tickLine: false as const,
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background:   'var(--color-card)',
    border:       '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    fontSize:     '12px',
    color:        'var(--color-foreground)',
    boxShadow:    'var(--shadow-md)',
  },
  cursor: { fill: 'var(--color-accent)', opacity: 0.5 },
};

// ─── Chart Container ──────────────────────────────────────────────────────────

interface ChartContainerProps {
  title?:    string;
  subtitle?: string;
  children:  React.ReactNode;
  height?:   number;
  className?: string;
}

function ChartContainer({ title, subtitle, children, height = 280, className }: ChartContainerProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title    && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

// ─── Placeholder data ─────────────────────────────────────────────────────────

const SCORE_DATA = [
  { name: 'Week 1', students: 72, avg: 65 },
  { name: 'Week 2', students: 81, avg: 70 },
  { name: 'Week 3', students: 68, avg: 74 },
  { name: 'Week 4', students: 88, avg: 78 },
  { name: 'Week 5', students: 91, avg: 82 },
  { name: 'Week 6', students: 85, avg: 79 },
];

const GRADE_DIST = [
  { name: 'A',  value: 32 },
  { name: 'B',  value: 28 },
  { name: 'C',  value: 20 },
  { name: 'D',  value: 12 },
  { name: 'F',  value: 8  },
];

// ─── Line Chart ───────────────────────────────────────────────────────────────

export interface LineChartProps {
  data?:    any[];
  lines?:   { key: string; name?: string; color?: string }[];
  xKey?:    string;
  title?:   string;
  subtitle?: string;
  height?:  number;
  className?: string;
}

export function AppLineChart({
  data     = SCORE_DATA,
  lines    = [
    { key: 'students', name: 'Student Score', color: CHART_COLORS[0] },
    { key: 'avg',      name: 'Class Avg',     color: CHART_COLORS[2] },
  ],
  xKey     = 'name',
  title,
  subtitle,
  height   = 280,
  className,
}: LineChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
      <ReLineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name ?? l.key}
            stroke={l.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, fill: l.color ?? CHART_COLORS[i] }}
            activeDot={{ r: 5 }}
          />
        ))}
      </ReLineChart>
    </ChartContainer>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

export interface BarChartProps {
  data?:    any[];
  bars?:    { key: string; name?: string; color?: string }[];
  xKey?:    string;
  title?:   string;
  subtitle?: string;
  height?:  number;
  stacked?: boolean;
  className?: string;
}

export function AppBarChart({
  data     = SCORE_DATA,
  bars     = [
    { key: 'students', name: 'Student Score', color: CHART_COLORS[0] },
  ],
  xKey     = 'name',
  title,
  subtitle,
  height   = 280,
  stacked  = false,
  className,
}: BarChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
      <ReBarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name ?? b.key}
            fill={b.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </ReBarChart>
    </ChartContainer>
  );
}

// ─── Pie / Donut Chart ───────────────────────────────────────────────────────

export interface PieChartProps {
  data?:       any[];
  nameKey?:    string;
  valueKey?:   string;
  title?:      string;
  subtitle?:   string;
  innerRadius?: number;
  outerRadius?: number;
  height?:     number;
  className?:  string;
}

export function AppPieChart({
  data        = GRADE_DIST,
  nameKey     = 'name',
  valueKey    = 'value',
  title,
  subtitle,
  innerRadius = 55,
  outerRadius = 90,
  height      = 280,
  className,
}: PieChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          formatter={(value) => [`${value}%`, '']}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RePieChart>
    </ChartContainer>
  );
}

// ─── Area Chart ──────────────────────────────────────────────────────────────

export interface AreaChartProps {
  data?:    any[];
  areas?:   { key: string; name?: string; color?: string }[];
  xKey?:    string;
  title?:   string;
  subtitle?: string;
  height?:  number;
  className?: string;
}

export function AppAreaChart({
  data  = SCORE_DATA,
  areas = [
    { key: 'students', name: 'Student Score', color: CHART_COLORS[0] },
    { key: 'avg',      name: 'Class Avg',     color: CHART_COLORS[2] },
  ],
  xKey  = 'name',
  title,
  subtitle,
  height = 280,
  className,
}: AreaChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
      <ReAreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <defs>
          {areas.map((a, i) => (
            <linearGradient key={a.key} id={`grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={a.color ?? CHART_COLORS[i]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={a.color ?? CHART_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {areas.map((a, i) => (
          <Area
            key={a.key}
            type="monotone"
            dataKey={a.key}
            name={a.name ?? a.key}
            stroke={a.color ?? CHART_COLORS[i]}
            fill={`url(#grad-${a.key})`}
            strokeWidth={2}
          />
        ))}
      </ReAreaChart>
    </ChartContainer>
  );
}

export { ChartContainer, CHART_COLORS };
