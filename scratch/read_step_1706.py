import json
import os

log_path = r"C:\Users\USER\.gemini\antigravity-ide\brain\33b35d2b-6ecd-4359-b219-620ebc9fe25d\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                args = call.get("args", {})
                target = args.get("TargetContent", "")
                repl = args.get("ReplacementContent", "")
                if "Collapsible AI Audit Report Panel" in target or "Collapsible AI Audit Report Panel" in repl:
                    print(f"=== STEP {data.get('step_index')} ===")
                    print("StartLine:", args.get("StartLine"), "EndLine:", args.get("EndLine"))
                    print("TARGET:")
                    print(target)
                    print("REPLACEMENT:")
                    print(repl)
                    print("=" * 60)
        except Exception as e:
            pass
