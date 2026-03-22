"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ADMIN_SIDEBAR_ITEMS } from "@/lib/sidebar-configs";

export default function SchoolAdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      alert("Please fill out both title and message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/school-admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience }),
      });
      if (res.ok) {
        alert(`Notification sent successfully.`);
        setTitle("");
        setMessage("");
      } else {
        alert("Failed to send notification.");
      }
    } catch (e) {
      console.error(e);
      alert("Error sending notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school_admin" userName="School Admin" />
      <div className="flex-1 p-8 lg:ml-64 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Staff & Parent Notifications</h1>
        <Card className="max-w-2xl bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Broadcast Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="ALL">Everyone (Teachers & Parents)</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="PARENTS">Parents Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                placeholder="Important: Timetable Change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full border-gray-300 rounded-md shadow-sm p-3 min-h-[150px] border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Type your notification message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Broadcasting..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
