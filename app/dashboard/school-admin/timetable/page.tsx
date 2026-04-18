'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Loader2, Plus, Trash2, X, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: { id: string; subject_name: string };
  teacher: { id: string; name: string } | null;
}

interface ClassOption { id: string; class_name: string; }
interface SubjectOption { id: string; subject_name: string; }
interface TeacherOption { id: string; name: string; }

interface ModalState {
  open: boolean;
  day: number;
  period: number;
  existing: TimetableEntry | null;
}

const DEFAULT_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '07:30', end: '08:15' },
  2: { start: '08:15', end: '09:00' },
  3: { start: '09:00', end: '09:45' },
  4: { start: '10:00', end: '10:45' },
  5: { start: '10:45', end: '11:30' },
  6: { start: '11:30', end: '12:15' },
  7: { start: '13:00', end: '13:45' },
  8: { start: '13:45', end: '14:30' },
};

export default function TimetablePage() {
  const { success, error: toastError } = useToast();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false, day: 1, period: 1, existing: null });
  const [mobileDay, setMobileDay] = useState(1);

  // form state
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formStart, setFormStart]   = useState('');
  const [formEnd, setFormEnd]       = useState('');
  const [formRoom, setFormRoom]     = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()).catch(() => []),
      fetch('/api/subjects').then(r => r.json()).catch(() => []),
      fetch('/api/teachers').then(r => r.json()).catch(() => []),
    ]).then(([c, s, t]) => {
      setClasses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
      setTeachers(Array.isArray(t) ? t : ((t as { teachers?: TeacherOption[] }).teachers ?? []));
    });
  }, []);

  const fetchTimetable = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?class_id=${classId}`);
      const data = await res.json().catch(() => []);
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimetable(selectedClass); }, [selectedClass, fetchTimetable]);

  const entryAt = (day: number, period: number) =>
    entries.find(e => e.day_of_week === day && e.period_number === period);

  const openModal = (day: number, period: number) => {
    const existing = entryAt(day, period) ?? null;
    setModal({ open: true, day, period, existing });
    setFormSubject(existing?.subject.id ?? '');
    setFormTeacher(existing?.teacher?.id ?? '');
    setFormStart(existing?.start_time ?? DEFAULT_TIMES[period]?.start ?? '08:00');
    setFormEnd(existing?.end_time   ?? DEFAULT_TIMES[period]?.end   ?? '08:45');
    setFormRoom(existing?.room ?? '');
  };

  const handleSave = async () => {
    if (!formSubject) return;
    setSaving(true);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          subject_id: formSubject,
          teacher_id: formTeacher || null,
          day_of_week: modal.day,
          period_number: modal.period,
          start_time: formStart,
          end_time: formEnd,
          room: formRoom || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      success('Period saved');
      setModal(m => ({ ...m, open: false }));
      fetchTimetable(selectedClass);
    } catch {
      toastError('Failed to save period');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      success('Period removed');
      setModal(m => ({ ...m, open: false }));
      fetchTimetable(selectedClass);
    } catch {
      toastError('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Class Timetable
          </h1>
          <p className="text-sm text-gray-500 mt-1">Set the weekly schedule for each class</p>
        </div>

        {/* Class selector */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white sm:w-auto"
          >
            <option value="">Select a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        {!selectedClass ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            <BookOpen className="mx-auto w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">Select a class to view or edit its timetable</p>
          </div>
        ) : (
          <>
            {/* Mobile: day-by-day card view */}
            <div className="md:hidden space-y-4">
              <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => setMobileDay(i + 1)}
                    className={`shrink-0 flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition ${mobileDay === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {PERIODS.map(period => {
                  const entry = entryAt(mobileDay, period);
                  return (
                    <button key={period} onClick={() => openModal(mobileDay, period)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${entry ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 border-dashed hover:border-blue-300'}`}>
                      <div className="shrink-0 w-10 text-xs font-bold text-gray-400">
                        <div>P{period}</div>
                        <div className="font-normal text-gray-300">{DEFAULT_TIMES[period]?.start}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry ? (
                          <>
                            <p className="font-semibold text-blue-700 text-sm truncate">{entry.subject.subject_name}</p>
                            {entry.teacher && <p className="text-xs text-gray-500 truncate">{entry.teacher.name}</p>}
                            {entry.room && <p className="text-xs text-gray-400">{entry.room}</p>}
                          </>
                        ) : (
                          <span className="text-gray-300 flex items-center gap-1 text-sm"><Plus className="w-3 h-3" /> Add period</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Period</th>
                    {DAYS.map(d => (
                      <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2 text-xs font-bold text-gray-400">
                        P{period}
                        <div className="font-normal text-gray-300">{DEFAULT_TIMES[period]?.start}</div>
                      </td>
                      {[1,2,3,4,5].map(day => {
                        const entry = entryAt(day, period);
                        return (
                          <td key={day} className="px-2 py-2">
                            <button
                              onClick={() => openModal(day, period)}
                              className={`w-full min-h-[52px] rounded-xl border px-2 py-1.5 text-left text-xs transition group ${
                                entry
                                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  : 'bg-gray-50 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                            >
                              {entry ? (
                                <>
                                  <p className="font-semibold text-blue-700 truncate">{entry.subject.subject_name}</p>
                                  {entry.teacher && <p className="text-gray-500 truncate">{entry.teacher.name}</p>}
                                  {entry.room && <p className="text-gray-400">{entry.room}</p>}
                                </>
                              ) : (
                                <span className="text-gray-300 group-hover:text-blue-400 flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Add
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">
                {DAYS[modal.day - 1]} — Period {modal.period}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({DEFAULT_TIMES[modal.period]?.start} – {DEFAULT_TIMES[modal.period]?.end})
                </span>
              </h2>
              <button onClick={() => setModal(m => ({ ...m, open: false }))} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                <select value={formSubject} onChange={e => setFormSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Teacher</label>
                <select value={formTeacher} onChange={e => setFormTeacher(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No teacher assigned</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
                  <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
                  <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Room (optional)</label>
                <input type="text" value={formRoom} onChange={e => setFormRoom(e.target.value)}
                  placeholder="e.g. Room 12, Lab A"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleSave} disabled={!formSubject || saving}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Period
              </button>
              {modal.existing && (
                <button onClick={() => handleDelete(modal.existing!.id)} disabled={saving}
                  className="rounded-xl border border-red-200 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setModal(m => ({ ...m, open: false }))}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
