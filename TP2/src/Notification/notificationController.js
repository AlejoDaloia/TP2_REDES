const db = require('../db');

const tiposPermitidos = ['comunicado', 'recordatorio', 'alerta'];

exports.crearNotificacion = (req, res) => {
  const { user_id, tipo, titulo, mensaje } = req.body;
  if (!user_id || !tipo || !titulo || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: `Tipo inválido. Debe ser uno de: ${tiposPermitidos.join(', ')}` });
  }

  db.query(
    'INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, enviada) VALUES (?, ?, ?, ?, ?)',
    [user_id, tipo, titulo, mensaje, true],
    (err, result) => {
      if (err) {
        console.error('Error al enviar notificacion:', err);
        return res.status(500).json({ error: 'Error al enviar la notificacion' });
      }
      res.status(201).json({ message: 'Notificacion enviada', id: result.insertId });
    }
  );
};

exports.obtenerNotificacionesPorEvento = (req, res) => {
  const { eventoId } = req.params;
  db.query(
    `SELECT n.* FROM notificaciones n
     JOIN suscripciones_evento s ON n.user_id = s.user_id
     WHERE s.evento_id = ?
     ORDER BY n.fecha_envio DESC`,
    [eventoId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo notificaciones:', err);
        return res.status(500).json({ error: 'Error obteniendo notificaciones del evento' });
      }
      res.json({ notificaciones: results });
    }
  );
};

exports.obtenerNotificacionesPorUsuario = (req, res) => {
  const { userId } = req.params;
  db.query(
    'SELECT * FROM notificaciones WHERE user_id = ? ORDER BY fecha_envio DESC',
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo notificaciones del usuario:', err);
        return res.status(500).json({ error: 'Error obteniendo notificaciones' });
      }
      res.json({ notificaciones: results });
    }
  );
};

exports.suscribirseAEvento = (req, res) => {
  const user_id = req.user.id;
  const { eventoId } = req.params;

  db.query(
    'INSERT IGNORE INTO suscripciones_evento (user_id, evento_id) VALUES (?, ?)',
    [user_id, eventoId],
    (err, result) => {
      if (err) {
        console.error('Error suscribiendo al evento:', err);
        return res.status(500).json({ error: 'Error suscribiendo al evento' });
      }
      res.json({ message: 'Suscripción exitosa' });
    }
  );
};

exports.cancelarSuscripcion = (req, res) => {
  const user_id = req.user.id;
  const { eventoId } = req.params;

  db.query(
    'DELETE FROM suscripciones_evento WHERE user_id = ? AND evento_id = ?',
    [user_id, eventoId],
    (err, result) => {
      if (err) {
        console.error('Error cancelando suscripción:', err);
        return res.status(500).json({ error: 'Error cancelando suscripción' });
      }
      res.json({ message: 'Suscripción cancelada' });
    }
  );
};