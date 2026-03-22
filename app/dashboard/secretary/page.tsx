'use client';

import * as React from 'react';
import {
  School,
  Calendar,
  Bell,
  PlusCircle,
  Upload,
  Search,
  ChevronRight,
  Clock,
  MessageSquare,
  UserPlus,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function SecretaryDashboard() {
  const [userName, setUserName] = React.useState('Secretary');

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName={userName} />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-xl font-bold text-[#212529]">Secretary Dashboard</h1>
              <nav className="flex text-xs text-[#646464] mt-1 gap-1">
                <span className="hover:text-[#3f7afc] cursor-pointer">Home</span>
                <span>/</span>
                <span className="text-[#3f7afc]">Secretary</span>
              </nav>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/secretary/students/new">
                <Button className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] transition-all">
                  <PlusCircle className="w-4 h-4" />
                  Add Student
                </Button>
              </Link>
              <Link href="/dashboard/secretary/students/upload">
                <Button variant="outline" className="gap-2 border-gray-200 text-[#646464]">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e1f1ff] flex items-center justify-center text-[#3f7afc] group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Students</p>
                    <h3 className="text-2xl font-bold text-[#212529]">1,240</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#fff2d8] flex items-center justify-center text-[#ffa001] group-hover:bg-[#ffa001] group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Attendance</p>
                    <h3 className="text-2xl font-bold text-[#212529]">94%</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e7ffdf] flex items-center justify-center text-[#1d9d00] group-hover:bg-[#1d9d00] group-hover:text-white transition-colors">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Classes</p>
                    <h3 className="text-2xl font-bold text-[#212529]">24</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ffeaea] flex items-center justify-center text-[#ff0000] group-hover:bg-[#ff0000] group-hover:text-white transition-colors">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Notifications</p>
                    <h3 className="text-2xl font-bold text-[#212529]">08</h3>
                  </div>
               </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4 px-6">
                  <CardTitle className="text-lg font-bold text-[#212529]">Recent Student Activities</CardTitle>
                  <div className="relative w-64 hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#646464]" />
                    <Input placeholder="Search records..." className="pl-10 h-9 bg-[#f0f1f3] border-none text-sm placeholder:text-[#646464]" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {[
                      { name: 'Alice Smith', action: 'Added to Class 5', time: '2 mins ago', avatar: 'AS' },
                      { name: 'John Doe', action: 'Attendance marked: Present', time: '1 hour ago', avatar: 'JD' },
                      { name: 'Samuel Mensah', action: 'Fees updated: Paid', time: '3 hours ago', avatar: 'SM' },
                      { name: 'Grace Osei', action: 'Profile updated', time: '5 hours ago', avatar: 'GO' },
                      { name: 'Robert Wilson', action: 'Registered as New Student', time: '6 hours ago', avatar: 'RW' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-[#f8f9fb] transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#3f7afc] font-bold text-sm border border-gray-100 group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                            {activity.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#212529]">{activity.name}</p>
                            <p className="text-xs text-[#646464] font-medium">{activity.action}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-[#ffa001]" />
                          <span className="text-[10px] font-bold text-[#646464] uppercase tracking-tighter">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-gray-50/50 text-center">
                    <Button variant="ghost" size="sm" className="text-[#3f7afc] font-bold hover:bg-[#e1f1ff]">
                      View All Activities <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Link href="/dashboard/secretary/attendance" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#3f7afc]/10 bg-[#e1f1ff]/30 text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white border-none transition-all py-6">
                        <Calendar className="w-5 h-5" /> Take Daily Attendance
                      </Button>
                    </Link>
                    <Link href="/dashboard/secretary/messaging" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#ffa001]/10 bg-[#fff2d8]/30 text-[#ffa001] hover:bg-[#ffa001] hover:text-white border-none transition-all py-6">
                        <MessageSquare className="w-5 h-5" /> Send Announcement
                      </Button>
                    </Link>
                    <Link href="/dashboard/secretary/students/new" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#1d9d00]/10 bg-[#e7ffdf]/30 text-[#1d9d00] hover:bg-[#1d9d00] hover:text-white border-none transition-all py-6">
                        <UserPlus className="w-5 h-5" /> Register New Student
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[#3f7afc] to-[#2d6ae0] text-white overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="relative z-10">
                    <h4 className="text-white font-bold text-lg mb-2">Help Center</h4>
                    <p className="text-blue-100 text-xs mb-4 leading-relaxed">Need help managing student records or school data? Access our guide or contact support.</p>
                    <div className="space-y-2">
                      <Button className="w-full bg-white text-[#3f7afc] border-none hover:bg-blue-50 font-bold text-xs py-5 shadow-lg">
                        Contact Administrator
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent text-white border-white/30 hover:bg-white/10 text-xs py-5">
                        Read Documentation
                      </Button>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
