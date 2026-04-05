from pathlib import Path 
p = Path(r'app/api/parents/reveal-password/route.ts') 
lines = p.read_text(encoding='utf-8').splitlines() 
out = [] 
added = False 
for ln in lines: 
    out.append(ln) 
    if (not added) and ('Unauthorized' in ln and 'status: 403' in ln): 
        out.append('') 
        out.append('    if (!parent.temporary_password) {') 
        out.append('      return NextResponse.json(') 
        out.append('        { error: \\\"No temporary password is available for this parent. Use Reset Password to generate a new one.\\\" },') 
        out.append('        { status: 409 }') 
        out.append('      );') 
        out.append('    }') 
        added = True 
if any('No temporary password is available for this parent' in x for x in lines): 
    out = lines 
p.write_text('\n'.join(out) + '\n', encoding='utf-8') 
