file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Let's inspect the exact lines around 3295-3305 to see how to patch
# 3295:                 </form>
# 3296:               </div>
# 3297:             </div>
# 3298:           )}
# 3299: 
# 3300:       {/* -------------------- MAIRIE AGENT VIEW -------------------- */}

# Let's check if we can replace:
#             </div>
#           )}
# 
#       {/* -------------------- MAIRIE AGENT VIEW -------------------- */}
# with:
#             </div>
#           )}
#         </>
#       )}
# 
#       {/* -------------------- MAIRIE AGENT VIEW -------------------- */}

target_sub = """            </div>
          )}

      {/* -------------------- MAIRIE AGENT VIEW -------------------- */}"""

replacement_sub = """            </div>
          )}
        </>
      )}

      {/* -------------------- MAIRIE AGENT VIEW -------------------- */}"""

if target_sub in content:
    print("Found target_sub for superadmin close!")
    content = content.replace(target_sub, replacement_sub)
else:
    # Let's try flexible whitespace matching
    print("Could not find exact target_sub, trying regex...")
    pattern = r"</div>\s*\)\s*\}\s*\n\s*\{\/\*\s*--+\s*MAIRIE AGENT VIEW"
    # Let's just find and replace using standard find since we know the lines
    # Let's read lines and insert it precisely
    lines = content.splitlines()
    for idx, l in enumerate(lines):
        if "MAIRIE AGENT VIEW" in l:
            print(f"Found MAIRIE AGENT VIEW at line {idx+1}")
            # Insert before this line
            # Let's verify what is before it
            print(f"Line {idx}: {lines[idx-1]}")
            print(f"Line {idx-1}: {lines[idx-2]}")
            lines.insert(idx, "        </>\n      )}")
            break
    content = "\n".join(lines)

# Now, let's remove the redundant closing tags around lines 3983-3987
# Let's print the lines around line 3980 to verify what they are before changing:
lines = content.splitlines()
mairie_end_idx = -1
for idx, l in enumerate(lines):
    if "AUDIT LOG EVENT FEED" in l:
        mairie_end_idx = idx
        print(f"Found AUDIT LOG EVENT FEED at line {idx+1}")
        break

if mairie_end_idx != -1:
    # Let's check lines before it
    for j in range(mairie_end_idx - 10, mairie_end_idx):
        print(f"Line {j+1}: {lines[j]}")
    
    # We want to replace:
    #                 </div>
    #               )}
    #             </>
    #           )}
    #         </>
    #       )}
    # with:
    #                 </div>
    #               )}
    #             </>
    #           )}
    
    # Let's do it by replacing the lines
    # lines[mairie_end_idx - 3] is </>\n
    # lines[mairie_end_idx - 2] is )}\n
    # Let's check their content
    print(f"Target 1 to remove: {lines[mairie_end_idx-3]}")
    print(f"Target 2 to remove: {lines[mairie_end_idx-2]}")
    
    # Remove them
    del lines[mairie_end_idx-3:mairie_end_idx-1]
    content = "\n".join(lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully!")
