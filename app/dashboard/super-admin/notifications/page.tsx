'use client';

import * as React from 'react';
import { MessageCenter } from '@/components/messaging/message-center';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

const recipientOptions = [
  { value: 'school_admin', label: 'School Admins' },
] as const;

export default function SuperAdminNotificationsPage() {
  const [userName, setUserName] = React.useState('Super Admin');

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
      heading="School Admin Messages"
      subheading="Send platform-wide messages to school admins only, then edit or delete them from one place."
      currentRole="super_admin"
      userName={userName}
      sidebarItems={SUPER_ADMIN_SIDEBAR_ITEMS}
      recipientOptions={[...recipientOptions]}
    />
  );
}
