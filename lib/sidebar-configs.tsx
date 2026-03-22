import {
  Users, 
  GraduationCap, 
  School, 
  Calendar, 
  CreditCard, 
  Bell, 
  TrendingUp,
  MessageSquare,
  Settings,
  UserCircle,
  BookOpen,
  FileText,
  CheckSquare, // New icon
  XSquare,     // New icon
  CalendarDays, // New icon
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import React from 'react';

export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard/school-admin', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Students', href: '/dashboard/school-admin/students', icon: <Users className="w-5 h-5" /> },
  { label: 'Attendance', href: '/dashboard/school-admin/attendance', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Parents', href: '/dashboard/school-admin/parents', icon: <UserCircle className="w-5 h-5" /> },
  { label: 'Teachers', href: '/dashboard/school-admin/teachers', icon: <GraduationCap className="w-5 h-5" /> },{ label: 'Teacher Attendance', href: '/dashboard/school-admin/teacher-attendance', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Attendance Records', href: '/dashboard/school-admin/teacher-attendance/records', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'Secretaries', href: '/dashboard/school-admin/secretaries', icon: <Users className="w-5 h-5" /> },
  { label: 'Classes', href: '/dashboard/school-admin/classes', icon: <School className="w-5 h-5" /> },
  { label: 'Subjects', href: '/dashboard/school-admin/subjects', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Grading', href: '/dashboard/school-admin/grading', icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Fees Config', href: '/dashboard/school-admin/fees', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Fees Checker', href: '/dashboard/school-admin/fees-checker', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Finance', href: '/dashboard/school-admin/finance', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Messages', href: '/dashboard/school-admin/messaging', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events', href: '/dashboard/school-admin/events', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/school-admin/announcements', icon: <Bell className="w-5 h-5" /> },{ label: 'Staff Alerts', href: '/dashboard/school-admin/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'Account', href: '/dashboard/school-admin/settings', icon: <Settings className="w-5 h-5" /> },
];

export const SECRETARY_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard/secretary', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Students', href: '/dashboard/secretary/students', icon: <Users className="w-5 h-5" /> },{ label: 'Teacher Attendance', href: '/dashboard/secretary/teacher-attendance', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Attendance', href: '/dashboard/secretary/attendance', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Messages', href: '/dashboard/secretary/messaging', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events', href: '/dashboard/secretary/events', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/secretary/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'Account', href: '/dashboard/secretary/settings', icon: <Settings className="w-5 h-5" /> },
];

export const TEACHER_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard/teacher', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'My Class', href: '/dashboard/teacher/class', icon: <Users className="w-5 h-5" /> },
  { label: 'Mark Attendance', href: '/dashboard/teacher/attendance/mark', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'My Attendance', href: '/dashboard/teacher/attendance-records', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'View Attendance', href: '/dashboard/teacher/attendance/view', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Present Students', href: '/dashboard/teacher/attendance/present', icon: <CheckSquare className="w-5 h-5" /> },
  { label: 'Absent Students', href: '/dashboard/teacher/attendance/absent', icon: <XSquare className="w-5 h-5" /> },
  { label: 'Scoring', href: '/dashboard/teacher/scoring', icon: <FileText className="w-5 h-5" /> },
  { label: 'Messages', href: '/dashboard/teacher/messaging', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events', href: '/dashboard/teacher/events', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/teacher/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'Account', href: '/dashboard/teacher/settings', icon: <Settings className="w-5 h-5" /> },
];

export const PARENT_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard/parent', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Children', href: '/dashboard/parent/children', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Results', href: '/dashboard/parent/results', icon: <FileText className="w-5 h-5" /> },
  { label: 'Attendance', href: '/dashboard/parent/attendance', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Fees', href: '/dashboard/parent/fees', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Messages', href: '/dashboard/parent/messaging', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events', href: '/dashboard/parent/events', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/parent/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'Account', href: '/dashboard/parent/settings', icon: <Settings className="w-5 h-5" /> },
];

export const SUPER_ADMIN_SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: '/dashboard/super-admin', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Schools', href: '/dashboard/super-admin/schools', icon: <School className="w-5 h-5" /> },
  { label: 'Users', href: '/dashboard/super-admin/users', icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Announcements', href: '/dashboard/super-admin/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'System Broadcaster', href: '/dashboard/super-admin/notifications', icon: <Bell className="w-5 h-5" /> },{ label: 'Settings', href: '/dashboard/super-admin/settings', icon: <Settings className="w-5 h-5" /> },
];

