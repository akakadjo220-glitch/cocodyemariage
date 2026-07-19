import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Track stack of open tags
stack = []
issues = []

# Simple JSX tag parser
open_tag_re = re.compile(r'<([A-Z][A-Za-z0-9.]*|[a-z][A-Za-z0-9]*)(?:\s|>|$)')
close_tag_re = re.compile(r'</([A-Z][A-Za-z0-9.]*|[a-z][A-Za-z0-9]*)>')
self_close_re = re.compile(r'<([A-Z][A-Za-z0-9.]*|[a-z][A-Za-z0-9]*)(?:[^>]*)/>') 
fragment_open_re = re.compile(r'<>')
fragment_close_re = re.compile(r'</>')

# Tags to skip (self-closing HTML tags)
VOID_TAGS = {'br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'}

for i, line in enumerate(lines, 1):
    # Skip comments
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
        continue

    # Remove string literals to avoid false positives
    # Remove JSX string expressions {`...`} and "..." in attributes
    clean = re.sub(r'"[^"]*"', '""', line)
    clean = re.sub(r"'[^']*'", "''", clean)
    clean = re.sub(r'`[^`]*`', '``', clean)
    # Remove JSX expressions inside {} that might contain < or >
    clean = re.sub(r'\{[^{}]*\}', '{}', clean)
    
    # Find fragment opens and closes
    for m in fragment_open_re.finditer(clean):
        stack.append(('fragment', i))
    for m in fragment_close_re.finditer(clean):
        if stack and stack[-1][0] == 'fragment':
            stack.pop()
        else:
            issues.append(f"Line {i}: Unexpected </> - stack top is {stack[-1] if stack else 'empty'}")
    
    # Find self-closing tags - remove them first
    clean_no_self = re.sub(r'<[A-Za-z][A-Za-z0-9.]*[^>]*/>', '', clean)
    
    # Find closing tags
    for m in close_tag_re.finditer(clean_no_self):
        tag = m.group(1)
        if tag in VOID_TAGS:
            continue
        if stack and stack[-1][0] == tag:
            stack.pop()
        elif stack:
            issues.append(f"Line {i}: Found </{tag}> but expected </{stack[-1][0]}> (opened at line {stack[-1][1]})")
            # Try to recover
            while stack and stack[-1][0] != tag:
                stack.pop()
            if stack:
                stack.pop()
        else:
            issues.append(f"Line {i}: Unexpected </{tag}> - stack is empty")
    
    # Find opening tags (non-self-closing)
    remaining = clean_no_self
    for m in open_tag_re.finditer(remaining):
        tag = m.group(1)
        if tag in VOID_TAGS:
            continue
        # Check if it's followed by /> (self-closing) - already removed above
        # Check if it's in a comment
        stack.append((tag, i))

print(f"=== JSX Audit Results ===")
print(f"Stack size at end: {len(stack)}")
print(f"\nUnclosed tags at end of file:")
for tag, line_no in stack[-20:]:  # Show last 20
    print(f"  <{tag}> opened at line {line_no}")

print(f"\nIssues found: {len(issues)}")
for issue in issues[:30]:
    print(f"  {issue}")

# Find the midpoint - look for where balance changes
print("\n=== Checking balance in sections ===")
# Count divs in different ranges
ranges = [(1677, 2000), (2000, 2500), (2500, 3000), (3000, 3500), (3500, 4000), (4000, 4500), (4500, 5000), (5000, 5500), (5500, 5983)]
for start, end in ranges:
    section_lines = lines[start-1:end-1]
    opens = sum(len(re.findall(r'<div[\s>]', l)) for l in section_lines)
    closes = sum(len(re.findall(r'</div>', l)) for l in section_lines)
    diff = opens - closes
    marker = " <<<< IMBALANCE" if diff != 0 else ""
    print(f"  Lines {start}-{end}: <div> opens={opens}, </div> closes={closes}, diff={diff}{marker}")
