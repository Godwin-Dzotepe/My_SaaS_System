from pathlib import Path  
p = Path(r'app/dashboard/school-admin/teachers/view/[id]/page.tsx')  
s = p.read_text()  
s = s.replace('  Users,\n} from \'lucide-react\';', '  Users,\n  Printer,\n} from \'lucide-react\';')  
s = s.replace('import { Card, CardContent, CardHeader, CardTitle, CardDescription } from \'@/components/ui/card\';', 'import { Card, CardContent, CardHeader, CardTitle, CardDescription } from \'@/components/ui/card\';\nimport { downloadPdfFromLines } from \'@/lib/client-pdf\';')  
