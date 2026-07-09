// Shared portal-target lookup for full-page modals. All modals portal into
// `#modal-root` (a sibling of `<main>` inside `.app-root`) rather than
// document.body directly, because `.page-animate` sets a CSS `transform`
// which makes it a containing block for `position: fixed` — see CLAUDE.md.
// Falls back to document.body only as a defensive guard; #modal-root should
// always be present in index.html.
export function getModalRoot() {
  return document.getElementById('modal-root') || document.body
}
