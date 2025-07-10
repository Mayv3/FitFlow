import React, { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");

export default function RealTimeUpdates() {
  useEffect(() => {
    socket.on('asistencia-registrada', (data) => {
      console.log('Nueva asistencia registrada:', data);
    });

    socket.on('asistencia-actualizada', (data) => {
      console.log('Asistencia actualizada:', data);
    });

    return () => {
      socket.off('asistencia-registrada');
      socket.off('asistencia-actualizada');
    };
  }, []);

  return (
    <div>
      <h1>Actualizaciones en tiempo real</h1>
    </div>
  );
}
