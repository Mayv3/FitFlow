import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import alumnosRoutes from './routes/alumnos.routes.js';
import { buildAlumnosLoader } from './loaders/alumnosLoader.js'

import pagosRoutes from './routes/pagos.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import authRoutes from './routes/auth.routes.js'
import gymsRoutes from './routes/gyms.routes.js'
import testRoutes from './routes/test.routes.js'
import statsRoutes from './routes/stats.routes.js'
import planesRoutes from './routes/planes.routes.js';

import { verifyToken } from '../backend/middleware/auth.js'

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  req.loaders = {
    alumnos: buildAlumnosLoader(),
  }
  next()
})
app.use('/api/alumnos', verifyToken, alumnosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gyms', gymsRoutes)
app.use('/api/test', testRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/planes', planesRoutes);

app.get('/ping', (req, res) => res.sendStatus(200));

// router.get('/dashboard-admin', verifyToken, onlyRole('dueño'), handler)

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
