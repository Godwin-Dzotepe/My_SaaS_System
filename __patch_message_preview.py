from pathlib import Path 
p = Path(r'components/messaging/message-center.tsx') 
s = p.read_text(encoding='utf-8') 
old1 = \"                    <p className=\\\"font-semibold text-gray-900\\\">{title || 'Untitled message'}</p>\"  
new1 = \"                    <p className=\\\"font-semibold text-gray-900\\\">\n                      {currentRole === 'school_admin'\n                        ? recipientRole === 'parent'\n                          ? 'Message to all parents'\n                          : recipientRole === 'teacher'\n                            ? 'Message to all teachers'\n                            : recipientRole === 'secretary'\n                              ? 'Message to all secretaries'\n                              : recipientRole === 'finance_admin'\n                                ? 'Message to all finance admins'\n                                : 'Message to all school admins'\n                        : title || 'Untitled message'}\n                    </p>\"  
old2 = \"                                ? `To ${message.recipient_name} (${message.recipient_role.replace('_', ' ')})`\"  
new2 = \"                                ? currentRole === 'school_admin' && (message.recipient_role === 'parent' || message.recipient_role === 'teacher')\n                                  ? `To all ${message.recipient_role === 'parent' ? 'parents' : 'teachers'}`\n                                  : `To ${message.recipient_name} (${message.recipient_role.replace('_', ' ')})`\"  
s = s.replace(old1, new1) 
s = s.replace(old2, new2) 
p.write_text(s, encoding='utf-8') 
