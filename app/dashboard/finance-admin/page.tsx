'use client';

import * as React from 'react';
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
  Download
} from 'lucide-react';
import Link from 'next/link';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/finance-admin', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Fee Collection', href: '/dashboard/finance-admin/collection', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Paid Students', href: '/dashboard/finance-admin/paid', icon: <CheckCircle2 className="w-5 h-5" /> },
  { label: 'Unpaid Students', href: '/dashboard/finance-admin/unpaid', icon: <XCircle className="w-5 h-5" /> },
  { label: 'Reports', href: '/dashboard/finance-admin/reports', icon: <Download className="w-5 h-5" /> },
];

const paymentData = [
  { id: 1, student: 'Alice Johnson', class: 'Class 5', amount: 1200, status: 'paid', date: '2024-03-01' },
  { id: 2, student: 'Bob Smith', class: 'JHS 1', amount: 1500, status: 'pending', date: '-' },
  { id: 3, student: 'Carol White', class: 'Class 3', amount: 1200, status: 'paid', date: '2024-03-02' },
  { id: 4, student: 'David Brown', class: 'JHS 2', amount: 1500, status: 'overdue', date: '-' },
  { id: 5, student: 'Emma Davis', class: 'Class 4', amount: 1200, status: 'paid', date: '2024-03-03' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function FinanceAdminDashboard() {
  const totalCollected = 45000;
  const totalPending = 12450;
  const paidCount = 180;
  const unpaidCount = 45;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={sidebarItems} userRole="finance-admin" userName="Finance Manager" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600">Track fees and payments for Lincoln High School</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 px-6">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </motion.div>

          {/* Financial Summary */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <DashboardCard
              title="Total Collected"
              value={`$${totalCollected.toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              trend={{ value: '+8.5%', positive: true }}
              description="This term"
            />
            <DashboardCard
              title="Pending Amount"
              value={`$${totalPending.toLocaleString()}`}
              icon={<Clock className="w-5 h-5" />}
              trend={{ value: '12%', positive: false }}
              description="From 45 students"
            />
            <DashboardCard
              title="Paid Students"
              value={paidCount}
              icon={<CheckCircle2 className="w-5 h-5" />}
              description="80% of total"
            />
            <DashboardCard
              title="Unpaid Students"
              value={unpaidCount}
              icon={<XCircle className="w-5 h-5" />}
              description="20% of total"
            />
          </motion.div>

          {/* Payment Table */}
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentData.map((payment, idx) => (
                        <motion.tr 
                          key={payment.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                {payment.student.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-gray-900">{payment.student}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{payment.class}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">${payment.amount}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              className="font-semibold"
                              variant={
                                payment.status === 'paid' ? 'success' : 
                                payment.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{payment.date}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { label: 'Bank Transfer', color: 'bg-blue-500', percent: 60 },
                      { label: 'Cash', color: 'bg-green-500', percent: 25 },
                      { label: 'Mobile Money', color: 'bg-purple-500', percent: 15 }
                    ].map((method) => (
                      <div key={method.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">{method.label}</span>
                          <span className="text-sm font-bold text-gray-900">{method.percent}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${method.percent}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full ${method.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-40 gap-3 pt-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => {
                      const heights = [40, 65, 45, 80, 55, 70];
                      return (
                        <div key={month} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${heights[idx]}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + idx * 0.1, ease: 'easeOut' }}
                            className="w-full bg-blue-500 rounded-t-md transition-all group-hover:bg-blue-600 relative"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ${(heights[idx] * 100).toLocaleString()}
                            </div>
                          </motion.div>
                          <span className="text-xs font-medium text-gray-500">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
