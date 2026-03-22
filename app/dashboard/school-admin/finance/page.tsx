'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  Wallet,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatGhanaCedis } from '@/lib/currency';

interface RecentBalance {
  id: string;
  student: string;
  class_name: string;
  fee_type: string;
  amount_expected: number;
  amount_paid: number;
  amount_left: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  period: string;
  updated_at: string;
}

interface FinanceSummary {
  total_expected: number;
  total_paid: number;
  total_pending: number;
  paid_students: number;
  unpaid_students: number;
  partially_paid_students: number;
  collection_rate: number;
  recent_balances: RecentBalance[];
  school_name: string;
  currency: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function FinanceOverviewPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/finance/summary', {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch finance summary.');
        }

        setSummary(data);
      } catch (fetchError) {
        console.error('Error fetching finance summary:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch finance summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatMoney = (value: number) => formatGhanaCedis(value);

  const handleDownload = () => {
    if (!summary) return;

    const rows = [
      ['Student', 'Class', 'Fee Type', 'Period', 'Expected', 'Paid', 'Pending', 'Status'],
      ...summary.recent_balances.map((balance) => [
        balance.student,
        balance.class_name,
        balance.fee_type,
        balance.period,
        balance.amount_expected.toFixed(2),
        balance.amount_paid.toFixed(2),
        balance.amount_left.toFixed(2),
        balance.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-summary-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div className="flex-1 lg:ml-64" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="space-y-6 p-4 lg:p-8">
          <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                <p className="text-gray-600">
                  {loading ? 'Loading finance data...' : `Live fee summary for ${summary?.school_name || 'your school'}`}
                </p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={!summary}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </motion.div>

          {error ? (
            <motion.div variants={itemVariants} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </motion.div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : summary ? (
            <>
              <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Expected Total</p>
                        <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatMoney(summary.total_expected)}</h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-blue-600">
                      Full amount if every student clears every assigned fee
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Paid Amount</p>
                        <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatMoney(summary.total_paid)}</h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-green-600">
                      Collection rate: {summary.collection_rate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Pending Amount</p>
                        <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatMoney(summary.total_pending)}</h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <TrendingDown className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-amber-600">
                      Amount still outstanding across all student fee balances
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Fee Balances</CardTitle>
                      <CardDescription>Latest student fee positions from the live school balance ledger</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Fee</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Period</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Expected</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Paid</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Pending</th>
                              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.recent_balances.map((balance) => (
                              <tr key={balance.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                <td className="px-2 py-4">
                                  <div className="font-medium text-gray-900">{balance.student}</div>
                                  <div className="text-sm text-gray-500">{balance.class_name}</div>
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-600">{balance.fee_type}</td>
                                <td className="px-2 py-4 text-sm text-gray-500">{balance.period}</td>
                                <td className="px-2 py-4 font-semibold text-gray-900">{formatMoney(balance.amount_expected)}</td>
                                <td className="px-2 py-4 font-semibold text-emerald-700">{formatMoney(balance.amount_paid)}</td>
                                <td className="px-2 py-4 font-semibold text-amber-700">{formatMoney(balance.amount_left)}</td>
                                <td className="px-2 py-4">
                                  <Badge
                                    className={
                                      balance.status === 'Paid'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : balance.status === 'Partially Paid'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-rose-100 text-rose-700'
                                    }
                                  >
                                    {balance.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                            {summary.recent_balances.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-2 py-10 text-center text-gray-500">
                                  No fee balances have been assigned yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Collection Snapshot</CardTitle>
                      <CardDescription>Student payment standing from the current fee ledger</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fully Paid Students</span>
                          <span className="font-medium text-gray-900">{summary.paid_students}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${summary.paid_students + summary.unpaid_students + summary.partially_paid_students > 0
                                ? (summary.paid_students / (summary.paid_students + summary.unpaid_students + summary.partially_paid_students)) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Partially Paid Students</span>
                          <span className="font-medium text-gray-900">{summary.partially_paid_students}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-amber-500"
                            style={{
                              width: `${summary.paid_students + summary.unpaid_students + summary.partially_paid_students > 0
                                ? (summary.partially_paid_students / (summary.paid_students + summary.unpaid_students + summary.partially_paid_students)) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Students Still Owing</span>
                          <span className="font-medium text-gray-900">{summary.unpaid_students}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-rose-500"
                            style={{
                              width: `${summary.paid_students + summary.unpaid_students + summary.partially_paid_students > 0
                                ? (summary.unpaid_students / (summary.paid_students + summary.unpaid_students + summary.partially_paid_students)) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Expected</p>
                            <p className="text-lg font-bold text-gray-900">{formatMoney(summary.total_expected)}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="text-lg font-bold text-gray-900">{formatMoney(summary.total_pending)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                        This finance page now uses the same student fee balances that power the admin fee checker and parent fee pages.
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
