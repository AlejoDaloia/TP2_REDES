const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./authRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Servicio de autenticación corriendo en http://localhost:${PORT}`);
});