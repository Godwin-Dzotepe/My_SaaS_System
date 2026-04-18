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
  CheckSquare,
  XSquare,
  CalendarDays,
  ShieldCheck,
  ClipboardList,
  ArrowUpRight,
  LayoutDashboard,
  UserCog,
  Banknote,
  Megaphone,
  BookMarked,
  UserCheck,
} from 'lucide-react';
import React from 'react';

export interface SidebarChildItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  /** Renders as a section category header — not clickable */
  category?: true;
  /** Renders as a collapsible dropdown group */
  children?: SidebarChildItem[];
}

// ─── School Admin ───────────────────────────────────────────────────────────
export const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  // OVERVIEW
  { label: 'Overview', category: true },
  { label: 'Dashboard', href: '/dashboard/school-admin', icon: <LayoutDashboard className="w-5 h-5" /> },

  // PEOPLE
  { label: 'People', category: true },
  {
    label: 'Students',
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: 'All Students',  href: '/dashboard/school-admin/students',        icon: <Users className="w-4 h-4" /> },
      { label: 'Student Upload', href: '/dashboard/school-admin/students/upload', icon: <FileText className="w-4 h-4" /> },
      { label: 'Promotion',     href: '/dashboard/school-admin/promotion',        icon: <ArrowUpRight className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Teachers',
    icon: <GraduationCap className="w-5 h-5" />,
    children: [
      { label: 'All Teachers',       href: '/dashboard/school-admin/teachers',                       icon: <GraduationCap className="w-4 h-4" /> },
      { label: 'Teacher Attendance', href: '/dashboard/school-admin/teacher-attendance',             icon: <CalendarDays className="w-4 h-4" /> },
      { label: 'Attendance Records', href: '/dashboard/school-admin/teacher-attendance/records',     icon: <ClipboardList className="w-4 h-4" /> },
    ],
  },
  { label: 'Parents',     href: '/dashboard/school-admin/parents',     icon: <UserCircle className="w-5 h-5" /> },
  { label: 'Secretaries', href: '/dashboard/school-admin/secretaries', icon: <UserCog className="w-5 h-5" /> },

  // ACADEMICS
  { label: 'Academics', category: true },
  { label: 'Classes',   href: '/dashboard/school-admin/classes',   icon: <School className="w-5 h-5" /> },
  { label: 'Subjects',  href: '/dashboard/school-admin/subjects',  icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Timetable', href: '/dashboard/school-admin/timetable', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Grading',   href: '/dashboard/school-admin/grading',   icon: <ShieldCheck className="w-5 h-5" /> },

  // ATTENDANCE
  { label: 'Attendance', category: true },
  { label: 'Student Attendance', href: '/dashboard/school-admin/attendance', icon: <CalendarDays className="w-5 h-5" /> },

  // FINANCE
  { label: 'Finance', category: true },
  {
    label: 'Fees',
    icon: <CreditCard className="w-5 h-5" />,
    children: [
      { label: 'Fees Config',  href: '/dashboard/school-admin/fees',         icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Fees Checker', href: '/dashboard/school-admin/fees-checker', icon: <CheckSquare className="w-4 h-4" /> },
    ],
  },
  { label: 'Finance Overview', href: '/dashboard/school-admin/finance', icon: <Banknote className="w-5 h-5" /> },

  // COMMUNICATION
  { label: 'Communication', category: true },
  { label: 'Messages',    href: '/dashboard/school-admin/messaging',      icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events',      href: '/dashboard/school-admin/events',         icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/school-admin/announcements', icon: <Megaphone className="w-5 h-5" /> },
  { label: 'Staff Alerts', href: '/dashboard/school-admin/notifications', icon: <Bell className="w-5 h-5" /> },

  // SETTINGS
  { label: 'Settings', category: true },
  { label: 'Account', href: '/dashboard/school-admin/settings', icon: <Settings className="w-5 h-5" /> },
];

