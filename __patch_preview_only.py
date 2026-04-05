from pathlib import Path
p = Path(r'components/messaging/message-center.tsx') 
lines = p.read_text(encoding='utf-8').splitlines() 
out = [] 
for ln in lines: 
    if 'font-semibold text-gray-900' in ln and 'Untitled message' in ln:
        out.append('                    <p className=\"font-semibold text-gray-900\">') 
        out.append('                      {currentRole === \"school_admin\"') 
        out.append('                        ? recipientRole === \"parent\"') 
        out.append('                          ? \"Message to all parents\"') 
        out.append('                          : recipientRole === \"teacher\"') 
        out.append('                            ? \"Message to all teachers\"') 
        out.append('                            : recipientRole === \"secretary\"') 
        out.append('                              ? \"Message to all secretaries\"')
        out.append('                              : recipientRole === \"finance_admin\"') 
        out.append('                                ? \"Message to all finance admins\"') 
        out.append('                                : \"Message to all school admins\"') 
        out.append('                        : title ? title : \"Untitled message\"}') 
        out.append('                    </p>') 
    else: 
        out.append(ln) 
p.write_text('\n'.join(out) + '\n', encoding='utf-8')
