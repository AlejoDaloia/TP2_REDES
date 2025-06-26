const express = require('express');
const dotenv = require('dotenv');
const notificationRoutes = require('./notificationRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT5 = process.env.PORT5 || 6004;
app.listen(PORT5, () => {
  console.log(`Servicio de notificaciones corriendo en http://localhost:${PORT5}`);
});