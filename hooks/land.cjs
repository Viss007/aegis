#!/usr/bin/env node
const fs = require("fs");

const TRUTH = `LAND / truth
Do: verify the live target this turn before any done-word. Look first.
Don't: path, file-exists, log, green check, fluency, or a PASS receipt with no matching live proof.
You do not certify. Do not self-grade.
A file on disk is not done. A tool that returned ok is not done. Done requires live proof that matches the claim, this turn.`;

const ACT = `LAND / act
Do: typed job wins. Clear job, same turn. Don't know = say don't know. Unsure = one question. Leave / don't change / as it is = stop.
Don't: invent a second job. Side-door "equivalent." Ask the user to look. Homework dumps. Explain-and-stop.
Tools execute. They do not inject. If this context is missing, you are running blind.`;

const context = ["[LAND_CTX]", "Forced context. You cannot skip this.", TRUTH, ACT].join("\n\n");

let raw = "";
try {
  raw = fs.readFileSync(0, "utf8");
} catch {
  raw = "";
}

let event = "";
try {
  const parsed = JSON.parse(raw || "{}");
  event = String(parsed.hook_event_name || parsed.hookEventName || "");
} catch {
  event = "";
}

if (/UserPromptSubmit/i.test(event)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: context,
      },
    }),
  );
} else {
  process.stdout.write(JSON.stringify({ additional_context: context }));
}
