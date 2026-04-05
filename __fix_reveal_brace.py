from pathlib import Path 
p = Path(r'app/api/parents/reveal-password/route.ts') 
lines = p.read_text(encoding='utf-8').splitlines() 
out = [] 
inserted = False 
for i, ln in enumerate(lines): 
    out.append(ln) 
    if ('Admin password is incorrect' in ln) and (inserted is False): 
        next_line = lines[i + 1] if (i + 1) != len(lines) else '' 
        if 'if (parent === null' in next_line: 
            out.append('    }') 
            inserted = True 
p.write_text('\n'.join(out) + '\n', encoding='utf-8')
