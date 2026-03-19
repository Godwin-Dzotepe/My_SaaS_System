'use client';

import * as React from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';



export default function SecretaryBulkUpload() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [importCount, setImportCount] = React.useState(0);

  React.useEffect(() => {
    // Fetch classes for the school
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        if (Array.isArray(data)) setClasses(data);
      } catch (err) {}
    };
    fetchClasses();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedClassId) {
      setError('Please select both a class and an Excel file.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('class_id', selectedClassId);
    formData.append('school_id', user.school_id);

    try {
      const res = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess(data.message);
      setImportCount(data.count);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Student Upload</h1>
              <p className="text-gray-500">Upload students directly from an Excel sheet.</p>
            </div>
            <Link href="/dashboard/secretary/students">
              <Button variant="ghost" className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back to Students
              </Button>
            </Link>
          </div>

          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Import Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">1. Select Class</label>
                  <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">2. Upload Excel File</label>
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <FileSpreadsheet className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {file && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{file.name}</p>
                      <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-blue-600 hover:bg-blue-100">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3 text-red-700 animate-in shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex gap-3 text-green-700 animate-in zoom-in-95">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{success}</p>
                    <p className="text-xs mt-1">Visit the Student List to see the newly added records.</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between">
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Excel must have columns: <span className="font-bold">Name</span> and <span className="font-bold">Parent Phone</span>.</p>
                  <p>• Optional column: <span className="font-bold">Student Number</span>.</p>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !file || !selectedClassId}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Students
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
               <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
               <div className="text-xs">
                 <p className="font-bold text-amber-900 mb-1">Upload Tip</p>
                 <p className="text-amber-700 leading-relaxed">
                   Ensure parent phone numbers are correct. Parents will use these numbers to log in for the first time.
                 </p>
               </div>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex gap-3">
                <FileSpreadsheet className="w-5 h-5 text-gray-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 mb-1">Download Template</p>
                  <p className="text-gray-600 mb-2">Use our official template for the best results.</p>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs">Download Student Template.xlsx</Button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
