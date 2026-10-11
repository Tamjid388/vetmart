import { Card, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS } from '../../data/dashboard.constants.ts';
import type { PurchaseSalesPoint } from '../../types/index.ts';
import { formatAxisValue, formatTaka } from '../../utils/format.ts';

type PurchaseVsSalesChartProps = {
  data: PurchaseSalesPoint[];
};

function PurchaseVsSalesChart({ data }: PurchaseVsSalesChartProps) {
  return (
    <Card className="shadow-sm">
      <Typography.Title level={5} className="!mb-4">
        Purchase vs Sales (Grouped)
      </Typography.Title>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={6}>
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
              formatter={(value, name) => [
                formatTaka(Number(value)),
                name === 'purchase' ? 'Purchase' : 'Sales',
              ]}
              contentStyle={{ borderRadius: 8, borderColor: CHART_COLORS.grid }}
            />
            <Legend
              formatter={(value) => (value === 'purchase' ? 'Purchase' : 'Sales')}
              iconType="circle"
            />
            <Bar dataKey="purchase" fill={CHART_COLORS.purchase} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="sales" fill={CHART_COLORS.sales} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default PurchaseVsSalesChart;
