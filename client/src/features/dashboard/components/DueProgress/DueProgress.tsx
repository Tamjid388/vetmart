import { Card, Typography } from 'antd';
import type { DueProgressItem } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

const barColors = {
  green: 'bg-green-500',
  orange: 'bg-orange-500',
} as const;

type DueProgressProps = {
  items: DueProgressItem[];
};

function DueProgress({ items }: DueProgressProps) {
  return (
    <Card className="shadow-sm">
      <Typography.Title level={5} className="!mb-5">
        Due Overview & Collection Progress
      </Typography.Title>
      <div className="flex flex-col gap-5">
        {items.map((item) => {
          const percent = item.total === 0 ? 0 : Math.round((item.collected / item.total) * 100);

          return (
            <div key={item.id}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">
                  {item.label} ({formatTaka(item.collected)} of {formatTaka(item.total)})
                </span>
                <span className="font-semibold text-slate-800">{percent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barColors[item.color]}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default DueProgress;
