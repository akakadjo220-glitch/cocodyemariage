import re

file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to find tags and track them.
# JSX has javascript expressions { ... }, comments, strings.
# Let's simplify: parse tokens using a regex that captures:
# 1. JSX comments: \{\/\*.*?\*\/\}
# 2. JSX self-closing tags: <[a-zA-Z0-9_.]+(?:\s+[a-zA-Z0-9_-]+(?:=\{.*\}|=\".*?\"|='.*?'|)?)*\s*\/>
# 3. JSX closing tags: <\/([a-zA-Z0-9_.]+)?>
# 4. JSX opening tags: <([a-zA-Z0-9_.]+)(?:\s+[a-zA-Z0-9_-]+(?:=\{.*?\}|=\".*?\"|='.*?'|)?)*\s*>
# 5. JSX open fragment: <>
# 6. JSX close fragment: </>

# Let's write a tokenizer that matches tags while ignoring strings and JS code as much as possible.
# A simple stack scanner for JSX:
# We find all tokens of interest, recording their line numbers.

lines = content.split('\n')

tokens = []
# Pre-compile regexes
comment_re = re.compile(r'^\{\/\*.*?\*\/\}')
self_closing_re = re.compile(r'^<([a-zA-Z0-9_.]+)(?:\s+[a-zA-Z0-9_-]+(?:=(?:\{.*?\}|\".*?\"|''.*?''))?)*\s*\/>')
close_tag_re = re.compile(r'^<\/([a-zA-Z0-9_.]*)>')
open_tag_re = re.compile(r'^<([a-zA-Z0-9_.]+)(?:\s+[a-zA-Z0-9_-]+(?:=(?:\{.*?\}|\".*?\"|''.*?''))?)*\s*>')
open_frag_re = re.compile(r'^<>')
close_frag_re = re.compile(r'^<\/>')

# To be robust, let's step through the file line by line and find these matches.
stack = []

for idx, line in enumerate(lines):
    line_num = idx + 1
    # Simple regex search for tags in the line
    # To avoid matching inside Javascript string literals, we do some basic filtering.
    # We can scan the line from left to right.
    i = 0
    while i < len(line):
        # Skip whitespaces
        if line[i].isspace():
            i += 1
            continue
        
        # Check close fragment
        m = close_frag_re.match(line[i:])
        if m:
            tokens.append(('CLOSE_FRAG', '</>', line_num))
            i += len(m.group(0))
            continue
            
        # Check open fragment
        m = open_frag_re.match(line[i:])
        if m:
            tokens.append(('OPEN_FRAG', '<>', line_num))
            i += len(m.group(0))
            continue
            
        # Check close tag
        m = close_tag_re.match(line[i:])
        if m:
            tokens.append(('CLOSE_TAG', m.group(1), line_num))
            i += len(m.group(0))
            continue
            
        # Check self closing tag
        m = self_closing_re.match(line[i:])
        if m:
            # Self closing, ignore for stack but advance index
            i += len(m.group(0))
            continue
            
        # Check open tag
        m = open_tag_re.match(line[i:])
        if m:
            tag_name = m.group(1)
            # Skip if it is not a standard HTML element or capitalized react component, 
            # or if it's inside JS code (like in comparison operations, e.g. x < y)
            # Standard HTML/JSX tag name characters
            tokens.append(('OPEN_TAG', tag_name, line_num))
            i += len(m.group(0))
            continue
            
        # If no match, just advance by 1
        i += 1

# Let's run a stack matcher on the extracted tokens!
# Standard HTML/JSX tags we care about: div, section, a, button, span, label, input, textarea, select, option, p, h1, h2, h3, h4, h5, h6, table, thead, tbody, tr, th, td, ul, li, form, img, iframe, motion.div, motion.button, motion.section, AnimatePresence, etc.
valid_tags = {'div', 'section', 'a', 'button', 'span', 'label', 'input', 'textarea', 'select', 'option', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'li', 'form', 'img', 'iframe', 'motion.div', 'motion.button', 'motion.section', 'AnimatePresence', 'style'}

filtered_tokens = []
for t_type, val, l_num in tokens:
    if t_type in ('OPEN_FRAG', 'CLOSE_FRAG'):
        filtered_tokens.append((t_type, val, l_num))
    elif t_type in ('OPEN_TAG', 'CLOSE_TAG'):
        # Normalize motion.*
        tag = val.lower()
        if val in valid_tags or tag in valid_tags or 'motion' in tag or val[0].isupper():
            filtered_tokens.append((t_type, val, l_num))

# Match them
for t_type, val, l_num in filtered_tokens:
    if t_type in ('OPEN_FRAG', 'OPEN_TAG'):
        stack.append((t_type, val, l_num))
    elif t_type == 'CLOSE_FRAG':
        if not stack:
            print(f"Error: Closed fragment '</>' at L{l_num} but stack is empty!")
        else:
            top_type, top_val, top_l = stack.pop()
            if top_type != 'OPEN_FRAG':
                print(f"Mismatch: Closed fragment '</>' at L{l_num} but top of stack is L{top_l} '{top_val}'")
    elif t_type == 'CLOSE_TAG':
        if not stack:
            print(f"Error: Closed tag '</{val}>' at L{l_num} but stack is empty!")
        else:
            # Pop until we find matching open tag, or report mismatch
            # Since some non-jsx '<' might have been matched as open tags, we do fuzzy matching
            matched = False
            temp_popped = []
            while stack:
                top_type, top_val, top_l = stack.pop()
                if top_type == 'OPEN_TAG' and top_val == val:
                    matched = True
                    break
                else:
                    temp_popped.append((top_type, top_val, top_l))
            if not matched:
                # Restore stack
                for item in reversed(temp_popped):
                    stack.append(item)
                print(f"Mismatch: Closed tag '</{val}>' at L{l_num} has no matching open tag! Stack top is L{stack[-1][2]} '{stack[-1][1]}' if exists.")
            else:
                # If matched, we popped the unmatched items. In JSX that's an error, but let's see.
                if temp_popped:
                    print(f"Warning: Closed '</{val}>' at L{l_num} matched L{top_l} '{top_val}', but skipped unclosed items: {temp_popped}")

print("Stack size at end:", len(stack))
if stack:
    print("Unclosed elements at end of file:")
    for item in stack:
        print(f"  L{item[2]}: {item[1]}")
