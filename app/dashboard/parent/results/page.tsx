"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface Child {
  id: string;
  name: string;
  class: { class_name: string };
  school: { school_name: string };
}

interface Score {
  id: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
  subject: {
    subject_name: string;
  };
}

const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export default function ParentResultsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[0]);
  const [selectedTerm, setSelectedTerm] = useState<string>(TERMS[0]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingScores, setIsFetchingScores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch children on component mount
  useEffect(() => {
    const fetchChildren = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/parent/children');
        if (!res.ok) throw new Error('Failed to fetch your children.');
        const data = await res.json();
        setChildren(data);
        if (data.length > 0) {
            setSelectedChild(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, []);

  const handleFetchScores = async () => {
    if (!selectedChild || !selectedYear || !selectedTerm) {
      setError('Please select a child, year, and term.');
      return;
    }

    setIsFetchingScores(true);
    setError(null);
    setScores([]);

    try {
      const res = await fetch(`/api/parent/children/${selectedChild}/scores?academic_year=${selectedYear}&term=${selectedTerm}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch scores.');
      }
      const data = await res.json();
      setScores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingScores(false);
    }
  };
  
  const selectedChildData = children.find(c => c.id === selectedChild);

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>View Student Report Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              disabled={children.length === 0}
            >
              <option value="">{children.length === 0 ? 'No children found' : 'Select Child'}</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Button onClick={handleFetchScores} disabled={isFetchingScores || !selectedChild}>
              {isFetchingScores ? 'Loading...' : 'View Report'}
            </Button>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          {scores.length > 0 && selectedChildData && (
            <div className="border rounded-lg p-6 mt-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold">{selectedChildData.name}</h2>
                    <p className="text-gray-600">{selectedChildData.school.school_name} - {selectedChildData.class.class_name}</p>
                    <p className="text-gray-500">{selectedYear}, {selectedTerm}</p>
                </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class Score</TableHead>
                    <TableHead>Exam Score</TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell>{score.subject.subject_name}</TableCell>
                      <TableCell>{score.classScore ?? 'N/A'}</TableCell>
                      <TableCell>{score.examScore ?? 'N/A'}</TableCell>
                      <TableCell>{score.totalScore ?? 'N/A'}</TableCell>
                      <TableCell>{score.grade ?? 'N/A'}</TableCell>
                      <TableCell>{score.remark ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isFetchingScores && scores.length === 0 && selectedChild && (
              <p className="text-center text-gray-500 pt-8">No scores found for the selected period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
