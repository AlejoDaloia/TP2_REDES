const express = require('express');
const dotenv = require('dotenv');
const programRoutes = require('./programRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/api/program', programRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT4 = process.env.PORT4 || 6003;
app.listen(PORT4, () => {
  console.log(`Servicio de programación corriendo en http://localhost:${PORT4}`);
});