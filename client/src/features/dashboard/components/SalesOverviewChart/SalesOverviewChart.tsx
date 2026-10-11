import { useState } from 'react';
import { Card, Segmented, Typography } from 'antd';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, SALES_PERIOD_OPTIONS } from '../../data/dashboard.constants.ts';
import type { SalesPeriod, SalesPoint } from '../../types/index.ts';
import { formatAxisValue, formatTaka } from '../../utils/format.ts';

type SalesOverviewChartProps = {
  dataByPeriod: Record<SalesPeriod, SalesPoint[]>;
};

function SalesOverviewChart({ dataByPeriod }: SalesOverviewChartProps) {
  const [period, setPeriod] = useState<SalesPeriod>('today');

  return (
    <Card className="shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Typography.Title level={5} className="!mb-0">
          Sales Overview (YTD)
        </Typography.Title>
        <Segmented
          size="small"
          value={period}
          options={SALES_PERIOD_OPTIONS}
          onChange={(value) => setPeriod(value as SalesPeriod)}
        />
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataByPeriod[period]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              formatter={(value) => [formatTaka(Number(value)), 'Sales']}
              contentStyle={{ borderRadius: 8, borderColor: CHART_COLORS.grid }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke={CHART_COLORS.sales}
              strokeWidth={2.5}
              dot={{ r: 4, fill: CHART_COLORS.sales, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default SalesOverviewChart;
