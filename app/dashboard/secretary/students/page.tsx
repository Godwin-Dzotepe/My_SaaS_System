'use client';
import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  Upload,
  Edit,
  Trash2,
  Filter,
  XCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';



export default function SecretaryStudentList() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClass, setSelectedClass] = React.useState('all');
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [studentToDelete, setStudentToDelete] = React.useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/students/list');
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (Array.isArray(data)) setClasses(data);
    } catch (err) {}
  };

  React.useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter(s => s.id !== id));
      }
    } catch (err) {}
    finally {
      setStudentToDelete(null);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent({ ...student });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setSuccess('Student updated successfully!');
      setTimeout(() => setShowEditModal(false), 1500);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.parent_phone.includes(search) || 
                          (s.student_number && s.student_number.toLowerCase().includes(search.toLowerCase()));
    const matchesClass = selectedClass === 'all' || s.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-500">View and manage all students in the school.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/secretary/students/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4" /> Add Student
              </Button>
            </Link>
            <Link href="/dashboard/secretary/students/upload">
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" /> Bulk Upload
              </Button>
            </Link>
          </div>
        </header>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by name, phone or number..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Found {filteredStudents.length} students
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Class</th>
                    <th className="px-6 py-4 text-left">Parent Phone</th>
                    <th className="px-6 py-4 text-left">Student #</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No students found.</td></tr>
                  ) : filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.class?.class_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{student.parent_phone}</td>
                      <td className="px-6 py-4 text-gray-600">{student.student_number || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(student)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setStudentToDelete(student.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Edit Student</h2>
              <button onClick={() => setShowEditModal(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2"><XCircle className="w-4 h-4" /> {error}</div>}
              {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <Input required value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Class</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  value={editingStudent.class_id}
                  onChange={e => setEditingStudent({...editingStudent, class_id: e.target.value})}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Parent Phone</label>
                <Input required value={editingStudent.parent_phone} onChange={e => setEditingStudent({...editingStudent, parent_phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Student Number (Optional)</label>
                <Input value={editingStudent.student_number || ''} onChange={e => setEditingStudent({...editingStudent, student_number: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  value={editingStudent.status}
                  onChange={e => setEditingStudent({...editingStudent, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Update Student</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => studentToDelete && handleDelete(studentToDelete)}
        title="Delete Student"
        message="Are you sure you want to delete this student record? This action cannot be undone."
        confirmText="Delete Student"
      />
    </div>
  );
}
