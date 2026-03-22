'use client';

import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Settings2,
  School,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';



const mockHeaders = ['Full Name', 'Class', 'Guardian Name', 'Phone Number', 'Address', 'Gender'];
const systemFields = ['student_name', 'class_id', 'parent_name', 'contact_number', 'residential_address', 'gender'];

const mockPreviewData = [
  { 'Full Name': 'Samuel Addo', 'Class': 'Class 5', 'Guardian Name': 'Kofi Addo', 'Phone Number': '0241234567', 'Address': 'Accra, Ghana', 'Gender': 'Male' },
  { 'Full Name': 'Grace Mensah', 'Class': 'Class 5', 'Guardian Name': 'Ama Mensah', 'Phone Number': '0559876543', 'Address': 'Kumasi, Ghana', 'Gender': 'Female' },
  { 'Full Name': 'Isaac Osei', 'Class': 'Class 4', 'Guardian Name': 'John Osei', 'Phone Number': '0201112223', 'Address': 'Accra, Ghana', 'Gender': 'Male' },
];

export default function BulkUploadPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileData, setFileData] = React.useState<any[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [columnMappings, setColumnMappings] = React.useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = React.useState<string>('');
  const [classes, setClasses] = React.useState<any[]>([]);
  const [importResult, setImportResult] = React.useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = React.useState<string>('');

  // Fetch available classes on mount
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched classes:', data);
          if (Array.isArray(data) && data.length > 0) {
            setClasses(data);
          } else {
            setError('No classes found. Please create a class first.');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load classes');
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        setError('Failed to load classes. Please refresh the page.');
      }
    };
    fetchClasses();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setError('');
      setIsUploading(true);

      try {
        const reader = new FileReader();
        
        // Handle both CSV and XLSX files
        reader.onload = async (evt) => {
          try {
            const data = evt.target?.result;
            let parsedData: any[] = [];
            let headers: string[] = [];

            if (file.name.endsWith('.csv')) {
              // Parse CSV
              if (typeof data === 'string') {
                const lines = data.split('\n');
                headers = lines[0].split(',').map(h => h.trim());
                parsedData = lines.slice(1)
                  .filter(line => line.trim())
                  .map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const row: any = {};
                    headers.forEach((header, idx) => {
                      row[header] = values[idx] || '';
                    });
                    return row;
                  });
              }
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
              // For XLSX files, we need to use xlsx library
              // For now, send to API to handle parsing
              const formData = new FormData();
              formData.append('file', file);
              
              const response = await fetch('/api/students/parse-upload', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error('Failed to parse Excel file');
              }

              const result = await response.json();
              parsedData = result.data;
              headers = result.headers;
            } else {
              throw new Error('Only CSV and XLSX files are supported');
            }

            if (parsedData.length === 0) {
              setError('No data found in the file');
              setIsUploading(false);
              return;
            }

            setFileData(parsedData);
            setIsUploading(false);
            setStep(2);

            // Initialize column mappings with smart defaults
            const defaults: Record<string, string> = {};
            systemFields.forEach(field => {
              const match = headers.find(h => 
                h.toLowerCase().includes(field.split('_')[0]) || 
                h.toLowerCase().includes(field.split('_')[1])
              );
              defaults[field] = match || '';
            });
            setColumnMappings(defaults);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
            setIsUploading(false);
            console.error(err);
          }
        };

        reader.onerror = () => {
          setError('Failed to read file');
          setIsUploading(false);
        };

        // Read as text for CSV, or as ArrayBuffer for XLSX
        if (file.name.endsWith('.csv')) {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      } catch (err) {
        setError('Failed to read file');
        setIsUploading(false);
        console.error(err);
      }
    }
  };

  const handleColumnChange = (field: string, value: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImport = async () => {
    if (!selectedClass) {
      setError('Please select a class before importing');
      return;
    }

    // Validate that all required fields are mapped
    const requiredFields = systemFields.slice(0, 3); // student_name, class_id, parent_name
    const unmappedRequired = requiredFields.filter(field => !columnMappings[field]);
    
    if (unmappedRequired.length > 0) {
      setError(`Please map all required fields: ${unmappedRequired.join(', ')}`);
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Transform the data based on column mappings
      const mappedData = fileData
        .filter(row => row[columnMappings['student_name']])
        .map(row => ({
          name: row[columnMappings['student_name']],
          parent_name: columnMappings['parent_name'] ? row[columnMappings['parent_name']] : undefined,
          parent_phone: columnMappings['contact_number'] ? row[columnMappings['contact_number']] : undefined,
          student_number: columnMappings['student_number'] ? row[columnMappings['student_number']] : undefined,
          class_id: selectedClass,
        }));

      // Call the API to create students
      const formData = new FormData();
      formData.append('file', new Blob([JSON.stringify(mappedData)]), 'data.json');
      formData.append('class_id', selectedClass);

      const response = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setImportResult({
        success: result.count || mappedData.length,
        failed: 0,
        errors: []
      });
      setIsUploading(false);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import students');
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard/school-admin" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ArrowRight className="w-3 h-3" />
            <Link href="/dashboard/school-admin/students" className="hover:text-blue-600 transition-colors">Students</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">Bulk Upload</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Student Upload</h1>
              <p className="text-gray-600">Import hundreds of students instantly via Excel or CSV</p>
            </div>
            {step > 1 && step < 4 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            {[
              { s: 1, label: 'Upload File' },
              { s: 2, label: 'Map Columns' },
              { s: 3, label: 'Preview & Import' },
              { s: 4, label: 'Complete' }
            ].map((item) => (
              <div key={item.s} className="flex items-center gap-2 min-w-fit px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === item.s ? 'bg-blue-600 text-white' : 
                  step > item.s ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > item.s ? <CheckCircle2 className="w-5 h-5" /> : item.s}
                </div>
                <span className={`text-sm font-medium ${step === item.s ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {item.s < 4 && <div className="w-8 h-[1px] bg-gray-200 hidden md:block ml-2" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-dashed border-2 bg-white/50">
                  <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">Upload your student list</h3>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Drag and drop your .xlsx or .csv file here, or click to browse.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Input 
                        type="file" 
                        className="hidden" 
                        id="file-upload" 
                        accept=".csv,.xlsx"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload">
                        <Button className="cursor-pointer pointer-events-none" disabled={isUploading}>
                          {isUploading ? 'Processing...' : 'Choose File'}
                        </Button>
                      </label>
                      <p className="text-xs text-gray-400">Supported formats: XLSX, XLS, CSV (Max 10MB)</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Important Note</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Ensure your file has clear headers for student names, classes, and parent contact information.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Need a template?</p>
                      <p className="text-xs text-blue-700">Download our sample Excel file</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white">Download</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      Configure Import Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Class Selection */}
                    {classes.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">No classes available</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Please create a class first before uploading students.
                          </p>
                          <Link href="/dashboard/school-admin/classes/new">
                            <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                              Create a Class
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Class for Import *
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Choose a class...</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.class_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Column Mapping */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">Map Excel Columns to System Fields</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                          <div>System Field</div>
                          <div>Excel Column</div>
                        </div>
                        {systemFields.map((field, idx) => (
                          <div key={field} className="grid grid-cols-2 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="font-medium text-gray-900 capitalize">
                              {field.replace('_', ' ')}
                              {idx < 2 && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <select 
                              value={columnMappings[field] || ''}
                              onChange={(e) => handleColumnChange(field, e.target.value)}
                              className="bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Column...</option>
                              {Object.keys(fileData[0] || {}).map(h => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                              <option value="ignore">Skip this field</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!selectedClass || classes.length === 0}
                        className="gap-2"
                      >
                        Next: Preview Data <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Data Preview</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Found {fileData.length} students in &quot;{fileName}&quot;</p>
                    </div>
                    <Badge variant="success">Ready to import</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {Object.keys(fileData[0] || {}).map(h => (
                              <th key={h} className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fileData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              {Object.keys(row).map(h => (
                                <td key={h} className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing first {Math.min(5, fileData.length)} of {fileData.length} records.
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} disabled={isUploading}>
                          Back
                        </Button>
                        <Button onClick={handleImport} disabled={isUploading} className="gap-2 bg-green-600 hover:bg-green-700">
                          {isUploading ? 'Importing...' : 'Finalize & Import All Students'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 space-y-6"
              >
                {importResult?.success ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">Import Successful!</h2>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {importResult.success} student{importResult.success !== 1 ? 's have' : ' has'} been successfully added to the database and assigned to the selected class.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Link href="/dashboard/school-admin/students">
                        <Button variant="outline">View Student List</Button>
                      </Link>
                      <Link href="/dashboard/school-admin">
                        <Button>Return to Dashboard</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">Import Failed</h2>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {error || 'Something went wrong during the import. Please try again.'}
                      </p>
                    </div>
                    <Button onClick={() => { setStep(1); setError(''); setFileData([]); }} className="gap-2">
                      Start Over
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
