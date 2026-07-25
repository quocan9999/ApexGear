/* Hallmark · chart surface · Lumina Tech tokens · no gradient */
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenuePoint } from '../../types';
import { formatPrice } from '../../utils/format';

interface RevenueChartProps {
  data: RevenuePoint[];
  height?: number;
}

function formatAxisDate(date: string): string {
  // YYYY-MM-DD → DD/MM
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export function RevenueChart({ data, height = 320 }: RevenueChartProps) {
  const { t } = useTranslation();

  const compactCurrency = (value: number): string => {
    if (value >= 1e9) {
      return t('dashboard.chart.compactBillion', { value: value / 1e9 });
    }
    if (value >= 1e6) {
      return t('dashboard.chart.compactMillion', { value: value / 1e6 });
    }
    return formatPrice(value);
  };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-on-surface-variant body-md"
        style={{ height }}
      >
        {t('dashboard.chart.empty')}
      </div>
    );
  }

  return (
    <div
      className="text-primary"
      style={{ width: '100%', height }}
      aria-label={t('dashboard.chart.revenueLabel')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="var(--color-outline-variant)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-outline-variant)' }}
            dy={6}
          />
          <YAxis
            tickFormatter={compactCurrency}
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
            width={68}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), t('dashboard.chart.revenueLabel')]}
            labelFormatter={formatAxisDate}
            cursor={{ stroke: 'var(--color-outline)', strokeDasharray: '4 4' }}
            contentStyle={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 10,
              fontSize: 13,
              boxShadow: 'var(--shadow-level-1)',
              color: 'var(--color-on-surface)',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name={t('dashboard.chart.revenueLabel')}
            stroke="var(--color-primary)"
            strokeWidth={2.25}
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--color-primary)',
              stroke: 'var(--color-surface-container-lowest)',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
