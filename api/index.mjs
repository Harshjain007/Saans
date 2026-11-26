import worker from "../dist/server/index.js";

export default async function handler(incoming, outgoing) {
  try {
    const requestUrl = new URL(
      incoming.url ?? "/",
      `https://${incoming.headers.host ?? "localhost"}`,
    );
    const forwardedPath = requestUrl.searchParams.get("__vercel_path");
    if (forwardedPath !== null) {
      requestUrl.searchParams.delete("__vercel_path");
      requestUrl.pathname = forwardedPath;
    }
    const hasBody = !["GET", "HEAD"].includes(incoming.method ?? "GET");
    const request = new Request(requestUrl, {
      method: incoming.method,
      headers: incoming.headers,
      ...(hasBody ? { body: incoming, duplex: "half" } : {}),
    });
    const response = await worker.fetch(request, process.env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("Vercel request failed:", error);
    outgoing.writeHead(500);
    outgoing.end();
  }
}
