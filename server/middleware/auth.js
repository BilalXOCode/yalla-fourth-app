// Requires a valid JWT in the Authorization header (Bearer <token>).
// Sets req.userId for the route handlers.
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
};
