'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStudentProfile() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/students/${id}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
        } else {
          router.push('/dashboard/teacher/class');
        }
      } catch (error) {
        console.error('Error fetching student profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStudentProfile();
  }, [params, router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Student Profile</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : student ? (
          <Card>
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p><strong>Status:</strong> <Badge variant={student.status === 'active' ? 'success' : 'default'}>{student.status}</Badge></p>
                <p><strong>Parent/Guardian Name:</strong> {student.parent_name || 'N/A'}</p>
                <p><strong>Parent Contact:</strong> {student.parent_phone}</p>
                <p><strong>Class:</strong> {student.class?.class_name || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p>Student not found</p>
        )}
      </div>
    </div>
  );
}