<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- App data (users, sources, reports, NLP results) lives in browser localStorage via `src/services/*`; pages talk only to contexts/services so a future backend swap touches services alone. Why: ported as-is from the Bolt prototype, which had no backend.
- PDF generation (`src/lib/pdf.ts`, jsPDF) is loaded with dynamic `import()` inside click handlers, never statically from a route. Why: jsPDF is browser-only and routes are server-rendered.
- Pages behind login wrap their content in `AppLayout` (AuthGuard + role-filtered sidebar). Why: auth state is read from localStorage after hydration, so guarding happens client-side.
- Report content for PDF, CSV and the on-screen preview comes from one builder (`src/lib/reporte-datos.ts`) over the filtered opinions from `analisis.service`. Why: every output shows the same numbers for the same source and period.
