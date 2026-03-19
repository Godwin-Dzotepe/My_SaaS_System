'use client';

import * as React from 'react';
import {
  Search,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const teachers = [
  { id: 1, name: 'Mrs. Sarah Thompson', subject: 'Mathematics', class: 'Class 5', email: 'sarah.t@school.edu', status: 'active' },
  { id: 2, name: 'Mr. David Wilson', subject: 'Science', class: 'Class 2', email: 'david.w@school.edu', status: 'active' },
  { id: 3, name: 'Ms. Emily Chen', subject: 'English', class: 'Class 3', email: 'emily.c@school.edu', status: 'active' },
  { id: 4, name: 'Mr. Michael Brown', subject: 'Social Studies', class: 'Class 4', email: 'michael.b@school.edu', status: 'on leave' },
];

export default function SecretaryTeachersPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary User" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Directory</h1>
              <p className="text-gray-600">Manage staff records and assignments</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-10" placeholder="Search teachers..." />
                </div>
                <Button variant="outline">Export Staff List</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{teacher.name}</p>
                          <p className="text-sm text-blue-600 font-medium">{teacher.subject} Teacher</p>
                          <p className="text-xs text-gray-500 mt-1">Primary Class: {teacher.class}</p>
                        </div>
                      </div>
                      <Badge variant={teacher.status === 'active' ? 'success' : 'secondary'}>
                        {teacher.status}
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3" />
                        {teacher.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3" />
                        +233 24 000 0000
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">Profile</Button>
                      <Button variant="outline" size="sm" className="flex-1">Schedule</Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
