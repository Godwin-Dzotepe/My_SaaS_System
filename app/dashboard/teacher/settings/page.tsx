'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { User, Lock, BookOpen, Loader2, Save, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const TABS = [
  { id: 'profile',    label: 'Profile',           icon: User },
  { id: 'password',   label: 'Password',           icon: Lock },
  { id: 'assignment', label: 'My Class & Subjects', icon: BookOpen },
];

export default function TeacherSettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [tab, setTab] = React.useState('profile');
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Teacher');

  // Profile
  const [profile, setProfile] = React.useState({ name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = React.useState({ current: false, next: false, confirm: false });
  const [savingPwd, setSavingPwd] = React.useState(false);

  // Assignment (read-only)
  const [myClass, setMyClass] = React.useState<{ class_name: string } | null>(null);
  const [subjects, setSubjects] = React.useState<{ subject_name: string }[]>([]);
  const [joinedAt, setJoinedAt] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      fetch('/api/account/profile').then(r => r.json()).catch(() => null),
      fetch('/api/teacher/assignment').then(r => r.json()).catch(() => null),
    ]).then(([acc, assignment]) => {
      if (acc) {
        setUserName(acc.name || 'Teacher');
        setProfile({ name: acc.name || '', email: acc.email || '', phone: acc.phone || '' });
        if (acc.created_at) setJoinedAt(new Date(acc.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      }
      if (assignment) {
        if (assignment.assignedClass) setMyClass(assignment.assignedClass);
        if (Array.isArray(assignment.subjects)) setSubjects(assignment.subjects);
        if (assignment.joinedAt && !acc?.created_at) setJoinedAt(new Date(assignment.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      }
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={userName} />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your profile and password</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tab sidebar */}
            <div className="flex lg:flex-col gap-1 lg:w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 h-fit">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" className={inputCls} value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" className={inputCls} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  {joinedAt && <p className="text-xs text-gray-400">Member since {joinedAt}</p>}
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

              {/* ── ASSIGNMENT ── */}
              {tab === 'assignment' && (
                <div className="space-y-6 max-w-lg">
                  <h2 className="text-base font-semibold text-gray-900">My Class &amp; Subjects</h2>
                  <p className="text-sm text-gray-500">Assigned by your school admin. Contact them to make changes.</p>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Assigned Class</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {myClass ? myClass.class_name : <span className="font-normal text-gray-400">No class assigned yet</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Subjects</p>
                    {subjects.length === 0 ? (
                      <p className="text-sm text-gray-400">No subjects assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {subjects.map((s, i) => (
                          <span key={i} className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-sm text-blue-700 font-medium">
                            <BookOpen className="w-3.5 h-3.5" />{s.subject_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
