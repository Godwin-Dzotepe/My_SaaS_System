'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { formatGhanaCedis } from '@/lib/currency';

interface ChildFeeBalance {
  id: string;
  fee_type: string;
  description: string | null;
  academic_year: string;
  term: string | null;
  total_amount: number;
  amount_paid: number;
  amount_left: number;
  status: string;
  updated_at: string;
}

interface ParentFeeStudent {
  id: string;
  name: string;
  class_name: string;
  school_name: string;
  balances: ChildFeeBalance[];
  totals: {
    total_due: number;
    total_paid: number;
    total_left: number;
  };
}

export default function ParentFeesPage() {
  const [students, setStudents] = React.useState<ParentFeeStudent[]>([]);
  const [paymentDetails, setPaymentDetails] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [resFees, resPay] = await Promise.all([
          fetch('/api/parent/fees', { cache: 'no-store' }),
          fetch('/api/admin/payment-details', { cache: 'no-store' }),
        ]);

        const [feesData, paymentData] = await Promise.all([
          resFees.json().catch(() => null),
          resPay.json().catch(() => null),
        ]);

        if (!resFees.ok) throw new Error(feesData?.error || 'Failed to fetch fee balances.');
        if (!resPay.ok) throw new Error(paymentData?.error || 'Failed to fetch payment details.');

        setStudents(Array.isArray(feesData) ? feesData : []);
        setPaymentDetails(paymentData || {});
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch fees data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const getStatusTone = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Partially Paid') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName="Parent" />
      <div className="flex-1 space-y-6 p-4 lg:ml-64 lg:p-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="mt-1 text-sm text-gray-500">View fee structures, balances, and payment instructions.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card className="p-10 text-center text-red-600">{error}</Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-2 space-y-6">
              {students.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">No children associated with this account.</Card>
              ) : (
                students.map((student) => (
                  <Card key={student.id} className="shadow-sm">
                    <CardHeader className="border-b border-blue-100 bg-blue-50">
                      <CardTitle className="text-lg text-blue-900">{student.name}</CardTitle>
                      <p className="text-sm text-blue-700">Class: {student.class_name}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 lg:p-6">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Total Due</p>
                          <p className="mt-2 text-xl font-bold text-gray-900">{formatGhanaCedis(student.totals.total_due)}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-emerald-700">Paid So Far</p>
                          <p className="mt-2 text-xl font-bold text-emerald-700">{formatGhanaCedis(student.totals.total_paid)}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-amber-700">Amount Left</p>
                          <p className="mt-2 text-xl font-bold text-amber-700">{formatGhanaCedis(student.totals.total_left)}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b bg-gray-50">
                            <tr>
                              <th className="p-4 font-medium">Fee Type</th>
                              <th className="p-4 font-medium">Period</th>
                              <th className="p-4 font-medium">Total</th>
                              <th className="p-4 font-medium">Paid</th>
                              <th className="p-4 font-medium">Left</th>
                              <th className="p-4 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {student.balances.map((balance) => (
                              <tr key={balance.id}>
                                <td className="p-4">
                                  {balance.fee_type}
                                  <span className="mt-1 block text-xs text-gray-400">{balance.description || 'No description'}</span>
                                </td>
                                <td className="p-4">
                                  {balance.term || 'No term'} ({balance.academic_year})
                                </td>
                                <td className="p-4 font-semibold">{formatGhanaCedis(balance.total_amount)}</td>
                                <td className="p-4 text-emerald-700">{formatGhanaCedis(balance.amount_paid)}</td>
                                <td className="p-4 text-amber-700">{formatGhanaCedis(balance.amount_left)}</td>
                                <td className="p-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(balance.status)}`}>
                                    {balance.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {student.balances.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                  No fee balances configured for this child yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-blue-200 shadow-sm">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-lg">Payment Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {paymentDetails.momoNumber ? (
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">Mobile Money (MoMo)</h4>
                      <div className="rounded-lg bg-gray-100 p-3 text-center font-mono text-lg tracking-widest">
                        {paymentDetails.momoNumber}
                      </div>
                    </div>
                  ) : null}

                  {paymentDetails.bankAccountNumber || paymentDetails.bankName ? (
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">Bank Transfer</h4>
                      <div className="space-y-1 rounded-lg bg-gray-100 p-3 text-sm">
                        <p><span className="text-gray-500">Bank:</span> {paymentDetails.bankName}</p>
                        <p><span className="text-gray-500">Account:</span> {paymentDetails.bankAccountNumber}</p>
                      </div>
                    </div>
                  ) : null}

                  {paymentDetails.paymentInstructions ? (
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">Other Instructions</h4>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                        {paymentDetails.paymentInstructions}
                      </p>
                    </div>
                  ) : null}

                  {!paymentDetails.momoNumber && !paymentDetails.bankAccountNumber && !paymentDetails.paymentInstructions ? (
                    <p className="text-center text-sm text-gray-500">
                      Please contact the school administration for payment procedures.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
