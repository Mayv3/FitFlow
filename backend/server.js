import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import { buildAlumnosLoader } from './loaders/alumnosLoader.js'

import alumnosRoutes from './routes/members.routes.js';
import pagosRoutes from './routes/payments.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import asistenciasRoutes from './routes/attendance.routes.js';
import authRoutes from './routes/auth.routes.js'
import gymsRoutes from './routes/gyms.routes.js'
import testRoutes from './routes/test.routes.js'
import statsRoutes from './routes/stats.routes.js'
import planesRoutes from './routes/planes.routes.js';
import paymentMethodsRoutes from './routes/paymentMethods.routes.js';
import servicesRoutes from './routes/services.routes.js';
import appointmentsRoutes from "./routes/appointments.routes.js"
import usersRoutes from "./routes/users.routes.js"

import { verifyToken } from '../backend/middleware/auth.js'
import { createServer } from 'http';
import { Server } from 'socket.io';
import { supaPerRequest } from './middleware/supaPerRequest.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://fit-flow-rouge.vercel.app",
  "https://fit-flow-f7a3ewq3f-mavy3s-projects.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  req.loaders = {
    alumnos: buildAlumnosLoader(),
  }
  next()
})

app.use('/api/alumnos', verifyToken, supaPerRequest, alumnosRoutes);
app.use('/api/pagos', verifyToken, supaPerRequest, pagosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/gyms', gymsRoutes)
app.use('/api/test', testRoutes);
app.use('/api/stats', verifyToken, supaPerRequest, statsRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/servicios', servicesRoutes);
app.use('/api/turnos', appointmentsRoutes);
app.use("/api/users", usersRoutes)

app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/auth', authRoutes);

app.get('/ping', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3001;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  const gymId = socket.handshake.query.gymId;
  if (typeof gymId === 'string' && gymId) {
    socket.join(`gym:${gymId}`);
  }
});

app.set('io', io);

export function emitToGym(gymId, event, payload) {
  io.to(`gym:${gymId}`).emit(event, payload);
}

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
