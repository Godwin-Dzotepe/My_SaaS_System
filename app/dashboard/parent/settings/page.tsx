'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { User, Lock, Users, Loader2, Save, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const TABS = [
  { id: 'profile',  label: 'Profile',      icon: User },
  { id: 'password', label: 'Password',      icon: Lock },
  { id: 'children', label: 'My Children',   icon: Users },
];

interface Child {
  id: string;
  name: string;
  student_number: string | null;
  class: { class_name: string };
  status: string;
}

export default function ParentSettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [tab, setTab] = React.useState('profile');
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  // Profile
  const [profile, setProfile] = React.useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = React.useState({ current: false, next: false, confirm: false });
  const [savingPwd, setSavingPwd] = React.useState(false);

  // Children
  const [children, setChildren] = React.useState<Child[]>([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/account/profile').then(r => r.json()),
      fetch('/api/parent/children').then(r => r.json()).catch(() => []),
    ]).then(([acc, kids]) => {
      if (acc?.name) {
        setUserName(acc.name);
        setProfile({ name: acc.name || '', phone: acc.phone || '' });
      }
      if (Array.isArray(kids)) setChildren(kids);
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setUserName(profile.name);
      toastSuccess('Profile updated');
    } catch (e: any) { toastError(e.message); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { toastError('Passwords do not match'); return; }
    if (pwd.next.length < 6) { toastError('New password must be at least 6 characters'); return; }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setPwd({ current: '', next: '', confirm: '' });
      toastSuccess('Password changed successfully');
    } catch (e: any) { toastError(e.message); }
    finally { setSavingPwd(false); }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white';
  const saveBtnCls = 'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60';

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />

      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your profile and password</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tab sidebar */}
            <div className="flex lg:flex-col gap-1 lg:w-48 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 h-fit">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                    <Icon className="w-4 h-4 shrink-0" />{t.label}
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

              {/* ── PROFILE ── */}
              {tab === 'profile' && (
                <form onSubmit={saveProfile} className="space-y-5 max-w-lg">
                  <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input className={inputCls} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" className={inputCls} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">This is your login phone number. Change it carefully.</p>
                  </div>
                  <button type="submit" disabled={savingProfile} className={saveBtnCls}>
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
                  </button>
                </form>
              )}

              {/* ── PASSWORD ── */}
              {tab === 'password' && (
                <form onSubmit={savePassword} className="space-y-5 max-w-lg">
                  <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
                  {(['current', 'next', 'confirm'] as const).map((k, i) => (
                    <div key={k}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {['Current Password', 'New Password', 'Confirm New Password'][i]}
                      </label>
                      <div className="relative">
                        <input type={showPwd[k] ? 'text' : 'password'} className={inputCls + ' pr-10'}
                          value={pwd[k]} onChange={e => setPwd(p => ({ ...p, [k]: e.target.value }))} required />
                        <button type="button" onClick={() => setShowPwd(s => ({ ...s, [k]: !s[k] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={savingPwd} className={saveBtnCls}>
                    {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
                  </button>
                </form>
              )}

              {/* ── CHILDREN ── */}
              {tab === 'children' && (
                <div className="space-y-4 max-w-lg">
                  <h2 className="text-base font-semibold text-gray-900">My Children</h2>
                  <p className="text-sm text-gray-500">Children linked to your account. Contact the school to make changes.</p>
                  {children.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
                      <GraduationCap className="mx-auto w-10 h-10 mb-3 opacity-30" />
                      <p className="font-medium">No children linked</p>
                      <p className="text-sm mt-1">Ask your school admin to link your children to your account.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {children.map(child => (
                        <div key={child.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm shrink-0">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{child.name}</p>
                            <p className="text-xs text-gray-500">{child.class?.class_name}{child.student_number ? ` · ${child.student_number}` : ''}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${child.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {child.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
