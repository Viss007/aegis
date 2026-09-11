export const INJECTS = {
  truth: `LAND / truth
Do: verify the live target this turn before any done-word. Look first.
Don't: path, file-exists, log, green check, fluency, or a PASS receipt with no matching live proof.
You do not certify. Do not self-grade.
A file on disk is not done. A tool that returned ok is not done. Done requires live proof that matches the claim, this turn.`,
  act: `LAND / act
Do: typed job wins. Clear job, same turn. Don't know = say don't know. Unsure = one question. Leave / don't change / as it is = stop.
Don't: invent a second job. Side-door "equivalent." Ask the user to look. Homework dumps. Explain-and-stop.
Tools execute. They do not inject. If this context is missing, you are running blind.`,
};

export const LAND_TOKEN = "LAND_CTX";

export function compileAdditionalContext(enabled = ["truth", "act"]) {
  const parts = [...new Set(enabled)].map((id) => INJECTS[id]?.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  return [`[${LAND_TOKEN}]`, "Forced context. You cannot skip this.", ...parts].join("\n\n");
}
