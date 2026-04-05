from pathlib import Path 
p = Path(r'app/api/parents/reveal-password/route.ts') 
lines = p.read_text(encoding='utf-8').splitlines() 
out = [] 
for ln in lines: 
    out.append(ln) 
    if 'Admin password is incorrect' in ln: 
        out.append('    }') 
p.write_text('\n'.join(out) + '\n', encoding='utf-8') 
