file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

pos = 0
n = len(text)
line_no = 1
stack = []
issues = []

state = 'CODE'

while pos < n:
    char = text[pos]
    if char == '\n':
        line_no += 1
        
    if state == 'LINE_COMMENT':
        if char == '\n': state = 'CODE'
        pos += 1
    elif state == 'BLOCK_COMMENT':
        if char == '*' and pos + 1 < n and text[pos+1] == '/':
            state = 'CODE'
            pos += 2
        else: pos += 1
    elif state == 'STRING_DBL':
        if char == '\\': pos += 2
        elif char == '"': state = 'CODE'; pos += 1
        else: pos += 1
    elif state == 'STRING_SGL':
        if char == '\\': pos += 2
        elif char == "'": state = 'CODE'; pos += 1
        else: pos += 1
    elif state == 'STRING_TMP':
        if char == '\\': pos += 2
        elif char == '`': state = 'CODE'; pos += 1
        else: pos += 1
    elif state == 'CODE':
        if char == '/' and pos + 1 < n and text[pos+1] == '/':
            state = 'LINE_COMMENT'
            pos += 2
        elif char == '/' and pos + 1 < n and text[pos+1] == '*':
            state = 'BLOCK_COMMENT'
            pos += 2
        elif char == '"': state = 'STRING_DBL'; pos += 1
        elif char == "'": state = 'STRING_SGL'; pos += 1
        elif char == '`': state = 'STRING_TMP'; pos += 1
        elif char in ('{', '('):
            stack.append((char, line_no))
            if line_no >= 2545 and line_no <= 2685:
                print(f"L{line_no}: Push '{char}' -> stack: {stack[-5:]}")
            pos += 1
        elif char == '}':
            if not stack:
                if line_no >= 2545 and line_no <= 2685:
                    print(f"L{line_no}: Pop '}}' but stack is empty")
            else:
                top_char, top_l = stack.pop()
                if line_no >= 2545 and line_no <= 2685:
                    print(f"L{line_no}: Pop '}}', matched '{top_char}' from L{top_l} -> stack: {stack[-5:]}")
                if top_char != '{':
                    issues.append(f"Line {line_no}: '}}' matches '{top_char}' from Line {top_l}")
            pos += 1
        elif char == ')':
            if not stack:
                if line_no >= 2545 and line_no <= 2685:
                    print(f"L{line_no}: Pop ')' but stack is empty")
            else:
                top_char, top_l = stack.pop()
                if line_no >= 2545 and line_no <= 2685:
                    print(f"L{line_no}: Pop ')', matched '{top_char}' from L{top_l} -> stack: {stack[-5:]}")
                if top_char != '(':
                    issues.append(f"Line {line_no}: ')' matches '{top_char}' from Line {top_l}")
            pos += 1
        else:
            pos += 1
