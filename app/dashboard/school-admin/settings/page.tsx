'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import {
  User, Lock, School, CalendarDays, ShieldCheck, ShieldOff,
  Loader2, CheckCircle2, XCircle, Save, Eye, EyeOff,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';

const TABS = [
  { id: 'profile',  label: 'Profile',       icon: User },
  { id: 'password', label: 'Password',       icon: Lock },
  { id: 'school',   label: 'School Info',    icon: School },
  { id: 'term',     label: 'Academic Term',  icon: CalendarDays },
  { id: 'security', label: 'Security (2FA)', icon: ShieldCheck },
];

export default function SchoolAdminSettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [tab, setTab] = React.useState('profile');
  const [userName, setUserName] = React.useState('Admin');
  const [loading, setLoading] = React.useState(true);

  // Profile
  const [profile, setProfile] = React.useState({ name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = React.useState({ current: false, next: false, confirm: false });
  const [savingPwd, setSavingPwd] = React.useState(false);

  // School info
  const [school, setSchool] = React.useState({ school_name: '', address: '', phone: '' });
  const [savingSchool, setSavingSchool] = React.useState(false);

  // Academic term
  const [terms, setTerms] = React.useState<{ id: string; academic_year: string; term: string; is_active: boolean }[]>([]);
  const [termForm, setTermForm] = React.useState({ academic_year: '', term: 'Term 1' });
  const [savingTerm, setSavingTerm] = React.useState(false);

  // 2FA
  const [has2fa, setHas2fa] = React.useState<boolean | null>(null);
  const [totpStatus, setTotpStatus] = React.useState<'idle' | 'loading' | 'setup' | 'success' | 'error'>('idle');
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [verifyCode, setVerifyCode] = React.useState('');
  const [disableCode, setDisableCode] = React.useState('');
  const [showDisable, setShowDisable] = React.useState(false);
  const [totpMsg, setTotpMsg] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).catch(() => ({})),
      fetch('/api/account/profile').then(r => r.json()).catch(() => null),
      fetch('/api/school/info').then(r => r.json()).catch(() => null),
      fetch('/api/academic-periods').then(r => r.json()).catch(() => null),
    ]).then(([me, prof, si, ap]) => {
      // User identity (name, 2fa status)
      if (me?.user) {
        setUserName(me.user.name || '');
        setHas2fa(!!me.user.has2fa);
      }
      // Full profile (email + phone come from /api/account/profile)
      if (prof?.id) {
        setUserName(prof.name || '');
        setProfile({ name: prof.name || '', email: prof.email || '', phone: prof.phone || '' });
      }
      // School info
      if (si?.school_name) {
        setSchool({ school_name: si.school_name, address: si.address || '', phone: si.phone || '' });
      }
      // Academic periods — response is { periods, configuredPeriods } or array
      const configured = Array.isArray(ap) ? ap : (ap?.configuredPeriods ?? []);
      setTerms(configured);
      const active = configured.find((t: { is_active: boolean; academic_year: string; term: string }) => t.is_active);
      if (active) setTermForm({ academic_year: active.academic_year, term: active.term });
    }).finally(() => setLoading(false));
  }, []);

  // ── Profile save ───────────────────────────────────────────────────────────
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

  // ── Password save ──────────────────────────────────────────────────────────
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

  // ── School info save ───────────────────────────────────────────────────────
  const saveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchool(true);
    try {
      const res = await fetch('/api/school/info', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(school),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toastSuccess('School information updated');
    } catch (e: any) { toastError(e.message); }
    finally { setSavingSchool(false); }
  };

  // ── Academic term save ─────────────────────────────────────────────────────
  const saveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTerm(true);
    try {
      const res = await fetch('/api/academic-periods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...termForm, is_active: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const updated = await fetch('/api/academic-periods').then(r => r.json()).catch(() => []);
      if (Array.isArray(updated)) setTerms(updated);
      toastSuccess('Active term set');
    } catch (e: any) { toastError(e.message); }
    finally { setSavingTerm(false); }
  };

  // ── 2FA handlers ───────────────────────────────────────────────────────────
  const setup2fa = async () => {
    setTotpStatus('loading'); setTotpMsg('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSecret(d.secret);
      const QR = (await import('qrcode')).default;
      setQrDataUrl(await QR.toDataURL(d.uri, { width: 200, margin: 2 }));
      setTotpStatus('setup');
    } catch (e: any) { setTotpMsg(e.message); setTotpStatus('error'); }
  };

  const verify2fa = async (e: React.FormEvent) => {
    e.preventDefault(); setTotpStatus('loading'); setTotpMsg('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'setup', token: verifyCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setHas2fa(true); setTotpStatus('success'); setQrDataUrl(''); setSecret(''); setVerifyCode('');
      setTotpMsg('Two-factor authentication enabled.');
    } catch (e: any) { setTotpMsg(e.message); setTotpStatus('setup'); }
  };

  const disable2fa = async (e: React.FormEvent) => {
    e.preventDefault(); setTotpStatus('loading'); setTotpMsg('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp_token: disableCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setHas2fa(false); setTotpStatus('idle'); setShowDisable(false); setDisableCode('');
      setTotpMsg('Two-factor authentication disabled.');
    } catch (e: any) { setTotpMsg(e.message); setTotpStatus('idle'); }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white';
  const saveBtnCls = 'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60';

  const activeTerm = terms.find(t => t.is_active);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your profile, password, school information and security</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tab sidebar */}
            <div className="flex overflow-x-auto lg:flex-col gap-1 lg:w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 h-fit">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 shrink-0 lg:shrink px-3 py-2.5 rounded-xl text-sm font-medium lg:w-full text-left transition-all ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">

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

              {/* ── SCHOOL INFO ── */}
              {tab === 'school' && (
                <form onSubmit={saveSchool} className="space-y-5 max-w-lg">
                  <h2 className="text-base font-semibold text-gray-900">School Information</h2>
                  <p className="text-sm text-gray-500">This information appears on report cards, fee receipts and the parent portal.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input className={inputCls} value={school.school_name} onChange={e => setSchool(s => ({ ...s, school_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input className={inputCls} value={school.address} onChange={e => setSchool(s => ({ ...s, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" className={inputCls} value={school.phone} onChange={e => setSchool(s => ({ ...s, phone: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={savingSchool} className={saveBtnCls}>
                    {savingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save School Info
                  </button>
                </form>
              )}

              {/* ── ACADEMIC TERM ── */}
              {tab === 'term' && (
                <div className="max-w-lg space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Active Academic Term</h2>
                    <p className="text-sm text-gray-500 mt-0.5">The active term controls which period teachers enter scores for and what parents see.</p>
                  </div>
                  {activeTerm ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Currently Active</p>
                        <p className="text-sm text-emerald-700">{activeTerm.academic_year} — {activeTerm.term}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">No active term set yet.</div>
                  )}

                  <form onSubmit={saveTerm} className="space-y-4 border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700">Set New Active Term</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input className={inputCls} placeholder="e.g. 2024/2025"
                        value={termForm.academic_year} onChange={e => setTermForm(f => ({ ...f, academic_year: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                      <select className={inputCls} value={termForm.term} onChange={e => setTermForm(f => ({ ...f, term: e.target.value }))}>
                        <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                      </select>
                    </div>
                    <button type="submit" disabled={savingTerm} className={saveBtnCls}>
                      {savingTerm ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} Set as Active Term
                    </button>
                  </form>

                  {terms.length > 0 && (
                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">All Terms</h3>
                      <div className="space-y-2">
                        {terms.map(t => (
                          <div key={t.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm border ${t.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <span className={t.is_active ? 'font-semibold text-blue-700' : 'text-gray-600'}>{t.academic_year} — {t.term}</span>
                            {t.is_active && <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECURITY / 2FA ── */}
              {tab === 'security' && (
                <div className="max-w-lg space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Require a 6-digit code from your authenticator app on every login.</p>
                    </div>
                    {has2fa !== null && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${has2fa ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {has2fa ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {totpMsg && (
                    <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${totpStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                      {totpStatus === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{totpMsg}
                    </div>
                  )}

                  {has2fa === false && totpStatus === 'idle' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Use Google Authenticator, Authy, or any TOTP app.</p>
                      <button onClick={setup2fa} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        <ShieldCheck className="w-4 h-4" /> Enable 2FA
                      </button>
                    </div>
                  )}

                  {totpStatus === 'loading' && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</div>}

                  {totpStatus === 'setup' && qrDataUrl && (
                    <form onSubmit={verify2fa} className="space-y-4">
                      <p className="text-sm text-gray-600">Scan the QR code with your authenticator app, then enter the 6-digit code.</p>
                      <div className="flex justify-center"><Image src={qrDataUrl} alt="2FA QR" width={200} height={200} className="rounded-xl border border-gray-200 p-2" /></div>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-mono text-gray-600 break-all">
                        <span className="block text-gray-400 mb-1 font-sans">Manual entry key:</span>{secret}
                      </div>
                      <input type="text" inputMode="numeric" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000" autoFocus className="w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-2xl font-mono tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                      <div className="flex gap-3">
                        <button type="submit" disabled={verifyCode.length !== 6} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Confirm & Enable</button>
                        <button type="button" onClick={() => { setTotpStatus('idle'); setQrDataUrl(''); setSecret(''); setVerifyCode(''); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  )}

                  {has2fa === true && !showDisable && totpStatus !== 'loading' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Your account is protected. You&apos;ll be asked for a TOTP code on every login.</p>
                      <button onClick={() => setShowDisable(true)} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                        <ShieldOff className="w-4 h-4" /> Disable 2FA
                      </button>
                    </div>
                  )}

                  {has2fa === true && showDisable && (
                    <form onSubmit={disable2fa} className="space-y-4">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Enter your current TOTP code to confirm disabling 2FA.</div>
                      <input type="text" inputMode="numeric" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000" autoFocus className="w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-2xl font-mono tracking-widest outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                      <div className="flex gap-3">
                        <button type="submit" disabled={disableCode.length !== 6} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">Confirm Disable</button>
                        <button type="button" onClick={() => { setShowDisable(false); setDisableCode(''); setTotpMsg(''); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
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
