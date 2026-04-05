from pathlib import Path 
p = Path(r'app/dashboard/parent/page.tsx') 
s = p.read_text(encoding='utf-8') 
s = s.replace('className=\"flex items-start justify-between mb-6\"', 'className=\"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6\"') 
s = s.replace('className=\"grid grid-cols-3 gap-2 py-5 bg-[#f8f9fb] rounded-xl px-4 mb-3\"', 'className=\"grid grid-cols-1 gap-2 py-5 bg-[#f8f9fb] rounded-xl px-4 mb-3 sm:grid-cols-3\"') 
s = s.replace('className=\"text-center border-x border-gray-200\"', 'className=\"text-center sm:border-x sm:border-gray-200\"') 
s = s.replace('className=\"flex justify-between items-start gap-3\"', 'className=\"flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between\"') 
s = s.replace('className=\"flex flex-row items-center justify-between border-b border-gray-50 pb-4\"', 'className=\"flex flex-col gap-3 border-b border-gray-50 pb-4 sm:flex-row sm:items-center sm:justify-between\"') 
s = s.replace('className=\"font-bold text-[#212529] text-xl\"', 'className=\"font-bold text-[#212529] text-xl break-words\"') 
s = s.replace('className=\"flex items-center gap-2 text-sm text-[#646464] mt-1\"', 'className=\"mt-1 flex items-center gap-2 text-sm text-[#646464] min-w-0\"') 
helper = '''function formatDashboardMessage(message: string) {\n  const trimmed = message.trim();\n  if (!trimmed) return 'No additional details.';\n\n  if (trimmed.startsWith('{\"type\":\"RESULT_PUBLISHED\"')) {\n    try {\n      const payload = JSON.parse(trimmed);\n      if (payload?.message) {\n        return String(payload.message);\n      }\n    } catch {}\n\n    return 'Results are now available. Open the child results page.';\n  }\n\n  return message;\n}\n\n''' 
marker = 'export default function ParentDashboard() {' 
if 'function formatDashboardMessage(message: string)' not in s and marker in s: 
    s = s.replace(marker, helper + marker, 1) 
s = s.replace('{notification.message}', '{formatDashboardMessage(notification.message)}') 
p.write_text(s, encoding='utf-8') 
