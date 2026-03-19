'use client';

import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  Mail,
  User,
  Shield,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function NewFinanceAdminPage() {
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Link href="/dashboard/school-admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Finance Admin</h1>
              <p className="text-gray-600">Create a new administrator for financial management</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Admin Details</CardTitle>
                  <CardDescription>Personal and contact information for the finance admin</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Full Name
                    </label>
                    <Input placeholder="e.g. Robert Mensah" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" /> Email Address
                    </label>
                    <Input type="email" placeholder="robert.m@school.com" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                    </label>
                    <Input placeholder="+233 24 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" /> Access Level
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option>Full Financial Access</option>
                      <option>View Only (Auditor)</option>
                      <option>Fee Collection Only</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold">Security Notice</p>
                    <p className="mt-1">
                      Finance admins will have access to sensitive school financial records and fee collection tools. 
                      Please ensure you are authorized to create this account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end gap-4">
              <Link href="/dashboard/school-admin">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="gap-2 px-8 bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Create Admin Account
              </Button>
            </motion.div>
          </form>

          {/* Success Notification */}
          <AnimatePresence>
            {saved && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Admin Account Created!</p>
                  <p className="text-sm text-green-100">Credentials have been securely emailed to the admin.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
