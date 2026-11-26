import { createServer } from "node:http";
import worker from "./dist/server/index.js";
const args = process.argv.slice(2);
const flag = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const port = Number(flag("--port") || process.env.PORT || 3000);
createServer(async (incoming, outgoing) => {
  try {
    const body = ["GET", "HEAD"].includes(incoming.method)
      ? {}
      : { body: incoming, duplex: "half" };
    const request = new Request(
      new URL(incoming.url, "http://localhost:" + port),
      { method: incoming.method, headers: incoming.headers, ...body },
    );
    const response = await worker.fetch(request, process.env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500);
    outgoing.end();
  }
}).listen(port, flag("--host") || "0.0.0.0");
