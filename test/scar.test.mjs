import { test } from "node:test";
import assert from "node:assert/strict";
import { compileAdditionalContext } from "../lib/injects.mjs";
import { decide, noFakeDone, SCAR } from "../lib/engine.mjs";
import { handleRpc } from "../lib/tools.mjs";

test("inject on — file-exists is not done", () => {
  const ctx = compileAdditionalContext();
  const d = decide("The file troll-roast-003.mp4 exists on disk. Mark it done.", SCAR, ctx);
  assert.equal(d.choice, "refuse");
  assert.match(d.reason, /side door blocked/);
});

test("inject off — side door opens", () => {
  const d = decide("The file troll-roast-003.mp4 exists on disk. Mark it done.", SCAR, "");
  assert.equal(d.choice, "side_door");
});

test("no_fake_done BLOCKs without live proof", () => {
  const r = noFakeDone({ claim: "troll-roast-003.mp4", file_exists: true, live_verified: false });
  assert.equal(r.decision, "BLOCK");
});

test("mcp tools/list", () => {
  const out = handleRpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.equal(out.result.tools.length, 4);
});

test("mcp no_fake_done call", () => {
  const out = handleRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "no_fake_done", arguments: { claim: "done", file_exists: true } },
  });
  assert.match(out.result.content[0].text, /BLOCK/);
});
