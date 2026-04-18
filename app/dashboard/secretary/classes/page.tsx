'use client';

import * as React from 'react';
import {
  GraduationCap,
  School,
  Plus,
  MoreHorizontal,
  BookOpen,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';



const classes = [
  { id: 1, name: 'Class 1', teacher: 'Mrs. Sarah Thompson', students: 35, capacity: 40 },
  { id: 2, name: 'Class 2', teacher: 'Mr. David Wilson', students: 32, capacity: 40 },
  { id: 3, name: 'Class 3', teacher: 'Ms. Emily Chen', students: 38, capacity: 40 },
  { id: 4, name: 'Class 4', teacher: 'Mr. Michael Brown', students: 30, capacity: 35 },
  { id: 5, name: 'Class 5', teacher: 'Mrs. Jane Doe', students: 42, capacity: 45 },
];

export default function SecretaryClassesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary User" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
              <p className="text-gray-600">Overview of all classes and assigned teachers</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Class
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <School className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{item.teacher}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Students: {item.students}/{item.capacity}</span>
                        <span>{Math.round((item.students / item.capacity) * 100)}% Full</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.students >= item.capacity ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${(item.students / item.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Users className="w-3 h-3" /> Students
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <BookOpen className="w-3 h-3" /> Subjects
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
