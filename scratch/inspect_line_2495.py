file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

line_2495 = lines[2494]
print(f"Line 2495: {line_2495.rstrip()}")
print(f"Hex representation:")
for c in line_2495:
    print(f"  {repr(c)}: {hex(ord(c))}")
