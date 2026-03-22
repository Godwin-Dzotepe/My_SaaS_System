'use client';

import * as React from 'react';
import { MessageCenter } from '@/components/messaging/message-center';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

const recipientOptions = [
  { value: 'teacher', label: 'Teachers' },
  { value: 'parent', label: 'Parents' },
  { value: 'secretary', label: 'Secretaries' },
  { value: 'finance_admin', label: 'Finance Admins' },
  { value: 'school_admin', label: 'School Admins' },
] as const;

export default function SchoolAdminNotificationsPage() {
  const [userName, setUserName] = React.useState('School Admin');

  React.useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (data?.user?.name) {
          setUserName(data.user.name);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <MessageCenter
      heading="Staff & Parent Messages"
      subheading="Create, preview, edit, and delete the messages your school sends across the system."
      currentRole="school_admin"
      userName={userName}
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      recipientOptions={[...recipientOptions]}
    />
  );
}
