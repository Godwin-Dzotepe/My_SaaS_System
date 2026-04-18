'use client';

import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Settings2,
  AlertTriangle,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
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

const importFields: ReadonlyArray<{ key: string; label: string; required?: boolean }> = [
  { key: 'name', label: 'Student Name', required: true },
  { key: 'student_number', label: 'Student Number' },
  { key: 'class_name', label: 'Class Name' },
  { key: 'parent_relation', label: 'Parent Relation' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'admission_date', label: 'Admission Date' },
  { key: 'previous_school', label: 'Previous School' },
  { key: 'residential_address', label: 'Residential Address' },
  { key: 'digital_address', label: 'Digital Address' },
  { key: 'father_name', label: 'Father Name' },
  { key: 'father_phone', label: 'Father Phone' },
  { key: 'father_profession', label: 'Father Profession' },
  { key: 'father_status', label: 'Father Status' },
  { key: 'father_residential_address', label: 'Father Residential Address' },
  { key: 'father_digital_address', label: 'Father Digital Address' },
  { key: 'mother_name', label: 'Mother Name' },
  { key: 'mother_phone', label: 'Mother Phone' },
  { key: 'mother_profession', label: 'Mother Profession' },
  { key: 'mother_status', label: 'Mother Status' },
  { key: 'mother_residential_address', label: 'Mother Residential Address' },
  { key: 'mother_digital_address', label: 'Mother Digital Address' },
  { key: 'guardian_name', label: 'Guardian Name' },
  { key: 'guardian_phone', label: 'Guardian Phone' },
  { key: 'guardian_profession', label: 'Guardian Profession' },
  { key: 'guardian_residential_address', label: 'Guardian Residential Address' },
  { key: 'guardian_digital_address', label: 'Guardian Digital Address' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
  { key: 'medical_notes', label: 'Medical Notes' },
];

export default function SecretaryBulkUpload() {
  const [step, setStep] = React.useState(1);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileData, setFileData] = React.useState<any[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [columnMappings, setColumnMappings] = React.useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = React.useState<string>('');
  const [classes, setClasses] = React.useState<any[]>([]);
  const [importResult, setImportResult] = React.useState<{ success: number; failed: number; errors: string[]; parentAccounts?: Array<{ name: string; phone: string; temporary_password: string | null }> } | null>(null);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setClasses(data);
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
        reader.onload = async (evt) => {
          try {
            const data = evt.target?.result;
            let parsedData: any[] = [];
            let headers: string[] = [];

            if (file.name.endsWith('.csv')) {
              if (typeof data === 'string') {
                const lines = data.split('\n');
                headers = lines[0].split(',').map((h) => h.trim());
                parsedData = lines.slice(1)
                  .filter((line) => line.trim())
                  .map((line) => {
                    const values = line.split(',').map((v) => v.trim());
                    const row: any = {};
                    headers.forEach((header, idx) => {
                      row[header] = values[idx] || '';
                    });
                    return row;
                  });
              }
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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

            const defaults: Record<string, string> = {};
            importFields.forEach((field) => {
              const normalizedKey = field.key.toLowerCase();
              const match = headers.find((header) => {
                const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
                return normalizedHeader.includes(normalizedKey) || normalizedKey.includes(normalizedHeader);
              });
              defaults[field.key] = match || '';
            });
            setColumnMappings(defaults);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          setError('Failed to read file');
          setIsUploading(false);
        };

        if (file.name.endsWith('.csv')) {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      } catch (err) {
        setError('Failed to read file');
        setIsUploading(false);
      }
    }
  };

  const handleColumnChange = (field: string, value: string) => {
    setColumnMappings((prev) => ({ ...prev, [field]: value }));
  };

  const handleImport = async () => {
    const requiredFields = importFields.filter((field) => field.required).map((field) => field.key);
    const unmappedRequired = requiredFields.filter((field) => {
      const mapped = columnMappings[field];
      return !mapped || mapped === 'ignore';
    });

    if (unmappedRequired.length > 0) {
      setError(`Please map all required fields: ${unmappedRequired.join(', ')}`);
      return;
    }

    if (!selectedClass && (!columnMappings.class_name || columnMappings.class_name === 'ignore')) {
      setError('Select one class for all rows or map a Class Name column from your file.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const mappedData = fileData
        .map((row) => {
          const mappedRow: Record<string, unknown> = {};
          importFields.forEach((field) => {
            const column = columnMappings[field.key];
            if (!column || column === 'ignore') return;
            mappedRow[field.key] = row[column];
          });
          if (selectedClass) {
            mappedRow.class_id = selectedClass;
          }
          return mappedRow;
        })
        .filter((row) => row.name);

      const formData = new FormData();
      formData.append('file', new Blob([JSON.stringify(mappedData)], { type: 'application/json' }), 'data.json');
      if (selectedClass) {
        formData.append('class_id', selectedClass);
      }

      const response = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        const detailLines = Array.isArray(result.errors)
          ? result.errors
              .slice(0, 5)
              .filter((line: unknown) => typeof line === 'string' && line !== result.error)
          : [];
        const detailText = detailLines.length > 0 ? `\n${detailLines.join('\n')}` : '';
        throw new Error((result.error || 'Import failed') + detailText);
      }

      setImportResult({
        success: result.count || 0,
        failed: result.failed || 0,
        errors: result.errors || [],
        parentAccounts: result.parentAccounts || [],
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
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard/secretary" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ArrowRight className="w-3 h-3" />
            <Link href="/dashboard/secretary/students" className="hover:text-blue-600 transition-colors">Students</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">Bulk Upload</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Student Upload</h1>
              <p className="text-gray-600">Import the same student and parent details used in the manual student form</p>
            </div>
            {step > 1 && step < 4 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
          </div>

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
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-dashed border-2 bg-white/50">
                  <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">Upload your student list</h3>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Upload CSV or Excel with student, parent, guardian, address, and emergency fields.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Input type="file" className="hidden" id="file-upload" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
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
                        Parents added through this upload will get generated login passwords and those passwords will appear in the parent admin panel.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-900">Class handling</p>
                    <p className="text-xs text-blue-700 mt-1">You can either choose one class for all rows or map a Class Name column in the next step.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Optional: Select One Class for All Imported Students
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Use class from mapped file column</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">Map Excel Columns to Student Fields</h3>
                      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider px-2 sticky top-0 bg-white py-2">
                          <div>System Field</div>
                          <div>Excel Column</div>
                        </div>
                        {importFields.map((field) => (
                          <div key={field.key} className="grid grid-cols-2 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="font-medium text-gray-900">
                              {field.label}
                              {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                            </div>
                            <select
                              value={columnMappings[field.key] || ''}
                              onChange={(e) => handleColumnChange(field.key, e.target.value)}
                              className="bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Column...</option>
                              {Object.keys(fileData[0] || {}).map((header) => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                              <option value="ignore">Skip this field</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                      <Button onClick={() => setStep(3)} className="gap-2">
                        Next: Preview Data <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
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
                      <p className="text-sm text-gray-500 mt-1">Found {fileData.length} rows in &quot;{fileName}&quot;</p>
                    </div>
                    <Badge variant="success">Ready to import</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {Object.keys(fileData[0] || {}).map((header) => (
                              <th key={header} className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fileData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              {Object.keys(row).map((header) => (
                                <td key={header} className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs">{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <p className="text-sm text-gray-500">Showing first {Math.min(5, fileData.length)} of {fileData.length} records.</p>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} disabled={isUploading}>Back</Button>
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
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 space-y-6">
                {importResult?.success ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">Import Complete</h2>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {importResult.success} student(s) imported successfully. {importResult.failed ? `${importResult.failed} row(s) failed validation.` : 'All rows were processed successfully.'}
                      </p>
                    </div>
                    {importResult.parentAccounts && importResult.parentAccounts.length > 0 ? (
                      <Card className="w-full max-w-3xl">
                        <CardHeader>
                          <CardTitle>Generated Parent Login Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {importResult.parentAccounts.slice(0, 10).map((parent) => (
                            <div key={parent.phone} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                              <div>
                                <p className="font-medium text-gray-900">{parent.name}</p>
                                <p className="text-sm text-gray-500">{parent.phone}</p>
                                <p className="font-mono text-sm text-gray-800">{parent.temporary_password || 'Existing password kept'}</p>
                              </div>
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.clipboard.writeText(`${parent.name}\nPhone: ${parent.phone}\nPassword: ${parent.temporary_password || 'Existing password kept'}`)}>
                                <Copy className="w-4 h-4" /> Copy
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                    {importResult.errors.length > 0 ? (
                      <Card className="w-full max-w-3xl border-amber-200 bg-amber-50">
                        <CardHeader>
                          <CardTitle>Rows That Need Attention</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-amber-900">
                          {importResult.errors.slice(0, 10).map((item) => <p key={item}>{item}</p>)}
                        </CardContent>
                      </Card>
                    ) : null}
                    <div className="flex gap-4">
                      <Link href="/dashboard/secretary/students"><Button variant="outline">Back to Students</Button></Link>
                      <Link href="/dashboard/secretary"><Button>Done</Button></Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">Import Failed</h2>
                      <p className="text-gray-600 max-w-md mx-auto">{error || 'Something went wrong during the import. Please try again.'}</p>
                    </div>
                    <Button onClick={() => { setStep(1); setError(''); setFileData([]); }} className="gap-2">Start Over</Button>
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


