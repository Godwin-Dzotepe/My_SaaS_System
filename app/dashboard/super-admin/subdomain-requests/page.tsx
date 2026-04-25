'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Globe, CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Request {
  id: string;
  school_name: string;
  subdomain_request: string;
  subdomain_status: string;
  subdomain: string | null;
}

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'kobby.dev';

export default function SubdomainRequestsPage() {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveSlug, setApproveSlug] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch('/api/super-admin/subdomain-requests');
    const data = await res.json().catch(() => []);
    setRequests(Array.isArray(data) ? data : []);
    const initial: Record<string, string> = {};
    data.forEach((r: Request) => { initial[r.id] = r.subdomain_request || ''; });
    setApproveSlug(initial);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (schoolId: string, action: 'approve' | 'reject') => {
    setSaving(schoolId);
    try {
      const res = await fetch('/api/super-admin/subdomain-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, action, subdomain: approveSlug[schoolId] }),
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="Super Admin" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" /> Subdomain Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve school custom subdomain requests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            <Globe className="mx-auto w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No pending subdomain requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.school_name}</p>
                      <p className="text-sm text-gray-500">Requested: <span className="font-mono text-blue-600">{r.subdomain_request}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 rounded-xl border border-gray-200 overflow-hidden">
                      <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                        {BASE_DOMAIN}/
                      </span>
                      <input
                        type="text"
                        value={approveSlug[r.id] ?? r.subdomain_request}
                        onChange={e => setApproveSlug(s => ({ ...s, [r.id]: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        className="px-3 py-2 text-sm font-mono outline-none w-32"
                        placeholder="slug"
                      />
                    </div>
                    <button
                      onClick={() => handleAction(r.id, 'approve')}
                      disabled={saving === r.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'reject')}
                      disabled={saving === r.id}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Will be accessible at: <span className="font-mono text-gray-600">{approveSlug[r.id] || r.subdomain_request}.{BASE_DOMAIN}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
