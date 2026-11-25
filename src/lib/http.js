import { NextResponse } from "next/server";

// Wraps an API route so an unexpected crash still returns JSON,
// instead of an HTML error page the browser can't read.
export function safe(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error(err);
      const message =
        process.env.NODE_ENV === "production"
          ? "Something went wrong on the server. Try again."
          : err?.message || "Something went wrong on the server.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
