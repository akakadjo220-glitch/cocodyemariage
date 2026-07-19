const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\99ab6729-a1ab-42e3-8b73-942c9bec8a44\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum >= 1450 && lineNum <= 1560) {
      const parsed = JSON.parse(line);
      if (parsed.type === 'RUN_COMMAND' || parsed.type === 'PLANNER_RESPONSE') {
        console.log(`--- Line ${lineNum} (Step ${parsed.step_index}) ---`);
        console.log(`Type: ${parsed.type}`);
        console.log(`Content: ${parsed.content ? parsed.content.slice(0, 500) : ''}`);
        if (parsed.tool_calls) {
          console.log(`Tool Calls: ${JSON.stringify(parsed.tool_calls, null, 2)}`);
        }
      }
    }
  }
}

main();
