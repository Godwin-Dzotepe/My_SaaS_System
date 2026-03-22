'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Edit, Trash } from 'lucide-react';

export default function FeesConfigPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', class_id: '', fee_type: 'TUITION', amount: '', academic_year: '2024-2025', term: 'Term 1', description: '' });
  const [paymentDetails, setPaymentDetails] = useState({ momoNumber: '', bankAccountNumber: '', bankName: '', paymentInstructions: '' });
  const [userName, setUserName] = useState('Admin User');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resFees, resClasses, resPay] = await Promise.all([
        fetch('/api/school-fees'),
        fetch('/api/classes'),
        fetch('/api/admin/payment-details')
      ]);
      if (resFees.ok) setFees(await resFees.json());
      if (resClasses.ok) setClasses(await resClasses.json());
      if (resPay.ok) {
        const pd = await resPay.json();
        if (pd && pd.id) setPaymentDetails(pd);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        class_id: formData.class_id === '' ? undefined : formData.class_id
      };

      const res = await fetch('/api/school-fees', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Fee ${isEditing ? 'updated' : 'saved'}!`);
        fetchData();
        resetForm();
      } else {
         const errorData = await res.json();
         alert(`Error: ${errorData.error || 'Failed to save fee'}`);
      }
    } catch (err) {}
  };

  const handleEditFee = (fee: any) => {
    setFormData({
      id: fee.id,
      class_id: fee.class_id || '',
      fee_type: fee.fee_type,
      amount: fee.amount.toString(),
      academic_year: fee.academic_year,
      term: fee.term,
      description: fee.description || ''
    });
    setIsEditing(true);
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;
    try {
      const res = await fetch(`/api/school-fees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Fee deleted successfully!');
        fetchData();
      } else {
        alert('Failed to delete fee');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', class_id: '', fee_type: 'TUITION', amount: '', academic_year: '2024-2025', term: 'Term 1', description: '' });
    setIsEditing(false);
  };

  const handleSavePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payment-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails)
      });
      if (res.ok) alert('Payment details saved!');
    } catch (err) {}
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      <div className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Fees & Payment Setup</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{isEditing ? 'Edit Fee' : 'Create New Fee'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFee} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Class (Optional)</label>
                    <select className="w-full border rounded-lg p-2 bg-white" value={formData.class_id} onChange={e=>setFormData({...formData, class_id: e.target.value})}>
                      <option value="">All Classes (General Fee)</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fee Type</label>
                      <select className="w-full border rounded-lg p-2 bg-white" value={formData.fee_type} onChange={e=>setFormData({...formData, fee_type: e.target.value})}>
                        <option value="TUITION">Tuition</option>
                        <option value="LUNCH">Lunch</option>
                        <option value="TRANSPORT">Transport</option>
                        <option value="CLASS">Class Supplies</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount (GHS)</label>
                      <Input type="number" required value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Academic Year</label>
                      <Input value={formData.academic_year} onChange={e=>setFormData({...formData, academic_year: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Term</label>
                      <select className="w-full border rounded-lg p-2 bg-white" value={formData.term} onChange={e=>setFormData({...formData, term: e.target.value})}>
                        <option>Term 1</option>
                        <option>Term 2</option>
                        <option>Term 3</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Brief description..." />
                  </div>
                  <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-[#3f7afc] hover:bg-[#2d6ae0]">
                        {isEditing ? 'Update Fee' : 'Add Fee'}
                      </Button>
                      {isEditing && (
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                      )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment details (Shown to Parents)</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSavePaymentDetails} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile Money Number</label>
                    <Input value={paymentDetails.momoNumber || ''} onChange={e=>setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} placeholder="e.g. 024XXXXXXX" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bank Name</label>
                      <Input value={paymentDetails.bankName || ''} onChange={e=>setPaymentDetails({...paymentDetails, bankName: e.target.value})} placeholder="e.g. GCB Bank" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Acc Number</label>
                      <Input value={paymentDetails.bankAccountNumber || ''} onChange={e=>setPaymentDetails({...paymentDetails, bankAccountNumber: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Physical Cash / General Instructions</label>
                    <textarea className="w-full border rounded-lg p-2 resize-none bg-white" rows={3} value={paymentDetails.paymentInstructions || ''} onChange={e=>setPaymentDetails({...paymentDetails, paymentInstructions: e.target.value})} placeholder="Instructions to parents..." />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Save Payment Details</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Configured Fees</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 font-medium">Class</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Amount</th>
                        <th className="p-3 font-medium">Term</th>
                        <th className="p-3 font-medium">Desc</th>
                        <th className="p-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fees.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="p-3">{f.class_id ? classes.find(c=>c.id===f.class_id)?.class_name || 'Unknown' : 'All Classes'}</td>
                          <td className="p-3">{f.fee_type}</td>
                          <td className="p-3 font-semibold text-green-600">GH{f.amount}</td>
                          <td className="p-3">{f.term}</td>
                          <td className="p-3 text-gray-500">{f.description || '-'}</td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 mr-2"
                              onClick={() => handleEditFee(f)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteFee(f.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {fees.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No fees configured yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
