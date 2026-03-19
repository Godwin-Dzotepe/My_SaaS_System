'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

// Define types for our data
interface Student {
  id: string;
  name: string;
  // Add other relevant student fields if necessary
}

interface FeeDetails {
    amountDue: number;
    dueDate: string;
    // other fee details
}

export default function ParentFeesPage() {
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [userName, setUserName] = useState('Parent');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
      
      // Get phone from user session for API calls
      const phone = user.phone;
      if (phone) {
        const fetchStudents = async () => {
          setLoading(true);
          try {
              const token = localStorage.getItem('token');
              const res = await fetch(`/api/parent/children?phone=${phone}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              if (!res.ok) {
                throw new Error('Failed to fetch students');
              }
              const data = await res.json();
              setStudents(data);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
              setLoading(false);
            }
          };
          fetchStudents();
      }
    }
  }, []);

  const handlePayFeeClick = (student: Student) => {
    setSelectedStudent(student);
    // In a real app, you'd fetch fee details for the student
    // For now, we'll use mock data
    setFeeDetails({ amountDue: 1500, dueDate: '2024-08-01' });
    setIsModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedStudent || !feeDetails) return;

    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: selectedStudent.id,
                amount: feeDetails.amountDue,
                // other payment details
            }),
        });

        if (!response.ok) {
            throw new Error('Payment failed');
        }

        alert('Payment successful!');
        setIsModalOpen(false);
    } catch (error) {
        alert(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };


  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#212529]">Account & Fees</h1>
        <p className="text-[#646464] text-sm">Pay school fees for your children.</p>
      </header>

      {loading  ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : error ? (
        <Card className="p-10 text-center text-red-500">{error}</Card>
      ) : students.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          No children associated with this account.
        </Card>
      ) : (
        <Card className="shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#212529]">Your Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <p className="font-medium">{student.name}</p>
                  <Button onClick={() => handlePayFeeClick(student)}>Pay Fee</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStudent && feeDetails && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title={`Pay Fee for ${selectedStudent.name}`}
            footer={
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handlePayment}>Confirm Payment</Button>
                </div>
            }
        >
            <p>Amount Due: ${feeDetails.amountDue.toFixed(2)}</p>
            <p>Due Date: {new Date(feeDetails.dueDate).toLocaleDateString()}</p>
            <div className="mt-4">
                {/* Payment form would go here */}
                <p>Payment options (coming soon)</p>
            </div>
        </Modal>
      )}
      </div>
    </div>
  );
}
