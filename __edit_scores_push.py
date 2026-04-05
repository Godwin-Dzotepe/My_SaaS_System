from pathlib import Path 
p = Path(r'app/api/scores/publish/route.ts') 
s = p.read_text(encoding='utf-8') 
q = chr(39) 
imp = 'import { sendPushToUsers } from ' + q + '@/lib/push-service' + q + ';' 
src = 'import { buildResultPublishPayload, RESULT_PUBLISHED_NOTIFICATION } from ' + q + '@/lib/result-publishing' + q + ';' 
if imp not in s: 
    s = s.replace(src, src + '\n' + imp) 
if 'await sendPushToUsers(' not in s: 
    anchor = '      await createPublishNotifications(schoolId, publisherName, schoolName, notifications);' 
    block_lines = [ 
        '      await sendPushToUsers(', 
        '        Array.from(new Set(notifications.map((item) => item.user_id))),', 
        '        {', 
        '          title: ' + q + 'Results Published' + q + ',', 
        '          body: `${classRoom.class_name} ${term} ${academic_year} results are now available.`,', 
        '          url: ' + q + '/dashboard/parent/results' + q + ',', 
        '        }', 
        '      );', 
    ] 
    block = '\n'.join(block_lines) 
    s = s.replace(anchor, anchor + '\n\n' + block) 
p.write_text(s, encoding='utf-8') 
