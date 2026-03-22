"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SUPER_ADMIN_SIDEBAR_ITEMS } from "@/lib/sidebar-configs";

export default function SuperAdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      alert("Please fill out both title and message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/super-admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      if (res.ok) {
        alert("System alert broadcasted successfully.");
        setTitle("");
        setMessage("");
      } else {
        alert("Failed to broadcast system alert.");
      }
    } catch (e) {
      console.error(e);
      alert("Error broadcasting alert.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super_admin" userName="Super Admin" />
      <div className="flex-1 p-8 lg:ml-64 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">System Alerts (All Schools)</h1>
        <Card className="max-w-2xl bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Broadcast System Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>
              <Input
                placeholder="Platform Maintenance Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Message</label>
              <textarea
                className="w-full border-gray-300 rounded-md shadow-sm p-3 min-h-[150px] border focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                placeholder="This message will be sent to all schools..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Broadcasting..." : "Send System Alert"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
