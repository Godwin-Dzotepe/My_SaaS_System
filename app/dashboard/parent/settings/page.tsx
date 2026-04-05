'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Eye, EyeOff, Lock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { MessageDialog } from '@/components/ui/message-dialog';

export default function ParentSettingsPage() {
  const [userName, setUserName] = React.useState('Parent');
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUserName(d.user.name); }).catch(console.error);
  }, []);

  const validateForm = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill old password, new password, and confirm password.');
      return false;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return false;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from old password.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/parent/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to change password.');
      }

      setConfirmOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessOpen(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to change password.');
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Settings className="w-6 h-6 text-gray-600" />
            Settings
          </h1>
        </div>

        <Card className="max-w-2xl border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-gray-600" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Old Password</label>
              <div className="relative">
                <Input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter old password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveClick} disabled={saving} className="bg-[#3f7afc] hover:bg-[#2d6ae0]">
                Save Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Password Change"
        message="Are you sure you want to save this new password?"
        confirmText="Yes, Save"
        cancelText="Cancel"
        isLoading={saving}
      />

      <MessageDialog
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Password Updated"
        message="Your password has been changed successfully."
        tone="success"
        actionLabel="OK"
      />
    </div>
  );
}
