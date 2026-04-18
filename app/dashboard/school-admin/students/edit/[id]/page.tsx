'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save, User, Users, Phone, Heart, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { useToast } from '@/components/ui/toast';

interface Class { id: string; class_name: string; }

const TABS = [
  { id: 'personal',   label: 'Personal',   icon: User },
  { id: 'father',     label: 'Father',     icon: Users },
  { id: 'mother',     label: 'Mother',     icon: Users },
  { id: 'guardian',   label: 'Guardian',   icon: Users },
  { id: 'emergency',  label: 'Emergency',  icon: Phone },
  { id: 'medical',    label: 'Medical',    icon: Heart },
  { id: 'academic',   label: 'Academic',   icon: BookOpen },
];

const EMPTY_FORM = {
  // Personal
  name: '',
  student_number: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  admission_date: '',
  previous_school: '',
  residential_address: '',
  digital_address: '',
  // Father
  father_name: '',
  father_phone: '',
  father_profession: '',
  father_status: '',
  father_residential_address: '',
  father_digital_address: '',
  // Mother
  mother_name: '',
  mother_phone: '',
  mother_profession: '',
  mother_status: '',
  mother_residential_address: '',
  mother_digital_address: '',
  // Guardian
  guardian_name: '',
  guardian_phone: '',
  guardian_profession: '',
  guardian_residential_address: '',
  guardian_digital_address: '',
  // Emergency
  emergency_contact_name: '',
  emergency_contact_phone: '',
  // Medical
  medical_notes: '',
  // Academic
  parent_phone: '',
  parent_name: '',
  parent_relation: '',
  class_id: '',
  status: 'active',
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white';
const selectCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const { success: toastSuccess, error: toastError } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState(EMPTY_FORM);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${studentId}`).then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
    ]).then(([s, c]) => {
      if (s?.id) {
        setStudentName(s.name);
        setForm({
          name:                       s.name                       ?? '',
          student_number:             s.student_number             ?? '',
          date_of_birth:              s.date_of_birth ? s.date_of_birth.slice(0, 10) : '',
          gender:                     s.gender                     ?? '',
          nationality:                s.nationality                ?? '',
          admission_date:             s.admission_date ? s.admission_date.slice(0, 10) : '',
          previous_school:            s.previous_school            ?? '',
          residential_address:        s.residential_address        ?? '',
          digital_address:            s.digital_address            ?? '',
          father_name:                s.father_name                ?? '',
          father_phone:               s.father_phone               ?? '',
          father_profession:          s.father_profession          ?? '',
          father_status:              s.father_status              ?? '',
          father_residential_address: s.father_residential_address ?? '',
          father_digital_address:     s.father_digital_address     ?? '',
          mother_name:                s.mother_name                ?? '',
          mother_phone:               s.mother_phone               ?? '',
          mother_profession:          s.mother_profession          ?? '',
          mother_status:              s.mother_status              ?? '',
          mother_residential_address: s.mother_residential_address ?? '',
          mother_digital_address:     s.mother_digital_address     ?? '',
          guardian_name:              s.guardian_name              ?? '',
          guardian_phone:             s.guardian_phone             ?? '',
          guardian_profession:        s.guardian_profession        ?? '',
          guardian_residential_address: s.guardian_residential_address ?? '',
          guardian_digital_address:   s.guardian_digital_address   ?? '',
          emergency_contact_name:     s.emergency_contact_name     ?? '',
          emergency_contact_phone:    s.emergency_contact_phone    ?? '',
          medical_notes:              s.medical_notes              ?? '',
          parent_phone:               s.parent_phone               ?? '',
          parent_name:                s.parent_name                ?? '',
          parent_relation:            s.parent_relation            ?? '',
          class_id:                   s.class_id                   ?? '',
          status:                     s.status                     ?? 'active',
        });
      }
      if (Array.isArray(c)) setClasses(c);
    }).catch(() => toastError('Failed to load student data'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toastSuccess('Student updated successfully');
      setTimeout(() => router.push('/dashboard/school-admin/students'), 1200);
    } catch {
      toastError('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/school-admin/students" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
          <p className="text-sm text-gray-500 mt-0.5">{studentName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab panels */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* PERSONAL */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name" required>
                  <input className={inputCls} value={form.name} onChange={set('name')} required />
                </Field>
                <Field label="Student Number">
                  <input className={inputCls} value={form.student_number} onChange={set('student_number')} placeholder="e.g. SCH-001" />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" className={inputCls} value={form.date_of_birth} onChange={set('date_of_birth')} />
                </Field>
                <Field label="Gender">
                  <select className={selectCls} value={form.gender} onChange={set('gender')}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </Field>
                <Field label="Nationality">
                  <input className={inputCls} value={form.nationality} onChange={set('nationality')} placeholder="e.g. Ghanaian" />
                </Field>
                <Field label="Admission Date">
                  <input type="date" className={inputCls} value={form.admission_date} onChange={set('admission_date')} />
                </Field>
                <Field label="Previous School">
                  <input className={inputCls} value={form.previous_school} onChange={set('previous_school')} />
                </Field>
                <Field label="Residential Address">
                  <input className={inputCls} value={form.residential_address} onChange={set('residential_address')} />
                </Field>
                <Field label="Digital Address">
                  <input className={inputCls} value={form.digital_address} onChange={set('digital_address')} placeholder="e.g. GA-123-4567" />
                </Field>
              </div>
            )}

            {/* FATHER */}
            {activeTab === 'father' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Father's Name">
                  <input className={inputCls} value={form.father_name} onChange={set('father_name')} />
                </Field>
                <Field label="Father's Phone">
                  <input type="tel" className={inputCls} value={form.father_phone} onChange={set('father_phone')} />
                </Field>
                <Field label="Profession">
                  <input className={inputCls} value={form.father_profession} onChange={set('father_profession')} />
                </Field>
                <Field label="Status">
                  <select className={selectCls} value={form.father_status} onChange={set('father_status')}>
                    <option value="">Select</option>
                    <option value="Alive">Alive</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </Field>
                <Field label="Residential Address">
                  <input className={inputCls} value={form.father_residential_address} onChange={set('father_residential_address')} />
                </Field>
                <Field label="Digital Address">
                  <input className={inputCls} value={form.father_digital_address} onChange={set('father_digital_address')} />
                </Field>
              </div>
            )}

            {/* MOTHER */}
            {activeTab === 'mother' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Mother's Name">
                  <input className={inputCls} value={form.mother_name} onChange={set('mother_name')} />
                </Field>
                <Field label="Mother's Phone">
                  <input type="tel" className={inputCls} value={form.mother_phone} onChange={set('mother_phone')} />
                </Field>
                <Field label="Profession">
                  <input className={inputCls} value={form.mother_profession} onChange={set('mother_profession')} />
                </Field>
                <Field label="Status">
                  <select className={selectCls} value={form.mother_status} onChange={set('mother_status')}>
                    <option value="">Select</option>
                    <option value="Alive">Alive</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </Field>
                <Field label="Residential Address">
                  <input className={inputCls} value={form.mother_residential_address} onChange={set('mother_residential_address')} />
                </Field>
                <Field label="Digital Address">
                  <input className={inputCls} value={form.mother_digital_address} onChange={set('mother_digital_address')} />
                </Field>
              </div>
            )}

            {/* GUARDIAN */}
            {activeTab === 'guardian' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Guardian's Name">
                  <input className={inputCls} value={form.guardian_name} onChange={set('guardian_name')} />
                </Field>
                <Field label="Guardian's Phone">
                  <input type="tel" className={inputCls} value={form.guardian_phone} onChange={set('guardian_phone')} />
                </Field>
                <Field label="Profession">
                  <input className={inputCls} value={form.guardian_profession} onChange={set('guardian_profession')} />
                </Field>
                <Field label="Residential Address">
                  <input className={inputCls} value={form.guardian_residential_address} onChange={set('guardian_residential_address')} />
                </Field>
                <Field label="Digital Address">
                  <input className={inputCls} value={form.guardian_digital_address} onChange={set('guardian_digital_address')} />
                </Field>
              </div>
            )}

            {/* EMERGENCY */}
            {activeTab === 'emergency' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Emergency Contact Name">
                  <input className={inputCls} value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
                </Field>
                <Field label="Emergency Contact Phone">
                  <input type="tel" className={inputCls} value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
                </Field>
              </div>
            )}

            {/* MEDICAL */}
            {activeTab === 'medical' && (
              <div>
                <Field label="Medical Notes">
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[140px] resize-y"
                    value={form.medical_notes}
                    onChange={set('medical_notes')}
                    placeholder="Allergies, chronic conditions, medications, etc."
                  />
                </Field>
              </div>
            )}

            {/* ACADEMIC */}
            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Class" required>
                  <select className={selectCls} value={form.class_id} onChange={set('class_id')} required>
                    <option value="">Select class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={selectCls} value={form.status} onChange={set('status')}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </Field>
                <Field label="Parent/Guardian Name">
                  <input className={inputCls} value={form.parent_name} onChange={set('parent_name')} />
                </Field>
                <Field label="Parent Phone (login number)">
                  <input type="tel" className={inputCls} value={form.parent_phone} onChange={set('parent_phone')} placeholder="Used for parent portal login" />
                </Field>
                <Field label="Relation to Student">
                  <input className={inputCls} value={form.parent_relation} onChange={set('parent_relation')} placeholder="e.g. Father, Mother, Guardian" />
                </Field>
              </div>
            )}
          </div>

          {/* Save bar */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
