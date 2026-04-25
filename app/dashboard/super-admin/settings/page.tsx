'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import {
  Globe, CheckCircle2, XCircle, Loader2, Building2,
  Trash2, Clock, BadgeCheck, Settings,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface DomainRequest {
  id: string;
  school_name: string;
  subdomain_request: string | null;
  subdomain_status: string;
  subdomain: string | null;
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'kobby.dev';

const statusBadge = (status: string) => {
  if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
  if (status === 'approved') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck className="w-3 h-3" /> Approved</span>;
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Declined</span>;
  return null;
};

export default function SuperAdminSettingsPage() {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugOverride, setSlugOverride] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch('/api/super-admin/subdomain-requests');
    const data = await res.json().catch(() => []);
    const list = Array.isArray(data) ? data : [];
    setRequests(list);
    const init: Record<string, string> = {};
    list.forEach((r: DomainRequest) => { init[r.id] = r.subdomain || r.subdomain_request || ''; });
    setSlugOverride(init);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (schoolId: string, action: 'approve' | 'reject' | 'delete') => {
    setSaving(schoolId + action);
    try {
      const res = await fetch('/api/super-admin/subdomain-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, action, subdomain: slugOverride[schoolId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success(data.message);
      fetchRequests();
    } catch (e: any) {
      toastError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const pending = requests.filter(r => r.subdomain_status === 'pending');
  const approved = requests.filter(r => r.subdomain_status === 'approved');
  const rejected = requests.filter(r => r.subdomain_status === 'rejected');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="Super Admin" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" /> Super Admin Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage system-wide configuration</p>
        </div>

        {/* Domain Requests Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Custom Domain Requests</h2>
              <p className="text-xs text-gray-500">Review, approve or decline school subdomain requests</p>
            </div>
            {pending.length > 0 && (
              <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pending.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Globe className="mx-auto w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">No domain requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">

              {/* Pending */}
              {pending.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pending Approval</p>
                  <div className="space-y-3">
                    {pending.map(r => (
                      <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{r.school_name}</p>
                            <p className="text-xs text-gray-500">Requested: <span className="font-mono text-amber-700">{r.subdomain_request}</span></p>
                          </div>
                          <div className="ml-2">{statusBadge(r.subdomain_status)}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden text-sm">
                            <input
                              type="text"
                              value={slugOverride[r.id] ?? ''}
                              onChange={e => setSlugOverride(s => ({ ...s, [r.id]: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                              className="px-3 py-2 w-28 font-mono outline-none"
                              placeholder="slug"
                            />
                            <span className="px-2 py-2 text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">.{BASE_DOMAIN}</span>
                          </div>
                          <button onClick={() => handleAction(r.id, 'approve')} disabled={saving === r.id + 'approve'}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                            {saving === r.id + 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject')} disabled={saving === r.id + 'reject'}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                            {saving === r.id + 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              {approved.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Approved Domains</p>
                  <div className="space-y-3">
                    {approved.map(r => (
                      <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{r.school_name}</p>
                            <p className="text-xs font-mono text-emerald-700">{r.subdomain}.{BASE_DOMAIN}</p>
                          </div>
                          <div className="ml-2">{statusBadge(r.subdomain_status)}</div>
                        </div>
                        <button onClick={() => handleAction(r.id, 'delete')} disabled={saving === r.id + 'delete'}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                          {saving === r.id + 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected */}
              {rejected.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Declined Requests</p>
                  <div className="space-y-3">
                    {rejected.map(r => (
                      <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{r.school_name}</p>
                            <p className="text-xs text-gray-400">Request was declined</p>
                          </div>
                          <div className="ml-2">{statusBadge(r.subdomain_status)}</div>
                        </div>
                        <button onClick={() => handleAction(r.id, 'delete')} disabled={saving === r.id + 'delete'}
                          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-60">
                          {saving === r.id + 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
