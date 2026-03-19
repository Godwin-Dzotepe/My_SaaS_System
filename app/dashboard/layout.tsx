import { Navbar } from '@/components/dashboard/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}