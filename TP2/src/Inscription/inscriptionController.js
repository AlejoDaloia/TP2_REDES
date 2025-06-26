const db = require('../db');

exports.getTiposInscripcion = (req, res) => {
  db.query('SELECT * FROM tipos_inscripcion', (err, results) => {
    if (err) {
      console.error('Error al obtener tipos de inscripción:', err);
      return res.status(500).json({ error: 'Error al obtener tipos de inscripción' });
    }
    res.json({ tipos: results });
  });
};

exports.createTipoInscripcion = (req, res) => {
  const { nombre, descripcion, precio } = req.body;

  if (!nombre || !descripcion || precio === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  db.query(
    'INSERT INTO tipos_inscripcion (nombre, descripcion, precio) VALUES (?, ?, ?)',
    [nombre, descripcion, precio],
    (err, result) => {
      if (err) {
        console.error('Error al crear tipo de inscripción:', err);
        return res.status(500).json({ error: 'Error al crear tipo de inscripción' });
      }
      res.status(201).json({ message: 'Tipo de inscripción creado', id: result.insertId });
    }
  );
};

exports.updateTipoInscripcion = (req, res) => {
  const tipoId = req.params.id;
  const { nombre, descripcion, precio } = req.body;

  db.query(
    'UPDATE tipos_inscripcion SET nombre = ?, descripcion = ?, precio = ? WHERE id = ?',
    [nombre, descripcion, precio, tipoId],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar tipo de inscripción:', err);
        return res.status(500).json({ error: 'Error al actualizar tipo de inscripción' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tipo de inscripción no encontrado' });
      }

      res.json({ message: 'Tipo de inscripción actualizado correctamente' });
    }
  );
};

exports.inscribirUsuario = (req, res) => {
  const { evento_id, tipo_inscripcion } = req.body;
  const userId = req.user.userId;

  if (!evento_id || !tipo_inscripcion) {
    return res.status(400).json({ error: 'Faltan datos para inscribirse' });
  }

  db.query(
    'SELECT * FROM inscripciones WHERE user_id = ? AND evento_id = ?',
    [userId, evento_id],
    (err, results) => {
      if (err) {
        console.error('Error al verificar inscripción:', err);
        return res.status(500).json({ error: 'Error al verificar inscripción' });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: 'Ya estás inscripto en este evento' });
      }

      db.query(
        'INSERT INTO inscripciones (user_id, evento_id, tipo_inscripcion) VALUES (?, ?, ?)',
        [userId, evento_id, tipo_inscripcion],
        (err, result) => {
          if (err) {
            console.error('Error al registrar inscripción:', err);
            return res.status(500).json({ error: 'Error al registrar inscripción' });
          }

          res.status(201).json({ message: 'Inscripción registrada', id: result.insertId });
        }
      );
    }
  );
};

exports.getInscripcionesPorEvento = (req, res) => {
  const eventoId = req.params.eventoId;

  db.query(
    `SELECT i.id, u.email, t.nombre AS tipo, i.fecha
     FROM inscripciones i
     JOIN users u ON i.user_id = u.id
     JOIN tipos_inscripcion t ON i.tipo_inscripcion = t.id
     WHERE i.evento_id = ?`,
    [eventoId],
    (err, results) => {
      if (err) {
        console.error('Error al obtener inscripciones:', err);
        return res.status(500).json({ error: 'Error al obtener inscripciones' });
      }

      res.json({ inscripciones: results });
    }
  );
};

exports.getInscripcionesPorUsuario = (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT i.id, e.title AS evento, t.nombre AS tipo, i.fecha
     FROM inscripciones i
     JOIN eventos e ON i.evento_id = e.id
     JOIN tipos_inscripcion t ON i.tipo_inscripcion = t.id
     WHERE i.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error al obtener inscripciones del usuario:', err);
        return res.status(500).json({ error: 'Error al obtener inscripciones' });
      }

      res.json({ inscripciones: results });
    }
  );
};