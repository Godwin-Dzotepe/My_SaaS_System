from pathlib import Path 
p = Path(r'app/api/messages/route.ts') 
s = p.read_text(encoding='utf-8') 
q = chr(39) 
imp = 'import { sendPushToUsers } from ' + q + '@/lib/push-service' + q + ';' 
src = 'import { sendSMS } from ' + q + '@/lib/sms-service' + q + ';' 
if imp not in s: 
    s = s.replace(src, src + '\n' + imp) 
if 'await sendPushToUsers(' not in s: 
    anchor = '      let smsSummary = { attempted: 0, sent: 0, failed: 0 };' 
    block_lines = [ 
        '      await sendPushToUsers(', 
        '        recipients.map((recipient) => recipient.id),', 
        '        {', 
        '          title: validation.data.title.trim() || ' + q + 'New Message' + q + ',', 
        '          body: validation.data.body.trim() || ' + q + 'You have a new message.' + q + ',', 
        '          url: `/dashboard/${validation.data.recipient_role}/messaging`,', 
        '        }', 
        '      );', 
        '', 
    ] 
    block = '\n'.join(block_lines) 
    s = s.replace(anchor, block + '\n' + anchor) 
p.write_text(s, encoding='utf-8') 
