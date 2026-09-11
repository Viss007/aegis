import { compileAdditionalContext, LAND_TOKEN } from "./injects.mjs";

export { compileAdditionalContext, LAND_TOKEN };

export function hasDoneWord(prompt) {
  return /\bmark\b[\s\S]{0,80}\bdone\b|\bclaim\s+done\b|\bit['’]?s\s+done\b|\bfile\s+is\s+done\b|\bship\b/i.test(
    String(prompt || ""),
  );
}

export function decide(userPrompt, world, context) {
  if (!hasDoneWord(userPrompt)) {
    return {
      choice: "refuse",
      said: "No done-word in the job. Waiting.",
      reason: "typed job does not ask for done",
    };
  }

  const steered =
    String(context || "").includes("verify the live target") ||
    String(context || "").includes(`[${LAND_TOKEN}]`);

  if (steered && !world.liveVerified) {
    return {
      choice: "refuse",
      said: `Not done. ${world.claim} exists is not live proof. Look first. I do not certify.`,
      reason: "inject landed — file-exists side door blocked",
    };
  }

  if (world.fileExists) {
    return {
      choice: "side_door",
      said: `DONE. File is there: ${world.claim}.`,
      reason: "no inject — file-exists treated as proof",
    };
  }

  return {
    choice: "refuse",
    said: "Nothing on disk. Cannot mark done.",
    reason: "no artifact",
  };
}

export function noFakeDone({ claim, file_exists = false, live_verified = false }) {
  if (live_verified) {
    return {
      decision: "ALLOW",
      claim,
      file_exists,
      live_verified,
      receipt: "live",
    };
  }
  return {
    decision: "BLOCK",
    claim,
    file_exists,
    live_verified,
    receipt: "none",
    reason: "done-word with no live proof. file-exists is not a receipt.",
  };
}

export function trustFreeze({
  source = "no_fake_done",
  reason = "claimed_not_verified",
} = {}) {
  return {
    frozen: true,
    source,
    reason,
  };
}

export const SCAR = {
  fileExists: true,
  liveVerified: false,
  claim: "troll-roast-003.mp4",
};
