'use client';

import React, { useState } from 'react';
import {
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Users,
  Send,
  Smartphone,
  Mail,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



const recipientOptions = [
  { id: 'all', label: 'All Parents', count: 245, icon: <Users className="w-4 h-4" /> },
  { id: 'class1', label: 'Class 1 Parents', count: 28, icon: <Users className="w-4 h-4" /> },
  { id: 'class2', label: 'Class 2 Parents', count: 32, icon: <Users className="w-4 h-4" /> },
  { id: 'class3', label: 'Class 3 Parents', count: 30, icon: <Users className="w-4 h-4" /> },
  { id: 'jhs1', label: 'JHS 1 Parents', count: 35, icon: <Users className="w-4 h-4" /> },
  { id: 'jhs2', label: 'JHS 2 Parents', count: 33, icon: <Users className="w-4 h-4" /> },
  { id: 'jhs3', label: 'JHS 3 Parents', count: 31, icon: <Users className="w-4 h-4" /> },
  { id: 'unpaid', label: 'Parents with Pending Fees', count: 45, icon: <Users className="w-4 h-4" /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function MessagingPage() {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);
  const [message, setMessage] = useState('');
  const [sendMethod, setSendMethod] = useState<'sms' | 'email' | 'both'>('sms');
  const [sent, setSent] = useState(false);

  const toggleRecipient = (id: string) => {
    if (id === 'all') {
      setSelectedRecipients(['all']);
    } else {
      setSelectedRecipients(prev => {
        const filtered = prev.filter(r => r !== 'all');
        if (prev.includes(id)) {
          return filtered.filter(r => r !== id);
        }
        return [...filtered, id];
      });
    }
  };

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setMessage('');
  };

  const totalRecipients = selectedRecipients.includes('all') 
    ? 245 
    : selectedRecipients.reduce((acc, id) => {
        const option = recipientOptions.find(o => o.id === id);
        return acc + (option?.count || 0);
      }, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-bold text-gray-900">Send Announcement</h1>
            <p className="text-gray-600">Send SMS or email notifications to parents</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipients Selection */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recipientOptions.map((option) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleRecipient(option.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedRecipients.includes(option.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedRecipients.includes(option.id) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {option.icon}
                          </div>
                          <span className={`font-medium ${
                            selectedRecipients.includes(option.id) ? 'text-blue-900' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                        <Badge variant={selectedRecipients.includes(option.id) ? 'default' : 'secondary'}>
                          {option.count}
                        </Badge>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Message Composition */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Send Method */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Send Method</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'sms', label: 'SMS', icon: <Smartphone className="w-4 h-4" /> },
                        { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
                        { id: 'both', label: 'Both', icon: <MessageSquare className="w-4 h-4" /> }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSendMethod(method.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            sendMethod === method.id 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {method.icon}
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your announcement here..."
                      className="w-full h-40 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                      maxLength={sendMethod === 'sms' ? 160 : 1000}
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>{message.length} characters</span>
                      {sendMethod === 'sms' && <span>Max 160 for SMS</span>}
                    </div>
                  </div>

                  {/* Preview */}
                  <AnimatePresence>
                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
                            <p className="text-xs text-gray-400 mt-2">- Lincoln High School</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Send Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Sending to <span className="font-semibold text-gray-900">{totalRecipients}</span> recipients
                    </div>
                    <Button 
                      size="lg" 
                      className="gap-2 px-8"
                      onClick={handleSend}
                      disabled={!message || selectedRecipients.length === 0}
                    >
                      <Send className="w-4 h-4" />
                      Send Announcement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {sent && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Message Sent!</p>
                  <p className="text-sm text-green-100">Your announcement has been delivered to {totalRecipients} parents.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
