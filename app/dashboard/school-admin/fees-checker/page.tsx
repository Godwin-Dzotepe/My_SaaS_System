'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, RefreshCcw } from 'lucide-react';
import { formatGhanaCedis } from '@/lib/currency';

interface FeeCheckerRow {
  id: string;
  parent_name: string;
  parent_phone: string;
  child_name: string;
  class_name: string;
  fee_type: string;
  fee_description: string | null;
  academic_year: string;
  term: string | null;
  total_amount: number;
  amount_paid: number;
  amount_left: number;
  status: string;
  updated_at: string;
}

export default function FeesCheckerPage() {
  const [rows, setRows] = React.useState<FeeCheckerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [draftAmounts, setDraftAmounts] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const fetchRows = React.useCallback(async (search = '') => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/fees-checker${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch fee checker data.');
      }

      const nextRows = Array.isArray(data) ? data : [];
      setRows(nextRows);
      setDraftAmounts(
        nextRows.reduce((acc: Record<string, string>, row: FeeCheckerRow) => {
          acc[row.id] = String(row.amount_paid);
          return acc;
        }, {})
      );
    } catch (fetchError) {
      console.error(fetchError);
      setRows([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch fee checker data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const updateBalance = async (id: string, payload: { amount_paid?: number; quick_status?: 'UNPAID' | 'HALF_PAID' | 'PAID' }) => {
    try {
      setSavingId(id);
      setError('');

      const response = await fetch(`/api/admin/fees-checker/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update fee balance.');
      }

      setRows((current) => current.map((row) => (row.id === id ? data : row)));
      setDraftAmounts((current) => ({
        ...current,
        [id]: String(data.amount_paid),
      }));
    } catch (updateError) {
      console.error(updateError);
      setError(updateError instanceof Error ? updateError.message : 'Failed to update fee balance.');
    } finally {
      setSavingId(null);
    }
  };

  const getStatusTone = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Partially Paid') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      <div className="flex-1 p-4 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fees Checker</h1>
              <p className="text-gray-600">Track what each parent has paid, what is left, and update balances for every child.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => fetchRows(searchTerm)}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by parent, phone, child, fee type, year or class..."
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => fetchRows(searchTerm)}>Search</Button>
              </div>
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Child Fee Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-16 text-center text-gray-500">No fee balances found.</div>
              ) : (
                <div className="space-y-4">
                  {rows.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-gray-900">{row.child_name}</p>
                          <p className="text-sm text-gray-500">{row.class_name}</p>
                          <div className="text-sm text-gray-700">
                            <p className="font-medium">{row.parent_name}</p>
                            <p>{row.parent_phone}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{row.fee_type}</p>
                          <p className="text-sm text-gray-500">{row.fee_description || 'No description'}</p>
                          <p className="text-sm text-gray-500">{row.term || 'No term'} ({row.academic_year})</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-gray-500">Total</p>
                            <p className="mt-1 font-semibold text-gray-900">{formatGhanaCedis(row.total_amount)}</p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 p-3">
                            <p className="text-emerald-700">Paid</p>
                            <p className="mt-1 font-semibold text-emerald-700">{formatGhanaCedis(row.amount_paid)}</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-3">
                            <p className="text-amber-700">Left</p>
                            <p className="mt-1 font-semibold text-amber-700">{formatGhanaCedis(row.amount_left)}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>
                              {row.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              Updated {new Date(row.updated_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftAmounts[row.id] ?? ''}
                              onChange={(e) =>
                                setDraftAmounts((current) => ({
                                  ...current,
                                  [row.id]: e.target.value,
                                }))
                              }
                              placeholder="Amount paid"
                            />
                            <Button
                              variant="outline"
                              disabled={savingId === row.id}
                              onClick={() => updateBalance(row.id, { amount_paid: Number(draftAmounts[row.id] || 0) })}
                            >
                              {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" disabled={savingId === row.id} onClick={() => updateBalance(row.id, { quick_status: 'UNPAID' })}>
                              Unpaid
                            </Button>
                            <Button variant="outline" size="sm" disabled={savingId === row.id} onClick={() => updateBalance(row.id, { quick_status: 'HALF_PAID' })}>
                              Half Paid
                            </Button>
                            <Button size="sm" disabled={savingId === row.id} onClick={() => updateBalance(row.id, { quick_status: 'PAID' })}>
                              Paid
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
