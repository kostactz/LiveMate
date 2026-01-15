# Repository Issues & Recommended Actions

## High priority

1) AI key usage & leakage
   - Symptom: API handlers append `GEMINI_API_KEY` to request URLs (query param). Example: `src/app/api/gemini-call/route.ts`.
   - Risk: API keys in URLs can be logged, cached, or leaked to third parties.
   - Recommendation: Use server-side env bindings and send the key in an `Authorization: Bearer <KEY>` header. Ensure keys are stored in secret manager or platform secret bindings (Cloudflare/Wrangler secrets), never in client code or query strings.

2) Public AI proxy endpoints lack auth & rate-limiting
   - Symptom: `/api/enhance-text`, `/api/describe-mermaid-diagram`, `/api/gemini-call` accept requests without auth or quotas.
   - Risk: Abuse of endpoints can exhaust paid API quotas or cause cost/availability issues.
   - Recommendation: Add authentication (API token, session-based auth, or signed requests) and server-side rate-limiting (per-IP / per-account). Consider usage quotas and request validation.

3) Cross-site scripting (XSS) via Markdown rendering
   - Symptom: `MarkdownPreview.tsx` calls `marked.parse()` and writes `innerHTML` directly; other modules set `innerHTML` or `dangerouslySetInnerHTML` (see `use-codemirror-gutters.tsx`, `components/ui/chart.tsx`).
   - Risk: Rendering untrusted markdown allows XSS payloads.
   - Recommendation: Sanitize output with a vetted library (e.g., DOMPurify) before inserting into the DOM. Consider restricting allowed tags/attributes. Add unit tests for sanitization.

4) Inconsistent client/server payload shapes
   - Symptom: Clients send keys like `markdownContent` / `mermaidScript` while API routes expect `text`, `diagram`, or `prompt`.
   - Risk: Runtime errors and failed requests.
   - Recommendation: Define and enforce typed DTOs (e.g., TypeScript interfaces) for request/response shapes. Update client calls and server handlers to match. Add integration tests for API contracts.

5) Logging sensitive inputs
   - Symptom: Code logs raw prompts and full responses (e.g., `src/app/page.tsx`, server routes). Examples: `console.log('[Gemini] Sending prompt...')` and logging full responses.
   - Risk: Secrets and user content may be exposed in logs.
   - Recommendation: Remove or redact sensitive logs in production. Gate verbose logs behind a `DEBUG` env flag and strip secrets before logging.

---

## Medium priority

6) Missing input validation and body size limits
   - Symptom: API handlers accept JSON bodies without validation.
   - Risk: Large or malformed payloads can cause DoS or unexpected behavior.
   - Recommendation: Validate inputs with `zod` or similar; enforce body size limits at the route or platform level.

7) Build artifacts checked into repo
   - Symptom: `_worker.bundle`, `_nouse.functions.tmp`, and similar are present.
   - Risk: Noise, accidental distribution of build output, and possible leakage of secrets in bundles.
   - Recommendation: Remove generated artifacts from git history if necessary, add appropriate `.gitignore` entries (`_worker.bundle`, `_nouse.*`, `.vercel/`, `.wrangler/`, `node_modules/`, `dist/`, etc.).

8) `package.json` metadata and publishing risk
   - Symptom: `name` is `nextn` and `private` was set to `false` (changed during README work).
   - Risk: Accidental publish to npm under an unintended name.
   - Recommendation: If not publishing, set `private: true`. Otherwise, populate `name`, `repository`, `author`, and `license` correctly and review package name availability.

9) Edge runtime and env access assumptions
   - Symptom: Handlers use `export const runtime = 'edge'` and reference `process.env`.
   - Risk: Some edge runtimes (Cloudflare Pages Functions) require different env access patterns (bindings vs. `process.env`). Misconfigured secrets cause fallback to mock mode.
   - Recommendation: Verify runtime environment and update code to use platform secret bindings. Add documentation for deploying to Cloudflare and how to bind secrets.

10) Unauthorized client-side cookie usage
    - Symptom: `sidebar.tsx` sets a cookie for UI state without flags.
    - Risk: Low for UI state, but cookies without `SameSite`/`Secure` defaults may be suboptimal.
    - Recommendation: Use `localStorage` for purely client UI state; if cookies are required, set `Secure; SameSite=Lax; Path=/` and avoid storing sensitive data.

---

## Low priority / Quality

11) Dependency and vulnerability management
    - Symptom: Many dependencies exist; no `engines` or audit automation found.
    - Recommendation: Run `npm audit`, add `npm audit` to CI, and consider dependabot or automated dependency updates.

12) Large page file and separation of concerns
    - Symptom: `src/app/page.tsx` contains large UI+logic and architecture docs.
    - Recommendation: Split the page into smaller components, move long static content (architecture templates) to markdown files under `docs/` or `content/`.

13) Missing CI checks for security and formatting
    - Recommendation: Add CI workflows for linting, type-checking, tests, and `npm audit` to prevent regressions.

---

## Useful references and implementation notes
- Use `DOMPurify` in the browser to sanitize HTML. Example: `previewRef.current.innerHTML = DOMPurify.sanitize(rawHtml)`.
- Use `zod` for request validation in your API routes.
- For rate-limiting, consider a lightweight in-process limiter for single-instance dev, and Redis or Cloudflare Workers KV with token buckets for production.
- For cloud secret binding, follow Cloudflare Pages / Wrangler docs to bind secrets rather than using `process.env` in edge functions.
