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
    <div className="text-primary" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={compactCurrency}
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
            width={64}
          />
          <Tooltip
            formatter={(value: number) => formatPrice(value)}
            labelFormatter={formatAxisDate}
            contentStyle={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
