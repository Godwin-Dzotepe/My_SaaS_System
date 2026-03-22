'use client';

import * as React from 'react';
import {
  School,
  Bell,
  Send,
  Mail,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const recentMessages = [
  { id: 1, to: 'All Parents', subject: 'School Closed - Public Holiday', date: 'Today, 09:00 AM', status: 'sent' },
  { id: 2, to: 'Class 5 Parents', subject: 'Parent-Teacher Meeting', date: 'Yesterday', status: 'sent' },
  { id: 3, to: 'Teachers', subject: 'Staff Meeting Reminder', date: '2 days ago', status: 'sent' },
];

export default function SecretaryMessagingPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary User" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Announcements & Messaging</h1>
              <p className="text-gray-600">Send updates to parents, teachers, and students</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Compose New Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Recipients *</label>
                    <select className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all_parents">All Parents</option>
                      <option value="all_teachers">All Teachers</option>
                      <option value="class_5">Class 5 Parents</option>
                      <option value="individual">Individual Recipient</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message Subject *</label>
                    <Input placeholder="Enter subject line..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message Body *</label>
                    <textarea 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]" 
                      placeholder="Type your message here..."
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Save as Draft</Button>
                    <Button className="gap-2">
                      <Send className="w-4 h-4" /> Send Announcement
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMessages.map((msg) => (
                      <div key={msg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{msg.subject}</p>
                            <p className="text-sm text-gray-500">To: {msg.to} • {msg.date}</p>
                          </div>
                        </div>
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">App Notification</p>
                      <p className="text-xs text-gray-500">Instant push notification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">SMS (Add-on)</p>
                      <p className="text-xs text-gray-500">Text message to parents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Email</p>
                      <p className="text-xs text-gray-500">Sent to registered email</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm text-amber-800 font-medium">Broadcast Tip</p>
                <p className="text-xs text-amber-600 mt-1">
                  Using &quot;All Parents&quot; will reach 854 guardians. Make sure the message is school-wide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
