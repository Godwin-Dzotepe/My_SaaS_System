'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  Bell,
  CreditCard,
  School,
  ChevronRight,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { CalendarWidget } from '@/components/dashboard/calendar-widget';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const children = [
  {
    id: 1,
    name: 'Sarah Johnson',
    school: 'Lincoln High School',
    class: 'Class 5 - Blue',
    rollNumber: 'LH-2024-005',
    avatar: 'SJ',
    attendance: '95%',
    lastResult: 'A+',
    pendingFees: 0
  },
  {
    id: 2,
    name: 'Michael Johnson',
    school: 'St. Mary\'s Academy',
    class: 'JHS 2 - Gold',
    rollNumber: 'SMA-2023-042',
    avatar: 'MJ',
    attendance: '88%',
    lastResult: 'B+',
    pendingFees: 450
  }
];

const notifications = [
  { id: 1, title: 'Fee Payment Due', message: 'Second term fees due by March 15', time: '2 hours ago', type: 'warning' },
  { id: 2, title: 'Exam Results Published', message: 'Mid-term results are now available', time: '1 day ago', type: 'success' },
  { id: 3, title: 'Parent-Teacher Meeting', message: 'Scheduled for March 20, 2024', time: '2 days ago', type: 'info' },
];

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

export default function ParentDashboard() {
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setUserName(user.name);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Welcome Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff9d01] rounded-full flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#212529]">Welcome back, {userName}!</h1>
                <p className="text-[#646464] text-sm">Monitor your children&apos;s academic progress and activities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-4 hidden md:block">
                <p className="text-sm font-medium text-[#212529]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-xs text-[#646464]">Current System Time</p>
              </div>
              <Button variant="outline" className="gap-2 border-[#ff9d01] text-[#ff9d01] hover:bg-[#ff9d01] hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <Badge className="bg-[#ff9d01] text-white border-none ml-1">3</Badge>
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
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
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Total Children</p>
                    <h3 className="text-2xl font-bold text-[#212529]">02</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#fff2d8] flex items-center justify-center text-[#ffa001] group-hover:bg-[#ffa001] group-hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Attendance</p>
                    <h3 className="text-2xl font-bold text-[#212529]">91.5%</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ffeaea] flex items-center justify-center text-[#ff0000] group-hover:bg-[#ff0000] group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Pending Fees</p>
                    <h3 className="text-2xl font-bold text-[#212529]">$450</h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e7ffdf] flex items-center justify-center text-[#1d9d00] group-hover:bg-[#1d9d00] group-hover:text-white transition-colors">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Notifications</p>
                    <h3 className="text-2xl font-bold text-[#212529]">03</h3>
                  </div>
               </div>
            </Card>
          </motion.div>

          {/* Children Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child, idx) => (
              <motion.div key={child.id} variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-2 w-full bg-[#3f7afc]"></div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#f0f1f3] flex items-center justify-center text-[#3f7afc] font-bold text-xl border border-gray-100 group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                          {child.avatar}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#212529] text-xl">{child.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#646464] mt-1">
                            <School className="w-4 h-4 text-[#ffa001]" />
                            {child.school}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="bg-[#f0f1f3] text-[#212529] hover:bg-[#e0e1e3] border-none font-medium">
                              {child.class}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#e1f1ff] text-[#3f7afc] hover:bg-[#d1e1ff] border-none font-medium">
                              {child.rollNumber}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={child.pendingFees > 0 ? 'bg-[#ff0000] text-white' : 'bg-[#1d9d00] text-white'}>
                        {child.pendingFees > 0 ? 'Fees Due' : 'Paid'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 py-5 bg-[#f8f9fb] rounded-xl px-4 mb-6">
                      <div className="text-center">
                        <p className="text-sm text-[#646464] mb-1">Attendance</p>
                        <p className="text-lg font-bold text-[#212529]">{child.attendance}</p>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <p className="text-sm text-[#646464] mb-1">Latest Grade</p>
                        <p className="text-lg font-bold text-[#3f7afc]">{child.lastResult}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#646464] mb-1">Fees</p>
                        <p className={`text-lg font-bold ${child.pendingFees > 0 ? 'text-[#ff0000]' : 'text-[#1d9d00]'}`}>
                          {child.pendingFees > 0 ? `$${child.pendingFees}` : 'Cleared'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Link href={`/dashboard/parent/children/${child.id}/results`} className="flex-1">
                        <Button className="w-full gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] text-white border-none shadow-sm transition-all hover:translate-y-[-2px]">
                          <FileText className="w-4 h-4" />
                          Academic Results
                        </Button>
                      </Link>
                      <Link href={`/dashboard/parent/children/${child.id}/attendance`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 border-[#3f7afc] text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white transition-all hover:translate-y-[-2px]">
                          <Calendar className="w-4 h-4" />
                          View Attendance
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom Grid: Recent Notifications & School Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Notifications */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm bg-white h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#ffa001]" />
                    Recent Notifications
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[#3f7afc] hover:text-[#3f7afc] hover:bg-[#e1f1ff] font-semibold">
                    See All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {notifications.map((notification, idx) => (
                      <motion.div 
                        key={notification.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 bg-[#f8f9fb] hover:bg-white hover:shadow-md hover:border-[#3f7afc]/20 transition-all cursor-pointer group"
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-110 ${
                          notification.type === 'warning' ? 'bg-[#fff2d8] text-[#ffa001]' :
                          notification.type === 'success' ? 'bg-[#e7ffdf] text-[#1d9d00]' : 'bg-[#e1f1ff] text-[#3f7afc]'
                        }`}>
                          {notification.type === 'warning' ? <Clock className="w-5 h-5" /> : 
                           notification.type === 'success' ? <TrendingUp className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-[#212529]">{notification.title}</h4>
                            <span className="text-[10px] font-bold text-[#646464] bg-[#f0f1f3] px-2 py-1 rounded-full uppercase tracking-tighter">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-sm text-[#646464] mt-1 leading-relaxed">{notification.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Side Card: Calendar Widget */}
            <motion.div variants={itemVariants}>
              <CalendarWidget />
              
              <Card className="border-none shadow-sm bg-gradient-to-br from-[#ffa001] to-[#ff9d01] text-white mt-6">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    School Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-50 text-xs mb-3">You have a pending balance for Michael Johnson.</p>
                  <Button variant="outline" className="w-full bg-white text-[#ffa001] border-none hover:bg-amber-50 text-xs">
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
