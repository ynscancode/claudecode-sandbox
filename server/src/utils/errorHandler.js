// Shared HTTP error-response mapping for all route handlers.
//
// Every ValidationError/AuthenticationError subclass across services already
// stamps the matching `statusCode` in its own constructor (verified: no other
// statusCode value is ever set anywhere in server/src), so checking
// `err.statusCode` alone is equivalent to the previous per-route
// `err instanceof X || err.statusCode === N` checks — this preserves the
// exact same HTTP status + JSON body for every currently-reachable error
// path.
export function sendError(res, err) {
  if (err.statusCode === 401) {
    return res.status(401).json({ error: err.message });
  }
  if (err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }
  if (err.statusCode === 404) {
    return res.status(404).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
