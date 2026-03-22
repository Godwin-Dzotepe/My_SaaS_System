'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Users, UserCircle, Phone, FileText } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

interface Parent {
  parent_name: string;
  parent_phone: string;
  parent_relation: string;
  children: { id: string, name: string, class_name: string }[];
}

export default function ParentsPage() {
  const [userName, setUserName] = useState('Admin User');
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await fetch('/api/parents');
      if (response.ok) {
        const data = await response.json();
        setParents(data);
      }
    } catch (err) {
      console.error('Error fetching parents', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      
      <motion.div
        className="flex-1 lg:ml-64 p-4 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div variants={itemVariants} className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Parents</h1>
              <p className="text-gray-600">View and manage parent details for all students</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/school-admin/students/new">
                <Button className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0]">
                  <Plus className="w-4 h-4" />
                  Add Student & Parent
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3f7afc]" />
                  </div>
                ) : parents.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">
                    <UserCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No parents found. Parents are automatically added when you create students or bulk upload them.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f8f9fb] border-b border-gray-100">
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Parent Details</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Contact</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Relationship</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Associated Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parents.map((parent, idx) => (
                          <tr key={idx} className="hover:bg-[#f8f9fb] transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#e1f1ff] flex items-center justify-center text-[#3f7afc]">
                                  <UserCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="font-bold text-[#212529] block">{parent.parent_name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center text-[#646464] gap-2">
                                <Phone className="w-4 h-4" />
                                {parent.parent_phone}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={
                                parent.parent_relation.toLowerCase() === 'mother' ? 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-none' :
                                parent.parent_relation.toLowerCase() === 'father' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-none' :
                                'bg-purple-100 text-purple-700 hover:bg-purple-100 border-none'
                              }>
                                {parent.parent_relation}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                {parent.children.map(child => (
                                  <div key={child.id} className="text-sm">
                                    <span className="font-medium text-gray-800">{child.name}</span>
                                    <span className="text-gray-500 ml-2">({child.class_name})</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
