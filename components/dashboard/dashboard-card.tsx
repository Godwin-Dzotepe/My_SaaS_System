import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  iconBg?: string; // Add iconBg to props
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function DashboardCard({ title, value, description, icon, iconBg, trend, className }: DashboardCardProps) {
  return (
    <Card className={cn("hover:-translate-y-1 hover:shadow-lg transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}