const express = require('express');
const dotenv = require('dotenv');
const eventRoutes = require('./eventRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/events', eventRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT2 = process.env.PORT2 || 6001;

app.listen(PORT2, () => {
  console.log(`Servicio de eventos corriendo en http://localhost:${PORT2}`);
});