const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const app = require('express')();

const decodeBasicAuth = (header) => {
    console.log(header)
  const base64Credentials = header.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = credentials.split(':');
  return { email, password };
};

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const REFRESH_TOKEN_EXPIRATION_DAYS = 1;

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET || 'clave',
        { expiresIn: JWT_EXPIRATION || '1h' }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

exports.register = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { role } = req.body;

    if (!authorization || !authorization.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Falta encabezado Authorization Basic' });
    }

    const { email, password } = decodeBasicAuth(authorization);

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, contraseña y rol son obligatorios' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la base de datos' });

      if (results.length > 0) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      db.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, passwordHash, role],
        async (err, result) => {
          if (err) return res.status(500).json({ error: 'Error insertando el usuario' });

          const userId = result.insertId;

          const secret = speakeasy.generateSecret({
            name: `TP2_Eventos:${email}`,
          });

          db.query(
            'UPDATE users SET totp_secret = ?, totp_enabled = false WHERE id = ?',
            [secret.base32, userId],
            async (err) => {
              if (err) {
                console.error('Error guardando TOTP:', err);
                return res.status(500).json({ error: 'Error guardando TOTP' });
              }

              const qr = await qrcode.toDataURL(secret.otpauth_url);
              qrcodeTerminal.generate(secret.otpauth_url, { small: true });

              res.status(201).json({
                message: 'Usuario registrado correctamente. Configurá tu TOTP escaneando este QR.',
                userId,
                totpSecret: secret.base32,
                qrCode: qr,
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.setupTOTP = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Falta userId' });

  const secret = speakeasy.generateSecret({
    name: `TP2_Eventos:${userId}`,
  });

  db.query(
    'UPDATE users SET totp_secret = ?, totp_enabled = false WHERE id = ?',
    [secret.base32, userId],
    async (err) => {
      if (err) return res.status(500).json({ error: 'Error guardando TOTP' });

      const qr = await qrcode.toDataURL(secret.otpauth_url);

      qrcodeTerminal.generate(secret.otpauth_url, { small: true });
      
      res.json({
        message: 'Escaneá este QR con tu app',
        secret: secret.base32,
        qrCode: qr,
      });
    }
  );
};

exports.verifyTOTP = (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'Falta userId o token' });
  }

  db.query('SELECT totp_secret FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const secret = results[0].totp_secret;

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Código inválido' });
    }

    db.query(
      'UPDATE users SET totp_enabled = true WHERE id = ?',
      [userId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Error activando TOTP' });

        res.json({ message: 'TOTP verificado y activado correctamente' });
      }
    );
  });
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Falta el refresh token' });
  }

  db.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
    [refreshToken],
    (err, results) => {
      if (err) {
        console.error('Error consultando refresh token:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (results.length === 0) {
        return res.status(403).json({ error: 'Refresh token inválido o expirado.' });
      }

      const storedToken = results[0];

      db.query('SELECT * FROM users WHERE id = ?', [storedToken.user_id], (err, userResults) => {
        if (err || userResults.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = userResults[0];

        const newAccessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'clave',
          { expiresIn: process.env.JWT_EXPIRATION || '1h' }
        );

        res.json({
          accessToken: newAccessToken,
          expiresIn: process.env.JWT_EXPIRATION || '1h'
        });
      });
    }
  );
};

exports.login = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { token: totpToken } = req.body;

    if (!authorization || !authorization.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Falta encabezado Authorization Basic' });
    }

    const { email, password } = decodeBasicAuth(authorization);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la base de datos' });

      if (results.length === 0) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }

      if (user.totp_enabled == 1) {
        if (!totpToken) {
          return res.status(401).json({ error: 'Falta el token TOTP' });
        }

        const isValid = speakeasy.totp.verify({
          secret: user.totp_secret,
          encoding: 'base32',
          token: totpToken,
          window: 1, 
        });

        if (!isValid) {
          return res.status(401).json({ error: 'Código TOTP inválido' });
        }
      } else {
        return res.status(401).json({ error: 'Falta hacer la verificación de TOTP.' });
      };

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

      db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, refreshToken, expiresAt],
        (err) => {
          if (err) return res.status(500).json({ error: 'Error guardando refresh token' });

          res.json({
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRATION,
            expiresAt: expiresAt.toISOString(),
          });
        }
      );
    });
  } catch (error) {
    console.error('Error de Inicio de Sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};