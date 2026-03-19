import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduManage - Multi-School Student Management System',
  description: 'Modern SaaS platform for managing multiple schools, students, parents, and finances.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}