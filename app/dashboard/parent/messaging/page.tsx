'use client';

import * as React from 'react';
import { MessageCenter } from '@/components/messaging/message-center';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

const recipientOptions = [
  { value: 'school_admin', label: 'School Admin' },
] as const;

export default function ParentMessagingPage() {
  const [userName, setUserName] = React.useState('Parent');

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
      heading="Message School Admin"
      subheading="Send a message to your school admin and keep track of the replies in one place."
      currentRole="parent"
      userName={userName}
      sidebarItems={PARENT_SIDEBAR_ITEMS}
      recipientOptions={[...recipientOptions]}
    />
  );
}
