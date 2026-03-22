'use client';

import * as React from 'react';
import { MessageCenter } from '@/components/messaging/message-center';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

const recipientOptions = [
  { value: 'school_admin', label: 'School Admin' },
] as const;

export default function TeacherMessagingPage() {
  const [userName, setUserName] = React.useState('Teacher');

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
      subheading="Send a message to your school admin, and manage the ones you have already sent."
      currentRole="teacher"
      userName={userName}
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
      recipientOptions={[...recipientOptions]}
    />
  );
}