// ─── Secretary ──────────────────────────────────────────────────────────────
export const SECRETARY_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard',         href: '/dashboard/secretary',                          icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Students',          href: '/dashboard/secretary/students',                 icon: <Users className="w-5 h-5" /> },
  { label: 'Teacher Attendance', href: '/dashboard/secretary/teacher-attendance',      icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Attendance',        href: '/dashboard/secretary/attendance',               icon: <Calendar className="w-5 h-5" /> },
  { label: 'Messages',          href: '/dashboard/secretary/messaging',                icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events',            href: '/dashboard/secretary/events',                   icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board',      href: '/dashboard/secretary/announcements',            icon: <Bell className="w-5 h-5" /> },
  { label: 'Account',           href: '/dashboard/secretary/settings',                 icon: <Settings className="w-5 h-5" /> },
];

// ─── Teacher ────────────────────────────────────────────────────────────────
export const TEACHER_SIDEBAR_ITEMS: SidebarItem[] = [
  // OVERVIEW
  { label: 'Overview', category: true },
  { label: 'Dashboard', href: '/dashboard/teacher', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Class',  href: '/dashboard/teacher/class', icon: <Users className="w-5 h-5" /> },
  { label: 'Timetable', href: '/dashboard/teacher/timetable', icon: <CalendarDays className="w-5 h-5" /> },

  // ATTENDANCE
  { label: 'Attendance', category: true },
  {
    label: 'Attendance',
    icon: <Calendar className="w-5 h-5" />,
    children: [
      { label: 'Mark Attendance',   href: '/dashboard/teacher/attendance/mark',    icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'View Attendance',   href: '/dashboard/teacher/attendance/view',    icon: <Calendar className="w-4 h-4" /> },
      { label: 'Present Students',  href: '/dashboard/teacher/attendance/present', icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Absent Students',   href: '/dashboard/teacher/attendance/absent',  icon: <XSquare className="w-4 h-4" /> },
      { label: 'My Attendance',     href: '/dashboard/teacher/attendance-records', icon: <ClipboardList className="w-4 h-4" /> },
    ],
  },

  // ACADEMICS
  { label: 'Academics', category: true },
  {
    label: 'Scores',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: 'Enter Scores',  href: '/dashboard/teacher/scoring',      icon: <BookMarked className="w-4 h-4" /> },
      { label: 'Score Review',  href: '/dashboard/teacher/score-review', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'View Scores',   href: '/dashboard/teacher/scores',       icon: <FileText className="w-4 h-4" /> },
    ],
  },
  { label: 'Homework', href: '/dashboard/teacher/homework', icon: <BookOpen className="w-5 h-5" /> },

  // COMMUNICATION
  { label: 'Communication', category: true },
  { label: 'Messages',    href: '/dashboard/teacher/messaging',     icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events',      href: '/dashboard/teacher/events',        icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/teacher/announcements', icon: <Megaphone className="w-5 h-5" /> },

  // SETTINGS
  { label: 'Settings', category: true },
  { label: 'Account', href: '/dashboard/teacher/settings', icon: <Settings className="w-5 h-5" /> },
];

// ─── Parent ─────────────────────────────────────────────────────────────────
export const PARENT_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard',   href: '/dashboard/parent',              icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Children',    href: '/dashboard/parent/children',     icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Results',     href: '/dashboard/parent/results',      icon: <FileText className="w-5 h-5" /> },
  { label: 'Attendance',  href: '/dashboard/parent/attendance',   icon: <Calendar className="w-5 h-5" /> },
  { label: 'Homework',    href: '/dashboard/parent/homework',     icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Fees',        href: '/dashboard/parent/fees',         icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Messages',    href: '/dashboard/parent/messaging',    icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Events',      href: '/dashboard/parent/events',       icon: <Calendar className="w-5 h-5" /> },
  { label: 'Notice Board', href: '/dashboard/parent/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'Account',     href: '/dashboard/parent/settings',     icon: <Settings className="w-5 h-5" /> },
];

// ─── Super Admin ─────────────────────────────────────────────────────────────
export const SUPER_ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard',          href: '/dashboard/super-admin',               icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Schools',            href: '/dashboard/super-admin/schools',       icon: <School className="w-5 h-5" /> },
  { label: 'Users',              href: '/dashboard/super-admin/users',         icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Announcements',      href: '/dashboard/super-admin/announcements', icon: <Bell className="w-5 h-5" /> },
  { label: 'System Broadcaster', href: '/dashboard/super-admin/notifications', icon: <Megaphone className="w-5 h-5" /> },
  { label: 'Settings',           href: '/dashboard/super-admin/settings',      icon: <Settings className="w-5 h-5" /> },
];
