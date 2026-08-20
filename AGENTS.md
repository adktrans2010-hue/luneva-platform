<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git and two-PC safety

- Read `WORKFLOW.md` before Git synchronization work.
- Preserve recovery work before pull, merge, rebase, or reset.
- Treat `upstream` as the GitHub reference and the current `origin` as a local transfer bundle until the user explicitly approves a remote change.
- Never commit, push, deploy, rewrite history, or expose secrets without explicit authorization.
- Scheduled and button-driven checks may fetch and report only; they must not mutate the working branch.
