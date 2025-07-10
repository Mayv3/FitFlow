import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import alumnosRoutes from './routes/alumnos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import authRoutes from './routes/auth.routes.js'; // ajustá la ruta según tu estructura

import { verifyToken, onlyRole} from '../backend/middleware/auth.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/alumnos',verifyToken, alumnosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/caja', cajaRoutes);
app.get('/ping', (req, res) => res.sendStatus(200));
app.use('/api/auth', authRoutes);

// router.get('/dashboard-admin', verifyToken, onlyRole('dueño'), handler)

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
