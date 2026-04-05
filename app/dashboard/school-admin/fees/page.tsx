'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Edit, Trash, Loader2, RefreshCcw } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface SchoolClass {
  id: string;
  class_name: string;
}

interface SchoolFee {
  id: string;
  class_id: string | null;
  fee_type: string;
  amount: number;
  academic_year: string;
  term: string;
  description: string | null;
}

interface PaymentDetails {
  momoNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  paymentInstructions?: string;
}

interface AcademicPeriod {
  id: string;
  academic_year: string;
  term: string;
}

const emptyFeeForm = {
  id: '',
  class_id: '',
  fee_type: '',
  amount: '',
  academic_year: '',
  term: 'Term 1',
  description: '',
};

export default function FeesConfigPage() {
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState(emptyFeeForm);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    momoNumber: '',
    bankAccountNumber: '',
    bankName: '',
    paymentInstructions: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [resFees, resClasses, resPay, resPeriods] = await Promise.all([
        fetch('/api/school-fees', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/classes', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/admin/payment-details', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/academic-periods', { cache: 'no-store', credentials: 'include' }),
      ]);

      const [feesData, classesData, paymentData, periodsData] = await Promise.all([
        resFees.json().catch(() => null),
        resClasses.json().catch(() => null),
        resPay.json().catch(() => null),
        resPeriods.json().catch(() => null),
      ]);

      if (!resFees.ok) {
        throw new Error(feesData?.error || 'Failed to fetch fees.');
      }

      if (!resClasses.ok) {
        throw new Error(classesData?.error || 'Failed to fetch classes.');
      }

      if (!resPay.ok) {
        throw new Error(paymentData?.error || 'Failed to fetch payment details.');
      }

      if (!resPeriods.ok) {
        throw new Error(periodsData?.error || 'Failed to fetch academic periods.');
      }

      setFees(Array.isArray(feesData) ? feesData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setPaymentDetails(paymentData && typeof paymentData === 'object' ? paymentData : {});
      const nextPeriods = Array.isArray(periodsData?.periods) ? periodsData.periods : [];
      setPeriods(nextPeriods);
      setFormData((current) => ({
        ...current,
        academic_year:
          current.academic_year ||
          nextPeriods[0]?.academic_year ||
          feesData?.[0]?.academic_year ||
          new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        term: current.term || nextPeriods[0]?.term || 'Term 1',
      }));
    } catch (fetchError) {
      console.error(fetchError);
      setFees([]);
      setClasses([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load fee setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingFee(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        class_id: formData.class_id === '' ? undefined : formData.class_id,
      };

      const res = await fetch('/api/school-fees', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save fee');
      }

      setSuccess(`Fee ${isEditing ? 'updated' : 'saved'} successfully.`);
      await fetchData();
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save fee.');
    } finally {
      setSavingFee(false);
    }
  };

  const handleEditFee = (fee: SchoolFee) => {
    setFormData({
      id: fee.id,
      class_id: fee.class_id || '',
      fee_type: fee.fee_type,
      amount: fee.amount.toString(),
      academic_year: fee.academic_year,
      term: fee.term,
      description: fee.description || '',
    });
    setIsEditing(true);
  };

  const handleDeleteFee = async (id: string) => {
    try {
      setError('');
      setSuccess('');

      const res = await fetch(`/api/school-fees?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete fee');
      }

      setSuccess('Fee deleted successfully.');
      await fetchData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete fee.');
    } finally {
      setFeeToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData((current) => ({
      ...emptyFeeForm,
      academic_year:
        current.academic_year ||
        fees[0]?.academic_year ||
        new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    }));
    setIsEditing(false);
  };

  const handleSavePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingPayment(true);

    try {
      const res = await fetch('/api/admin/payment-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save payment details.');
      }

      setSuccess('Payment details saved successfully.');
      await fetchData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save payment details.');
    } finally {
      setSavingPayment(false);
    }
  };

  const classNameById = useMemo(
    () => new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass.class_name])),
    [classes]
  );
  const academicYears = Array.from(new Set(periods.map((period) => period.academic_year)));
  const availableTerms = periods.filter((period) => period.academic_year === formData.academic_year);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      <div className="flex-1 p-4 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fees & Payment Setup</h1>
              <p className="text-gray-600">Configure live fee items and how parents should pay them.</p>
            </div>
            <Button variant="outline" className="gap-2 md:w-auto" onClick={fetchData}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
            </Card>
          ) : null}

          {success ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 text-sm text-emerald-700">{success}</CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Fee' : 'Create New Fee'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFee} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Class (Optional)</label>
                    <select
                      className="w-full rounded-lg border p-2 bg-white"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    >
                      <option value="">All Classes (General Fee)</option>
                      {classes.map((schoolClass) => (
                        <option key={schoolClass.id} value={schoolClass.id}>
                          {schoolClass.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Fee Type</label>
                      <Input
                        required
                        className="w-full rounded-lg border p-2 bg-white"
                        value={formData.fee_type}
                        onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                        placeholder="e.g. Tuition, ICT Fee, Books, Exam Fee"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Amount (GHS)</label>
                      <Input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Academic Year</label>
                      <Input
                        value={formData.academic_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic_year: e.target.value,
                            term: periods.find((period) => period.academic_year === e.target.value)?.term || '',
                          })
                        }
                        placeholder="2026-2027"
                        list="academic-year-options"
                      />
                      <datalist id="academic-year-options">
                        {academicYears.map((year) => (
                          <option key={year} value={year} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Term</label>
                      <select
                        className="w-full rounded-lg border p-2 bg-white"
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      >
                        <option value="">{availableTerms.length === 0 ? 'No configured terms' : 'Select term'}</option>
                        {availableTerms.map((period) => (
                          <option key={`${period.academic_year}-${period.term}`} value={period.term}>
                            {period.term}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description..."
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="submit"
                      className="flex-1 bg-[#3f7afc] hover:bg-[#2d6ae0]"
                      disabled={savingFee}
                    >
                      {savingFee ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : isEditing ? (
                        'Update Fee'
                      ) : (
                        'Add Fee'
                      )}
                    </Button>
                    {isEditing ? (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment details (Shown to Parents)</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePaymentDetails} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Mobile Money Number</label>
                    <Input
                      value={paymentDetails.momoNumber || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, momoNumber: e.target.value })}
                      placeholder="e.g. 024XXXXXXX"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Bank Name</label>
                      <Input
                        value={paymentDetails.bankName || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                        placeholder="e.g. GCB Bank"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Acc Number</label>
                      <Input
                        value={paymentDetails.bankAccountNumber || ''}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, bankAccountNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Physical Cash / General Instructions
                    </label>
                    <textarea
                      className="w-full resize-none rounded-lg border bg-white p-2"
                      rows={4}
                      value={paymentDetails.paymentInstructions || ''}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, paymentInstructions: e.target.value })
                      }
                      placeholder="Instructions to parents..."
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={savingPayment}>
                    {savingPayment ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Payment Details'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configured Fees</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : fees.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No fees configured yet.</div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {fees.map((fee) => (
                      <div key={fee.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {classNameById.get(fee.class_id || '') || 'All Classes'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {fee.fee_type} · {fee.academic_year} · {fee.term}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">GH{fee.amount}</p>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">{fee.description || '-'}</p>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                            onClick={() => handleEditFee(fee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-800"
                            onClick={() => setFeeToDelete(fee.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="p-3 font-medium">Class</th>
                          <th className="p-3 font-medium">Type</th>
                          <th className="p-3 font-medium">Amount</th>
                          <th className="p-3 font-medium">Term</th>
                          <th className="p-3 font-medium">Desc</th>
                          <th className="p-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {fees.map((fee) => (
                          <tr key={fee.id} className="hover:bg-gray-50">
                            <td className="p-3">
                              {fee.class_id ? classNameById.get(fee.class_id) || 'Unknown' : 'All Classes'}
                            </td>
                            <td className="p-3">{fee.fee_type}</td>
                            <td className="p-3 font-semibold text-green-600">GH{fee.amount}</td>
                            <td className="p-3">{fee.term}</td>
                            <td className="p-3 text-gray-500">{fee.description || '-'}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mr-2 h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                onClick={() => handleEditFee(fee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-800"
                                onClick={() => setFeeToDelete(fee.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <ConfirmationModal
          isOpen={Boolean(feeToDelete)}
          onClose={() => setFeeToDelete(null)}
          onConfirm={() => feeToDelete && handleDeleteFee(feeToDelete)}
          title="Delete Fee"
          message="Are you sure you want to delete this fee configuration? This action cannot be undone."
          confirmText="Delete Fee"
        />
      </div>
    </div>
  );
}
