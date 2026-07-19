import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

lines = text.split('\n')
start_line = 4694
end_line = 5155

stack = []

for idx in range(start_line - 1, end_line):
    line_num = idx + 1
    line = lines[idx]
    
    # Simple search for div open/close
    # We look for <div (but not self-closing or generic) and </div>
    # To be safe, let's look for exact matches of '<div' and '</div>'
    
    # Find all occurrences of '<div' (ignoring case)
    for m in re.finditer(r'<div\b', line):
        stack.append(('OPEN', line_num, m.start()))
        print(f"L{line_num} pos {m.start()}: Open <div> -> stack size {len(stack)}")
        
    for m in re.finditer(r'</div>', line):
        if not stack:
            print(f"L{line_num} pos {m.start()}: Close </div> but stack is empty!")
        else:
            top_type, top_l, top_p = stack.pop()
            print(f"L{line_num} pos {m.start()}: Close </div>, matched <div> from L{top_l} pos {top_p} -> stack size {len(stack)}")

print("\nUnclosed divs:")
for item in stack:
    print(f"  L{item[1]} pos {item[2]}")
