const db = require('../db');

exports.createSala = (req, res) => {
  const { evento_id, nombre, capacidad, ubicacion } = req.body;

  if (!evento_id || !nombre || !capacidad || !ubicacion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.query(
    'INSERT INTO salas (evento_id, nombre, capacidad, ubicacion) VALUES (?, ?, ?, ?)',
    [evento_id, nombre, capacidad, ubicacion],
    (err, result) => {
      if (err) {
        console.error('Error creando sala:', err);
        return res.status(500).json({ error: 'Error creando sala' });
      }

      res.status(201).json({ message: 'Sala creada', salaId: result.insertId });
    }
  );
};

exports.getSalas = (req, res) => {
  db.query('SELECT * FROM salas', (err, results) => {
    if (err) {
      console.error('Error al obtener salas:', err);
      return res.status(500).json({ error: 'Error al obtener salas' });
    }

    res.json({ salas: results });
  });
};

exports.createActividad = (req, res) => {
  const { evento_id, titulo, descripcion, sala_id, expositor_id, fecha_inicio, fecha_fin } = req.body;

  if (!evento_id || !titulo || !sala_id || !expositor_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.query(
    `SELECT * FROM actividades 
     WHERE sala_id = ? AND evento_id = ? 
     AND ( (fecha_inicio < ? AND fecha_fin > ?) OR (fecha_inicio < ? AND fecha_fin > ?) OR (fecha_inicio >= ? AND fecha_fin <= ?) )`,
    [sala_id, evento_id, fecha_fin, fecha_fin, fecha_inicio, fecha_inicio, fecha_inicio, fecha_fin],
    (err, results) => {
      if (err) {
        console.error('Error al validar conflicto:', err);
        return res.status(500).json({ error: 'Error al validar conflicto' });
      }
      if (results.length > 0) {
        return res.status(409).json({ error: 'Conflicto de horario en la sala' });
      }

      db.query(
        `INSERT INTO actividades (evento_id, titulo, descripcion, sala_id, expositor_id, fecha_inicio, fecha_fin)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [evento_id, titulo, descripcion, sala_id, expositor_id, fecha_inicio, fecha_fin],
        (err, result) => {
          if (err) {
            console.error('Error creando actividad:', err);
            return res.status(500).json({ error: 'Error creando actividad' });
          }

          res.status(201).json({ message: 'Actividad creada', actividadId: result.insertId });
        }
      );
    }
  );
};

exports.getActividadesPorEvento = (req, res) => {
  const eventoId = req.params.eventoId;
  db.query(
    `SELECT a.*, s.nombre AS sala, u.email AS expositor_email 
     FROM actividades a
     JOIN salas s ON a.sala_id = s.id
     JOIN users u ON a.expositor_id = u.id
     WHERE a.evento_id = ?
     ORDER BY a.fecha_inicio`,
    [eventoId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo actividades:', err);
        return res.status(500).json({ error: 'Error obteniendo actividades' });
      }

      res.json({ actividades: results });
    }
  );
};

exports.getActividadesPorExpositor = (req, res) => {
  const userId = req.params.userId;
  db.query(
    `SELECT a.*, s.nombre AS sala, e.title AS evento
     FROM actividades a
     JOIN salas s ON a.sala_id = s.id
     JOIN eventos e ON a.evento_id = e.id
     WHERE a.expositor_id = ?
     ORDER BY a.fecha_inicio`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo actividades:', err);
        return res.status(500).json({ error: 'Error obteniendo actividades del expositor' });
      }

      res.json({ actividades: results });
    }
  );
};

exports.validarConflicto = (req, res) => {
  const { sala_id, evento_id, fecha_inicio, fecha_fin } = req.body;

  if (!sala_id || !evento_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.query(
    `SELECT * FROM actividades 
     WHERE sala_id = ? AND evento_id = ? 
     AND ( (fecha_inicio < ? AND fecha_fin > ?) OR (fecha_inicio < ? AND fecha_fin > ?) OR (fecha_inicio >= ? AND fecha_fin <= ?) )`,
    [sala_id, evento_id, fecha_fin, fecha_fin, fecha_inicio, fecha_inicio, fecha_inicio, fecha_fin],
    (err, results) => {
      if (err) {
        console.error('Error al validar conflicto:', err);
        return res.status(500).json({ error: 'Error al validar conflicto' });
      }
      if (results.length > 0) {
        return res.status(409).json({ error: 'Conflicto de horario detectado', conflictos: results });
      }
      res.json({ message: 'Sin conflictos detectados' });
    }
  );
};