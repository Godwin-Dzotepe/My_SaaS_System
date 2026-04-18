"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SECRETARY_SIDEBAR_ITEMS } from "@/lib/sidebar-configs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

type Teacher = {
  id: string;
  name: string;
};

export default function SecretaryTeacherAttendancePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(Array.isArray(data) ? data : data.teachers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (teacherId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [teacherId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback('');
    setError('');
    try {
      for (const [teacherId, status] of Object.entries(attendance)) {
        await fetch("/api/attendance/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, status, date }),
        });
      }
      setFeedback("Attendance saved successfully.");
      return;
    } catch (e) {
      console.error(e);
      setError("Error saving attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />
      <motion.div
        className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teacher Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">Record today&apos;s teacher attendance</p>
          </div>
          <Button onClick={handleSave} disabled={saving || Object.keys(attendance).length === 0} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 shadow-sm font-medium">
            {saving ? "Saving..." : "Save Daily Attendance"}
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="text-gray-400 w-5 h-5" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {feedback ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">Loading teachers...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Teacher Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6 text-gray-800 font-medium">{teacher.name}</td>
                    <td className="py-4 px-6">
                      <select
                        className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none w-48 text-gray-700"
                        value={attendance[teacher.id] || ""}
                        onChange={(e) => handleStatusChange(teacher.id, e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 px-6 text-center text-gray-500">No teachers found in the system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
