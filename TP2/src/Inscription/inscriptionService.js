const express = require('express');
const dotenv = require('dotenv');
const inscriptionRoutes = require('./inscriptionRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/inscriptions', inscriptionRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT3 = process.env.PORT3 || 6002;

app.listen(PORT3, () => {
  console.log(`Servicio de inscripciones corriendo en http://localhost:${PORT3}`);
});