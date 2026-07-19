import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

pos = 0
n = len(text)
line_no = 1

# Stack of states: 'JS', 'JSX_TEXT', 'JSX_TAG', 'STRING_DBL', 'STRING_SGL', 'STRING_TMP', 'LINE_COMMENT', 'BLOCK_COMMENT'
# We start in JS state because the file is a TSX file (starts with imports and code)
state_stack = ['JS']
paren_stack = []
issues = []

# To trace what's happening
def log_issue(msg):
    issues.append(f"Line {line_no}: {msg}")

while pos < n:
    char = text[pos]
    if char == '\n':
        line_no += 1
        
    current_state = state_stack[-1]
    
    # Handle comments in any state (except inside strings)
    if current_state not in ('STRING_DBL', 'STRING_SGL', 'STRING_TMP', 'LINE_COMMENT', 'BLOCK_COMMENT'):
        if char == '/' and pos + 1 < n and text[pos+1] == '/':
            state_stack.append('LINE_COMMENT')
            pos += 2
            continue
        elif char == '/' and pos + 1 < n and text[pos+1] == '*':
            state_stack.append('BLOCK_COMMENT')
            pos += 2
            continue

    if current_state == 'LINE_COMMENT':
        if char == '\n':
            state_stack.pop()
        pos += 1
    elif current_state == 'BLOCK_COMMENT':
        if char == '*' and pos + 1 < n and text[pos+1] == '/':
            state_stack.pop()
            pos += 2
        else:
            pos += 1
    elif current_state == 'STRING_DBL':
        if char == '\\':
            pos += 2
        elif char == '"':
            state_stack.pop()
            pos += 1
        else:
            pos += 1
    elif state_stack[-1] == 'STRING_SGL':
        if char == '\\':
            pos += 2
        elif char == "'":
            state_stack.pop()
            pos += 1
        else:
            pos += 1
    elif state_stack[-1] == 'STRING_TMP':
        if char == '\\':
            pos += 2
        elif char == '`':
            state_stack.pop()
            pos += 1
        else:
            pos += 1
            
    elif current_state == 'JSX_TEXT':
        if char == '{':
            state_stack.append('JS')
            paren_stack.append(('{', line_no, 'JS_BLOCK'))
            pos += 1
        elif char == '<':
            # Check if closing tag
            if pos + 1 < n and text[pos+1] == '/':
                # It's a closing tag of JSX_TEXT, which should pop JSX_TEXT
                state_stack.pop()
                # Find tag end
                m = re.match(r'^</([a-zA-Z0-9_.-]+)\s*>', text[pos:])
                if m:
                    pos += len(m.group(0))
                else:
                    m_frag = re.match(r'^</\s*>', text[pos:])
                    if m_frag:
                        pos += len(m_frag.group(0))
                    else:
                        pos += 2
            else:
                # Opening tag or fragment
                if pos + 1 < n and text[pos+1] == '>':
                    # Fragment open
                    state_stack.append('JSX_TEXT')
                    pos += 2
                else:
                    m = re.match(r'^<([a-zA-Z0-9_.-]+)', text[pos:])
                    if m:
                        state_stack.append('JSX_TAG')
                        pos += len(m.group(0))
                    else:
                        pos += 1
        else:
            pos += 1
            
    elif current_state == 'JSX_TAG':
        if char == '"':
            state_stack.append('STRING_DBL')
            pos += 1
        elif char == "'":
            state_stack.append('STRING_SGL')
            pos += 1
        elif char == '{':
            state_stack.append('JS')
            paren_stack.append(('{', line_no, 'JS_BLOCK'))
            pos += 1
        elif char == '>':
            # Check if self-closing
            is_self_closing = pos > 0 and text[pos-1] == '/'
            state_stack.pop() # Pop JSX_TAG
            if not is_self_closing:
                state_stack.append('JSX_TEXT')
            pos += 1
        else:
            pos += 1
            
    elif current_state == 'JS':
        if char == '"':
            state_stack.append('STRING_DBL')
            pos += 1
        elif char == "'":
            state_stack.append('STRING_SGL')
            pos += 1
        elif char == '`':
            state_stack.append('STRING_TMP')
            pos += 1
        elif char in ('{', '('):
            paren_stack.append((char, line_no, 'PAREN'))
            pos += 1
        elif char == '}':
            # A '}' can close a JS block inside JSX, or a standard JS brace
            if not paren_stack:
                log_issue("Unmatched '}'")
            else:
                top_char, top_l, top_type = paren_stack.pop()
                if top_char != '{':
                    log_issue(f"'}}' matches '{top_char}' from L{top_l}")
                if top_type == 'JS_BLOCK':
                    # Closes the JS block inside JSX, pop JS state
                    if state_stack[-1] == 'JS':
                        state_stack.pop()
            pos += 1
        elif char == ')':
            if not paren_stack:
                log_issue("Unmatched ')'")
            else:
                top_char, top_l, top_type = paren_stack.pop()
                if top_char != '(':
                    log_issue(f"')' matches '{top_char}' from L{top_l}")
            pos += 1
        elif char == '<':
            # Check if it starts JSX (e.g. <div or <>)
            # But avoid matching comparison operators (e.g. if (x < y))
            # JSX tags start with tag name or fragment
            if pos + 1 < n and text[pos+1] == '>':
                # Fragment
                state_stack.append('JSX_TEXT')
                pos += 2
            else:
                m = re.match(r'^<([a-zA-Z0-9_.-]+)', text[pos:])
                if m:
                    # Let's ensure it's not a generic TS or comparison
                    # Usually, if it's a generic (like useState<boolean>), the next word is not a tag name
                    tag_name = m.group(1)
                    # Simple heuristic: tag names are standard html elements or start with uppercase
                    # Also we check if it's a generic type parameter
                    is_generic = tag_name in ('boolean', 'string', 'number', 'any', 'void', 'null', 'Date')
                    if not is_generic:
                        state_stack.append('JSX_TAG')
                        pos += len(m.group(0))
                        continue
                pos += 1
        else:
            pos += 1

print("=== JSX Parser Issues ===")
for issue in issues:
    # Filter issues around our region of interest
    l = int(re.search(r'Line (\d+)', issue).group(1)) if re.search(r'Line (\d+)', issue) else 0
    if l >= 4000 and l <= 5160:
        print(issue)

print("\nRemaining stack (bottom to top):")
for item in paren_stack[-30:]:
    print(f"  '{item[0]}' from Line {item[1]} type {item[2]}")
