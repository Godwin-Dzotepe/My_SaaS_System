'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

export default function ParentFeesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Parent');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(meData => {
      if (meData.user) {
        setUserName(meData.user.name);
        const fetchAll = async () => {
          setLoading(true);
          try {
            const [resChildren, resFees, resPay] = await Promise.all([
              fetch('/api/parent/children'),
              fetch('/api/school-fees'),
              fetch('/api/admin/payment-details')
            ]);
            
            if (resChildren.ok) setStudents(await resChildren.json());
            if (resFees.ok) setFees(await resFees.json());
            if (resPay.ok) setPaymentDetails(await resPay.json());
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
        fetchAll();
      }
    }).catch(console.error);
  }, []);

  // Helper to filter fees for a student
  const getFeesForStudent = (student: any) => {
    return fees.filter(f => !f.class_id || f.class_id === student.class_id);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-gray-500 text-sm mt-1">View fee structures and payment instructions.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {students.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">No children associated with this account.</Card>
              ) : students.map(student => (
                <Card key={student.id} className="shadow-sm">
                  <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-lg text-blue-900">{student.name}</CardTitle>
                    <p className="text-sm text-blue-700">Class: {student.class?.class_name || 'N/A'}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-4 font-medium">Fee Type</th>
                          <th className="p-4 font-medium">Term</th>
                          <th className="p-4 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getFeesForStudent(student).map((fee: any) => (
                          <tr key={fee.id}>
                            <td className="p-4">{fee.fee_type} <span className="text-xs text-gray-400 block">{fee.description}</span></td>
                            <td className="p-4">{fee.term} ({fee.academic_year})</td>
                            <td className="p-4 font-semibold">GHs {fee.amount}</td>
                          </tr>
                        ))}
                        {getFeesForStudent(student).length === 0 && (
                          <tr><td colSpan={3} className="p-4 text-center text-gray-500">No fees configured for this class.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="shadow-sm border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Payment Instructions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {paymentDetails.momoNumber && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Mobile Money (MoMo)</h4>
                      <div className="bg-gray-100 p-3 rounded-lg text-lg font-mono text-center tracking-widest">
                        {paymentDetails.momoNumber}
                      </div>
                    </div>
                  )}

                  {(paymentDetails.bankAccountNumber || paymentDetails.bankName) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Bank Transfer</h4>
                      <div className="bg-gray-100 p-3 rounded-lg text-sm space-y-1">
                        <p><span className="text-gray-500">Bank:</span> {paymentDetails.bankName}</p>
                        <p><span className="text-gray-500">Account:</span> {paymentDetails.bankAccountNumber}</p>
                      </div>
                    </div>
                  )}

                  {paymentDetails.paymentInstructions && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Other Instructions</h4>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {paymentDetails.paymentInstructions}
                      </p>
                    </div>
                  )}
                  
                  {!paymentDetails.momoNumber && !paymentDetails.bankAccountNumber && !paymentDetails.paymentInstructions && (
                    <p className="text-gray-500 text-sm text-center">Please contact the school administration for payment procedures.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
