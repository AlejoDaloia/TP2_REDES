const db = require('../db');

// Crear un nuevo evento
exports.createEvent = (req, res) => {
  const { title, description, location, capacity, start_date, end_date } = req.body;
  const user = req.user;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!['organizador', 'administrador'].includes(user.role)) {
    return res.status(403).json({ error: 'No tenés permisos para crear eventos' });
  }

  const event = {
    title,
    description,
    location,
    capacity,
    start_date,
    end_date,
    created_by: user.userId
  };

  db.query('INSERT INTO eventos SET ?', event, (err, result) => {
    if (err) {
      console.error('Error creando el evento:', err);
      return res.status(500).json({ error: 'Error creando el evento' });
    }

    res.status(201).json({ message: 'Evento creado', eventId: result.insertId });
  });
};

exports.listEvents = (req, res) => {
  const query = `
    SELECT e.id, e.title, e.description, e.location, e.capacity,
           e.start_date, e.end_date, e.status, u.email AS created_by_email
    FROM eventos e
    JOIN users u ON e.created_by = u.id
    ORDER BY e.start_date ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener eventos:', err);
      return res.status(500).json({ error: 'Error al obtener eventos' });
    }

    res.json({ events: results });
  });
};

exports.getEventById = (req, res) => {
  const eventId = req.params.id;

  db.query(
    `SELECT e.id, e.title, e.description, e.location, e.capacity,
            e.start_date, e.end_date, e.status, u.email AS created_by_email
     FROM eventos e
     JOIN users u ON e.created_by = u.id
     WHERE e.id = ?`,
    [eventId],
    (err, results) => {
      if (err) {
        console.error('Error al obtener evento:', err);
        return res.status(500).json({ error: 'Error al obtener evento' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      res.json({ event: results[0] });
    }
  );
};

exports.updateEvent = (req, res) => {
  const eventId = req.params.id;
  const user = req.user;
  const { title, description, location, capacity, start_date, end_date } = req.body;

  if (!['organizador', 'administrador'].includes(user.role)) {
    return res.status(403).json({ error: 'No tenés permisos para actualizar eventos' });
  }

  const updatedEvent = {
    title,
    description,
    location,
    capacity,
    start_date,
    end_date,
  };

  db.query('UPDATE eventos SET ? WHERE id = ?', [updatedEvent, eventId], (err, result) => {
    if (err) {
      console.error('Error actualizando evento:', err);
      return res.status(500).json({ error: 'Error actualizando evento' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({ message: 'Evento actualizado correctamente' });
  });
};

exports.changeEventStatus = (req, res) => {
  const eventId = req.params.id;
  const user = req.user;
  const { status } = req.body;

  if (!['organizador', 'administrador'].includes(user.role)) {
    return res.status(403).json({ error: 'No tenés permisos para cambiar estado de eventos' });
  }

  if (!['planificado', 'activo', 'finalizado'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  db.query('UPDATE eventos SET status = ? WHERE id = ?', [status, eventId], (err, result) => {
    if (err) {
      console.error('Error cambiando estado:', err);
      return res.status(500).json({ error: 'Error cambiando estado del evento' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({ message: `Estado del evento cambiado a ${status}` });
  });
};