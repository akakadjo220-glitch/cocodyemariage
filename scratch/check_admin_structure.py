with open(r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(1600, 4100):
    line_num = idx + 1
    if idx < len(lines):
        line = lines[idx].strip()
        # Print lines that contain fragments, && (, or closing parenthesis
        if any(token in line for token in ['currentRole', 'superadmin', 'mairieActiveTab', '<>', '</>', 'AnimatePresence']):
            print(f"L{line_num}: {line}")
        elif line.startswith(') : (') or line.startswith(') :') or line.startswith(') }') or line.startswith(')}') or line.startswith(')}'):
            print(f"L{line_num}: {line}")
