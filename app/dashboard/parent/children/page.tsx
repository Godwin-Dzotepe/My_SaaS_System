'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Loader2, School, FileText, Calendar } from 'lucide-react';




export default function ParentChildrenPage() {
  const [children, setChildren] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchChildren = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setUserName(user.name);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/parent/children?phone=${user.phone}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (Array.isArray(data)) setChildren(data);
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[#212529]">My Children</h1>
          <p className="text-[#646464] text-sm">View and manage your children&apos;s school information.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : children.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
             No children found linked to your phone number.
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child, idx) => (
              <motion.div 
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-2 w-full bg-[#3f7afc]"></div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#f0f1f3] flex items-center justify-center text-[#3f7afc] font-bold text-xl border border-gray-100 group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#212529] text-xl">{child.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#646464] mt-1">
                            <School className="w-4 h-4 text-[#ffa001]" />
                            {child.school?.school_name}
                          </div>
                          <Badge variant="secondary" className="bg-[#f0f1f3] text-[#212529] mt-2">
                            {child.class?.class_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Link href={`/dashboard/parent/children/${child.id}/results`} className="flex-1">
                        <Button className="w-full gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] text-white border-none shadow-sm">
                          <FileText className="w-4 h-4" />
                          Academic Results
                        </Button>
                      </Link>
                      <Link href={`/dashboard/parent/children/${child.id}/attendance`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 border-[#3f7afc] text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white">
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
        )}
      </div>
    </div>
  );
}
