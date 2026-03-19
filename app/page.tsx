'use client';

import Link from 'next/link';
import { 
  GraduationCap, 
  CheckCircle2, 
  Users, 
  School, 
  CreditCard, 
  Bell, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">EduManage</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors hidden md:block" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 transition-colors hidden md:block" href="#pricing">
            Pricing
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6 animate-bounce">
                <Badge className="bg-blue-600">New</Badge>
                Multi-School Support is here!
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Manage Multiple Schools with <span className="text-blue-600">One Platform</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-10 leading-relaxed">
                The all-in-one SaaS for modern education. Manage students, parents, teachers, and finances across all your school branches seamlessly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                    Start Free Trial
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 grayscale opacity-70">
                <span className="font-bold text-xl">TRUSTED BY 500+ SCHOOLS</span>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Everything You Need</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Powerful features designed to simplify school administration and enhance the learning experience.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Multi-School Management', icon: <School className="w-6 h-6" />, desc: 'Control multiple branches from a single super-admin dashboard.' },
                { title: 'Student & Parent Portal', icon: <Users className="w-6 h-6" />, desc: 'Dedicated portals for parents to track attendance, grades, and pay fees.' },
                { title: 'Teacher Dashboard', icon: <GraduationCap className="w-6 h-6" />, desc: 'Streamline attendance marking and result entry for educators.' },
                { title: 'Financial Tracking', icon: <CreditCard className="w-6 h-6" />, desc: 'Automate fee collection, track unpaid bills, and generate reports.' },
                { title: 'Real-time Notifications', icon: <Bell className="w-6 h-6" />, desc: 'Keep everyone informed with SMS and email announcements.' },
                { title: 'Advanced Analytics', icon: <BarChart3 className="w-6 h-6" />, desc: 'Insights into student performance and financial health.' },
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">Choose the plan that fits your institution&apos;s size.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$49",
                  period: "/month",
                  description: "Perfect for small schools",
                  features: ["Up to 200 students", "2 schools", "Basic reporting", "Email support"]
                },
                {
                  name: "Professional",
                  price: "$99",
                  period: "/month",
                  description: "For growing institutions",
                  features: ["Up to 1000 students", "5 schools", "Advanced analytics", "SMS notifications", "Priority support"],
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "",
                  description: "For large school networks",
                  features: ["Unlimited students", "Unlimited schools", "Custom integrations", "Dedicated support", "SLA guarantee"]
                }
              ].map((plan, idx) => (
                <div key={idx} className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-blue-600 shadow-lg ring-1 ring-blue-600' : 'border-gray-200'} bg-white`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your School Management?</h2>
            <p className="text-blue-100 mb-8 text-lg">Join hundreds of schools already using EduManage</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 px-8">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">EduManage</span>
              </div>
              <p className="text-sm">Modern student management for the digital age.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2026 EduManage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}