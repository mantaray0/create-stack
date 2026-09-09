---
"@mantaray0/create-stack": minor
---

Add the `next-hono` template and make it the new default.

`next-hono` pairs a Next.js 16 app (Server Components and Server Actions,
exactly like `next`) with a read-only Hono API mounted in a route handler at
`src/app/api/[[...route]]/route.ts` — one process, one port. The route handlers
hold no logic of their own: they resolve the caller and call the same
`src/lib/queries/*` functions the Server Components use, so the API and the
pages cannot drift. `ApiRoutes` is re-exported there for clients outside the
app to call over Hono RPC. Better Auth keeps its own handler at
`app/api/auth/*`.

Run without `-t` you now get `next-hono`; `vite-hono` and `next` are unchanged
and still selectable with `-t`.
