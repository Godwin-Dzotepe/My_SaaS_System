'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



interface FinanceSummary {
  total_collected: number;
  total_pending: number;
  currency: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function FinanceOverviewPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Get school ID from user session
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let schoolId = '';
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            schoolId = user.school_id || '';
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
        
        if (!schoolId) {
          console.error('No school_id found in user session');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/finance/summary?school_id=${schoolId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }); 
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch (error) {
        console.error('Error fetching finance summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Mock data for the chart/recent transactions since the API is basic
  const recentTransactions = [
    { id: 1, student: 'Alice Cooper', amount: 500, date: '2024-03-10', status: 'paid', type: 'Tuition' },
    { id: 2, student: 'Bob Smith', amount: 300, date: '2024-03-09', status: 'pending', type: 'Library Fee' },
    { id: 3, student: 'Carol White', amount: 450, date: '2024-03-08', status: 'paid', type: 'Tuition' },
    { id: 4, student: 'David Brown', amount: 120, date: '2024-03-07', status: 'paid', type: 'Lab Fee' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                <p className="text-gray-600">Track revenue, pending fees, and school expenses</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button className="gap-2">
                <Calendar className="w-4 h-4" />
                This Term
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : `$${summary?.total_collected.toLocaleString() || '0'}`}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8.2% from last term</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Fees</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : `$${summary?.total_pending.toLocaleString() || '0'}`}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium">
                  <TrendingDown className="w-4 h-4" />
                  <span>12 students with overdue payments</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Expenses</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">$8,240</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Staff salaries & utilities</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest fee payments and receipts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Student</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Amount</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-2 font-medium text-gray-900">{tx.student}</td>
                            <td className="py-4 px-2 text-gray-600 text-sm">{tx.type}</td>
                            <td className="py-4 px-2 text-gray-500 text-sm">{tx.date}</td>
                            <td className="py-4 px-2 font-semibold text-gray-900">${tx.amount}</td>
                            <td className="py-4 px-2">
                              <Badge variant={tx.status === 'paid' ? 'success' : 'secondary'}>
                                {tx.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue Breakdown */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>By category this term</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tuition Fees</span>
                      <span className="font-medium text-gray-900">75%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transport</span>
                      <span className="font-medium text-gray-900">15%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Books & Uniforms</span>
                      <span className="font-medium text-gray-900">10%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Paid In Full</p>
                        <p className="text-lg font-bold text-gray-900">84%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Partial</p>
                        <p className="text-lg font-bold text-gray-900">12%</p>
                      </div>
                    </div>
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
