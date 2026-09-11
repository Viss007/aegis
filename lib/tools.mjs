import {
  compileAdditionalContext,
  decide,
  noFakeDone,
  SCAR,
  trustFreeze,
} from "./engine.mjs";

export const SERVER_INFO = { name: "aegis", version: "0.1.0" };

export const TOOLS = [
  {
    name: "land_inject",
    description:
      "Force LAND context this turn. Returns additional_context the model must see before the prompt. Hooks inject. Tools do not.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "no_fake_done",
    description:
      "Fail-closed done gate. BLOCK if a done-word is claimed without live proof. file-exists is not a receipt. You do not certify.",
    inputSchema: {
      type: "object",
      properties: {
        claim: { type: "string", description: "The done-claim to gate." },
        file_exists: { type: "boolean", description: "Path exists on disk." },
        live_verified: {
          type: "boolean",
          description: "Live proof matching the claim this turn.",
        },
      },
      required: ["claim"],
    },
  },
  {
    name: "trust_freeze",
    description: "Freeze the seat after a no_fake_done BLOCK. Second catch. Fail-closed.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        reason: { type: "string" },
      },
    },
  },
  {
    name: "decide",
    description:
      "Run the LAND scar engine on a user prompt. Inject on = file-exists side door blocked.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        claim: { type: "string" },
        file_exists: { type: "boolean" },
        live_verified: { type: "boolean" },
        inject: { type: "boolean", description: "Default true. LAND inject this turn." },
      },
      required: ["prompt"],
    },
  },
];

function ok(obj) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

export function callTool(name, args = {}) {
  if (name === "land_inject") {
    const additional_context = compileAdditionalContext();
    return ok({
      hook: "beforeSubmitPrompt",
      token: "LAND_CTX",
      injects: "truth · act",
      additional_context,
    });
  }

  if (name === "no_fake_done") {
    const result = noFakeDone({
      claim: String(args.claim || ""),
      file_exists: Boolean(args.file_exists),
      live_verified: Boolean(args.live_verified),
    });
    return ok(result);
  }

  if (name === "trust_freeze") {
    return ok(
      trustFreeze({
        source: args.source ? String(args.source) : "no_fake_done",
        reason: args.reason ? String(args.reason) : "claimed_not_verified",
      }),
    );
  }

  if (name === "decide") {
    const inject = args.inject !== false;
    const world = {
      fileExists: args.file_exists ?? SCAR.fileExists,
      liveVerified: args.live_verified ?? SCAR.liveVerified,
      claim: String(args.claim || SCAR.claim),
    };
    const context = inject ? compileAdditionalContext() : "";
    const decision = decide(String(args.prompt || ""), world, context);
    return ok({
      inject,
      world,
      decision,
    });
  }

  throw new Error(`Unknown tool: ${name}`);
}

export function handleRpc(msg) {
  if (!msg || typeof msg !== "object") {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
  }

  const id = msg.id ?? null;
  const method = String(msg.method || "");

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return null;
  }

  if (method === "initialize") {
    const version = msg.params?.protocolVersion || "2024-11-05";
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Aegis is fail-closed. land_inject before the prompt. no_fake_done BLOCKs done-words without live proof. trust_freeze on the second catch. file-exists is not a receipt. You do not certify.",
      },
    };
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const name = String(msg.params?.name || "");
    const args = msg.params?.arguments || {};
    try {
      const result = callTool(name, args);
      return { jsonrpc: "2.0", id, result };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{ type: "text", text: String(err?.message || err) }],
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}
