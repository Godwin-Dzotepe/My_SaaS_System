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

export default function SchoolAdminMessagingPage() {
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
      heading="School Messages"
      subheading="Send internal messages to teachers, parents, secretaries, finance admins, and other school admins."
      currentRole="school_admin"
      userName={userName}
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      recipientOptions={[...recipientOptions]}
    />
  );
}
