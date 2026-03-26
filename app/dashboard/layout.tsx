import { Navbar } from '@/components/dashboard/navbar';
import { DashboardBrandShell } from '@/components/branding/dashboard-brand-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardBrandShell>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </DashboardBrandShell>
  );
}
