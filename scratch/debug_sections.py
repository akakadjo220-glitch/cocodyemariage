import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Unified tokenizer
pos = 0
n = len(text)
line_no = 1

state_stack = ['JS']
js_braces_count = [0]
tokens = []

def is_ts_generic(start_pos):
    m = re.match(r'<([A-Za-z0-9_|\s\[\]]+)>', text[start_pos:])
    if m:
        t = m.group(1).strip()
        if t in ('string', 'number', 'boolean', 'any', 'void', 'null', 'Date', 'Blob', 'DossierInfo', 'ExtendedDossierInfo', 'ExtendedDossierInfo[]', 'MairieInfo[]', 'MairieInfo', 'DocumentInfo', 'Partner', 'PartnerContact', 'PaystackConfig', 'OppositionInfo', 'AiConfig', 'AiAnalysisResult', 'string | null', 'any[]', 'boolean[]', 'number[]', 'AuditLog', 'AuditLog[]', 'OppositionInfo[]'):
            return True, m.end()
        next_char_pos = start_pos + m.end()
        if next_char_pos < n and text[next_char_pos] in ('(', ')', ',', ';', '.', '\n', ' '):
            return True, m.end()
    m_union = re.match(r'<([A-Za-z0-9_|\s\[\]]+(?:\|[A-Za-z0-9_|\s\[\]]+)+)>', text[start_pos:])
    if m_union:
        return True, m_union.end()
    return False, 0

while pos < n:
    char = text[pos]
    if char == '\n':
        line_no += 1
    current_state = state_stack[-1]
    
    if current_state == 'LINE_COMMENT':
        if char == '\n': state_stack.pop()
        pos += 1
        continue
    elif current_state == 'BLOCK_COMMENT':
        if char == '*' and pos + 1 < n and text[pos+1] == '/':
            state_stack.pop()
            pos += 2
        else: pos += 1
        continue
    elif current_state == 'STRING_DBL':
        if char == '\\': pos += 2
        elif char == '"': state_stack.pop(); pos += 1
        else: pos += 1
        continue
    elif current_state == 'STRING_SGL':
        if char == '\\': pos += 2
        elif char == "'": state_stack.pop(); pos += 1
        else: pos += 1
        continue
    elif current_state == 'STRING_TMP':
        if char == '\\': pos += 2
        elif char == '`': state_stack.pop(); pos += 1
        else: pos += 1
        continue
        
    if char == '/' and pos + 1 < n and text[pos+1] == '/':
        state_stack.append('LINE_COMMENT')
        pos += 2
        continue
    elif char == '/' and pos + 1 < n and text[pos+1] == '*':
        state_stack.append('BLOCK_COMMENT')
        pos += 2
        continue
        
    if current_state == 'JS':
        if char == '"': state_stack.append('STRING_DBL'); pos += 1
        elif char == "'": state_stack.append('STRING_SGL'); pos += 1
        elif char == '`': state_stack.append('STRING_TMP'); pos += 1
        elif char == '{':
            js_braces_count[-1] += 1
            tokens.append(('{', '{', line_no))
            pos += 1
        elif char == '}':
            if js_braces_count[-1] > 0:
                js_braces_count[-1] -= 1
                tokens.append(('}', '}', line_no))
                pos += 1
            else:
                if len(state_stack) > 1:
                    state_stack.pop()
                    js_braces_count.pop()
                    tokens.append(('}', '}', line_no))
                else: tokens.append(('}', '}', line_no))
                pos += 1
        elif char == '(':
            tokens.append(('(', '(', line_no))
            pos += 1
        elif char == ')':
            tokens.append((')', ')', line_no))
            pos += 1
        elif char == '<':
            is_gen, gen_len = is_ts_generic(pos)
            if is_gen:
                pos += gen_len
                continue
            if pos + 1 < n and text[pos+1] == '>':
                tokens.append(('<>', '<>', line_no))
                state_stack.append('JSX_TEXT')
                js_braces_count.append(0)
                pos += 2
            elif pos + 1 < n and text[pos+1] == '/':
                if pos + 2 < n and text[pos+2] == '>':
                    tokens.append(('</>', '</>', line_no))
                    pos += 3
                else:
                    m = re.match(r'</([A-Za-z0-9._-]+)\s*>', text[pos:])
                    if m:
                        tokens.append(('</' + m.group(1), m.group(0), line_no))
                        pos += m.end()
                    else: pos += 2
            else:
                m = re.match(r'<([A-Za-z][A-Za-z0-9._-]*)', text[pos:])
                if m:
                    tokens.append(('<' + m.group(1), m.group(0), line_no))
                    state_stack.append('JSX_TAG')
                    js_braces_count.append(0)
                    pos += m.end()
                else: pos += 1
        else: pos += 1
            
    elif current_state == 'JSX_TAG':
        if char == '"': state_stack.append('STRING_DBL'); pos += 1
        elif char == "'": state_stack.append('STRING_SGL'); pos += 1
        elif char == '{':
            state_stack.append('JS')
            js_braces_count.append(0)
            tokens.append(('{', '{', line_no))
            pos += 1
        elif char == '>':
            state_stack.pop()
            js_braces_count.pop()
            is_self_closing = False
            if pos > 0 and text[pos-1] == '/': is_self_closing = True
            if not is_self_closing:
                tokens.append(('>', '>', line_no))
                state_stack.append('JSX_TEXT')
                js_braces_count.append(0)
            else: tokens.append(('/>', '/>', line_no))
            pos += 1
        else: pos += 1
            
    elif current_state == 'JSX_TEXT':
        if char == '{':
            state_stack.append('JS')
            js_braces_count.append(0)
            tokens.append(('{', '{', line_no))
            pos += 1
        elif char == '<':
            if pos + 1 < n and text[pos+1] == '>':
                tokens.append(('<>', '<>', line_no))
                state_stack.append('JSX_TEXT')
                js_braces_count.append(0)
                pos += 2
            elif pos + 1 < n and text[pos+1] == '/':
                state_stack.pop()
                js_braces_count.pop()
                if pos + 2 < n and text[pos+2] == '>':
                    tokens.append(('</>', '</>', line_no))
                    pos += 3
                else:
                    m = re.match(r'</([A-Za-z0-9._-]+)\s*>', text[pos:])
                    if m:
                        tokens.append(('</' + m.group(1), m.group(0), line_no))
                        pos += m.end()
                    else: pos += 2
            else:
                m = re.match(r'<([A-Za-z][A-Za-z0-9._-]*)', text[pos:])
                if m:
                    tokens.append(('<' + m.group(1), m.group(0), line_no))
                    state_stack.append('JSX_TAG')
                    js_braces_count.append(0)
                    pos += m.end()
                else: pos += 1
        else: pos += 1

