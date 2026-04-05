from pathlib import Path
s = p.read_text(encoding='utf-8')
p = Path(r'app/dashboard/school-admin/students/view/[id]/page.tsx')
s = s.replace('  Phone,\n  ShieldCheck,', '  Phone,\n  Printer,\n  ShieldCheck,')
s = s.replace(\"import { formatGhanaCedis } from '@/lib/currency';\", \"import { formatGhanaCedis } from '@/lib/currency';\nimport { downloadPdfFromLines } from '@/lib/client-pdf';\")
