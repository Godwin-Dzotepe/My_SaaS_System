import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as buffer
    const buffer = await file.arrayBuffer();
    
    // Parse XLSX file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
    const headers = Object.keys(jsonData[0] || {});

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    return NextResponse.json({
      data: jsonData,
      headers: headers,
      count: jsonData.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error parsing file:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse file' 
    }, { status: 500 });
  }
}
