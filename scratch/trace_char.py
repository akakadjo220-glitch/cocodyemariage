import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

def remove_single_line_comments(text):
    out = []
    pos = 0
    n = len(text)
    while pos < n:
        if pos + 1 < n and text[pos:pos+2] == '//':
            eol = text.find('\n', pos)
            if eol == -1: eol = n
            out.append(' ' * (eol - pos))
            pos = eol
        else:
            out.append(text[pos])
            pos += 1
    return "".join(out)

def remove_block_comments(text):
    out = []
    pos = 0
    n = len(text)
    while pos < n:
        if pos + 1 < n and text[pos:pos+2] == '/*':
            end_block = text.find('*/', pos)
            if end_block == -1: end_block = n
            else: end_block += 2
            comment_segment = text[pos:end_block]
            cleaned_segment = "".join('\n' if c == '\n' else ' ' for c in comment_segment)
            out.append(cleaned_segment)
            pos = end_block
        else:
            out.append(text[pos])
            pos += 1
    return "".join(out)

no_comments = remove_block_comments(remove_single_line_comments(text))

# Let's run a simple tokenizer trace on line 2494 to 2496
pos = 0
n = len(no_comments)
line_no = 1
state_stack = ['JS']
js_braces_count = [0]

while pos < n:
    char = no_comments[pos]
    
    # We want to print state and char at line 2495
    if line_no == 2495:
        print(f"Line 2495 pos={pos}: char={repr(char)}, state={state_stack}")
        
    if char == '\n':
        line_no += 1
        pos += 1
        continue
    current_state = state_stack[-1]
    if current_state == 'JS':
        if char == '"':
            pos += 1
            while pos < n and no_comments[pos] != '"':
                if no_comments[pos] == '\\': pos += 2
                elif no_comments[pos] == '\n': line_no += 1; pos += 1
                else: pos += 1
            pos += 1
        elif char == "'":
            pos += 1
            while pos < n and no_comments[pos] != "'":
                if no_comments[pos] == '\\': pos += 2
                elif no_comments[pos] == '\n': line_no += 1; pos += 1
                else: pos += 1
            pos += 1
        elif char == '`':
            pos += 1
            while pos < n and no_comments[pos] != '`':
                if no_comments[pos] == '\\': pos += 2
                elif no_comments[pos] == '\n': line_no += 1; pos += 1
                else: pos += 1
            pos += 1
        elif char == '{':
            js_braces_count[-1] += 1
            pos += 1
        elif char == '}':
            if js_braces_count[-1] > 0:
                js_braces_count[-1] -= 1
            else:
                if len(state_stack) > 1:
                    state_stack.pop()
                    js_braces_count.pop()
            pos += 1
        elif char == '<':
            m = re.match(r'<([A-Za-z][A-Za-z0-9._-]*)', no_comments[pos:])
            if m:
                state_stack.append('JSX_TAG')
                js_braces_count.append(0)
                pos += m.end()
            else:
                pos += 1
        else:
            pos += 1
            
    elif current_state == 'JSX_TAG':
        if char == '"':
            pos += 1
            while pos < n and no_comments[pos] != '"':
                if no_comments[pos] == '\\': pos += 2
                elif no_comments[pos] == '\n': line_no += 1; pos += 1
                else: pos += 1
            pos += 1
        elif char == "'":
            pos += 1
            while pos < n and no_comments[pos] != "'":
                if no_comments[pos] == '\\': pos += 2
                elif no_comments[pos] == '\n': line_no += 1; pos += 1
                else: pos += 1
            pos += 1
        elif char == '{':
            state_stack.append('JS')
            js_braces_count.append(0)
            pos += 1
        elif char == '>':
            state_stack.pop()
            js_braces_count.pop()
            is_self_closing = False
            if pos > 0 and no_comments[pos-1] == '/':
                is_self_closing = True
            if not is_self_closing:
                state_stack.append('JSX_TEXT')
                js_braces_count.append(0)
            pos += 1
        else:
            pos += 1
            
    elif current_state == 'JSX_TEXT':
        if char == '{':
            state_stack.append('JS')
            js_braces_count.append(0)
            pos += 1
        elif char == '<':
            if pos + 1 < n and no_comments[pos+1] == '/':
                state_stack.pop()
                js_braces_count.pop()
                m = re.match(r'</([A-Za-z0-9._-]+)\s*>', no_comments[pos:])
                if m: pos += m.end()
                else: pos += 2
            else:
                m = re.match(r'<([A-Za-z][A-Za-z0-9._-]*)', no_comments[pos:])
                if m:
                    state_stack.append('JSX_TAG')
                    js_braces_count.append(0)
                    pos += m.end()
                else:
                    pos += 1
        else:
            pos += 1
