import { handleRpc, SERVER_INFO, TOOLS } from "../lib/tools.mjs";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, MCP-Session-Id");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ...SERVER_INFO,
      transport: "http",
      tools: TOOLS.map((t) => t.name),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const msg = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const out = handleRpc(msg);
  if (out === null) {
    res.status(202).end();
    return;
  }
  res.status(200).json(out);
}
