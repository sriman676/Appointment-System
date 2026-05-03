/**
 * Custom security middleware compatible with Express 5.
 * - Strips MongoDB operator keys (starting with $) from req.body
 * - Strips prototype-polluting keys from req.body
 */
const sanitizeBody = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeBody(obj[key]);
    }
  }
  return obj;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeBody(req.body);
  next();
};

module.exports = mongoSanitizeMiddleware;