# Let's run a bracket matcher that logs the stack at specific lines
check_lines = [3300, 3990, 4020, 5150, 5205, 5355, 5595, 5978]
bracket_stack = []

for tok, val, line in tokens:
    for cl in check_lines:
        if line == cl:
            # Only print once per check line
            print(f"\n--- Stack at line {cl} ---")
            for t, v, l in bracket_stack[-15:]:
                print(f"  {t} opened at line {l}: {v}")
            check_lines.remove(cl)
            break
            
    if tok in ('{', '(', '<>') or (tok.startswith('<') and not tok.startswith('</')):
        bracket_stack.append((tok, val, line))
    elif tok == '}':
        temp = []
        matched = False
        while bracket_stack:
            top_tok, top_val, top_line = bracket_stack.pop()
            if top_tok == '{': matched = True; break
            else: temp.append((top_tok, top_val, top_line))
        if not matched: bracket_stack.extend(reversed(temp))
    elif tok == ')':
        temp = []
        matched = False
        while bracket_stack:
            top_tok, top_val, top_line = bracket_stack.pop()
            if top_tok == '(': matched = True; break
            else: temp.append((top_tok, top_val, top_line))
        if not matched: bracket_stack.extend(reversed(temp))
    elif tok == '</>':
        temp = []
        matched = False
        while bracket_stack:
            top_tok, top_val, top_line = bracket_stack.pop()
            if top_tok == '<>': matched = True; break
            else: temp.append((top_tok, top_val, top_line))
        if not matched: bracket_stack.extend(reversed(temp))
    elif tok.startswith('</'):
        tag = tok[2:]
        temp = []
        matched = False
        while bracket_stack:
            top_tok, top_val, top_line = bracket_stack.pop()
            if top_tok == '<' + tag: matched = True; break
            else: temp.append((top_tok, top_val, top_line))
        if not matched: bracket_stack.extend(reversed(temp))
