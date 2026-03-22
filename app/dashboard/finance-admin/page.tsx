'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/finance-admin', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Fee Collection', href: '/dashboard/finance-admin/collection', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Paid Students', href: '/dashboard/finance-admin/paid', icon: <CheckCircle2 className="w-5 h-5" /> },
  { label: 'Unpaid Students', href: '/dashboard/finance-admin/unpaid', icon: <XCircle className="w-5 h-5" /> },
  { label: 'Reports', href: '/dashboard/finance-admin/reports', icon: <Download className="w-5 h-5" /> },
];

interface RecentPayment {
  id: string;
  student: string;
  class_name: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  date: string;
  payment_method: string;
}

interface FinanceDashboardData {
  total_collected: number;
  total_pending: number;
  paid_students: number;
  unpaid_students: number;
  currency: string;
  school_name: string;
  recent_payments: RecentPayment[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function FinanceAdminDashboard() {
  const [dashboard, setDashboard] = React.useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/finance/summary');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch finance dashboard.');
        }

        setDashboard(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch finance dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const currency = dashboard?.currency || 'USD';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sidebarItems} userRole="finance-admin" userName="Finance Admin" />

      <motion.div
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600">
                {loading ? 'Loading finance data...' : `Track fees and payments for ${dashboard?.school_name || 'your school'}`}
              </p>
            </div>
            <Button variant="outline" className="gap-2 px-6" disabled>
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <Card className="border border-red-100 bg-white">
              <CardContent className="py-10 text-center text-red-600">{error}</CardContent>
            </Card>
          ) : (
            <>
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <DashboardCard
                  title="Total Collected"
                  value={formatCurrency(dashboard?.total_collected || 0, currency)}
                  icon={<DollarSign className="w-5 h-5" />}
                  description="Confirmed payments"
                />
                <DashboardCard
                  title="Pending Amount"
                  value={formatCurrency(dashboard?.total_pending || 0, currency)}
                  icon={<Clock className="w-5 h-5" />}
                  description="Awaiting confirmation"
                />
                <DashboardCard
                  title="Paid Students"
                  value={dashboard?.paid_students || 0}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  description="With paid records"
                />
                <DashboardCard
                  title="Unpaid Students"
                  value={dashboard?.unpaid_students || 0}
                  icon={<XCircle className="w-5 h-5" />}
                  description="With pending balances"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Payments</CardTitle>
                    <div className="flex gap-2">
                      <Link href="/dashboard/finance-admin/paid">
                        <Button variant="outline" size="sm" className="px-4">View Paid</Button>
                      </Link>
                      <Link href="/dashboard/finance-admin/unpaid">
                        <Button variant="outline" size="sm" className="px-4">View Unpaid</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.recent_payments.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Method</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboard.recent_payments.map((payment, idx) => (
                              <motion.tr
                                key={payment.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.04 }}
                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium text-gray-900">{payment.student}</td>
                                <td className="py-3 px-4 text-gray-600">{payment.class_name}</td>
                                <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(payment.amount, currency)}</td>
                                <td className="py-3 px-4 text-gray-600">{payment.payment_method.replace(/_/g, ' ')}</td>
                                <td className="py-3 px-4">
                                  <Badge
                                    className="font-semibold"
                                    variant={
                                      payment.status === 'PAID'
                                        ? 'success'
                                        : payment.status === 'PENDING'
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {payment.status.toLowerCase()}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {new Date(payment.date).toLocaleDateString()}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        No payment records found yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
