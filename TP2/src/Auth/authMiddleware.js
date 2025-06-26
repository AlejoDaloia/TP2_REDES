const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Decoded token:', decoded);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }

}

function requireRole(...allowedRoles) {

  if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
    allowedRoles = allowedRoles[0];
  }

  const allowed = allowedRoles.map(r => r.toLowerCase());

  return (req, res, next) => {
    const role = (req.user.role || '').toLowerCase();
    if (!req.user || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};