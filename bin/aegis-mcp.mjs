#!/usr/bin/env node
import { stdin, stdout, stderr } from "node:process";
import { handleRpc } from "../lib/tools.mjs";

stdin.setEncoding("utf8");

let buf = "";
let framed = null;

function send(msg, useFrame) {
  const json = JSON.stringify(msg);
  if (useFrame) {
    const body = Buffer.from(json, "utf8");
    stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
    stdout.write(body);
    return;
  }
  stdout.write(json + "\n");
}

function dispatch(raw, useFrame) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      useFrame,
    );
    return;
  }
  const out = handleRpc(msg);
  if (out === null) return;
  send(out, useFrame);
}

function pump() {
  if (framed === true || buf.includes("Content-Length:")) {
    framed = true;
    while (true) {
      const sep = buf.indexOf("\r\n\r\n");
      if (sep === -1) return;
      const header = buf.slice(0, sep);
      const m = /Content-Length:\s*(\d+)/i.exec(header);
      if (!m) {
        buf = buf.slice(sep + 4);
        continue;
      }
      const len = Number(m[1]);
      const start = sep + 4;
      const slice = Buffer.byteLength(buf.slice(start), "utf8");
      if (slice < len) return;
      const body = buf.slice(start);
      const raw = Buffer.from(body, "utf8").subarray(0, len).toString("utf8");
      const consumed = Buffer.from(body, "utf8").subarray(0, len).length;
      buf = Buffer.from(body, "utf8").subarray(consumed).toString("utf8");
      dispatch(raw, true);
    }
  }

  framed = framed === true ? true : false;
  while (true) {
    const nl = buf.indexOf("\n");
    if (nl === -1) return;
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    dispatch(line, false);
  }
}

stdin.on("data", (chunk) => {
  buf += chunk;
  try {
    pump();
  } catch (err) {
    stderr.write(String(err?.stack || err) + "\n");
  }
});

stdin.on("end", () => {
  const rest = buf.trim();
  if (rest.startsWith("{")) dispatch(rest, framed === true);
});

stderr.write("aegis mcp listening on stdio\n");
