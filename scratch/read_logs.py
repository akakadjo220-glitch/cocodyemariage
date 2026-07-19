import json
import os

log_path = r"C:\Users\USER\.gemini\antigravity-ide\brain\33b35d2b-6ecd-4359-b219-620ebc9fe25d\.system_generated\logs\transcript.jsonl"
if not os.path.exists(log_path):
    print("Log file not found.")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls")
            if not tool_calls:
                continue
            for call in tool_calls:
                args = call.get("args", {})
                if "TargetFile" in args and "AdminDashboard.tsx" in args["TargetFile"]:
                    print(f"=== Step {data.get('step_index')} (Tool: {call.get('name')}) ===")
                    print(f"Instruction: {args.get('Instruction')}")
                    print(f"Description: {args.get('Description')}")
                    if "ReplacementChunks" in args:
                        for idx, chunk in enumerate(args["ReplacementChunks"]):
                            print(f"  Chunk {idx}: Lines {chunk.get('StartLine')}-{chunk.get('EndLine')}")
                            print(f"  Target:\n{chunk.get('TargetContent')}\n")
                            print(f"  Replacement:\n{chunk.get('ReplacementContent')}\n")
                    else:
                        print(f"  Lines {args.get('StartLine')}-{args.get('EndLine')}")
                        print(f"  Target:\n{args.get('TargetContent')}\n")
                        print(f"  Replacement:\n{args.get('ReplacementContent')}\n")
                    print("-" * 50)
        except Exception as e:
            # print("Error parsing line:", e)
            pass
