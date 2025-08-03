const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
import Cookies from 'js-cookie'

export const deleteAlumnoByDNI = async (dni: string) => {
    const token = Cookies.get('token')
    console.log(token)
    const res = await fetch(`${API_URL}/api/alumnos/${dni}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) throw new Error('Error al eliminar alumno');
    return dni;
};

export const editAlumnoByDNI = async ({
  dni,
  values,
}: {
  dni: string;
  values: Record<string, any>;
}) => {
  const token = Cookies.get('token');
  const res = await fetch(`${API_URL}/api/alumnos/${dni}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(values),
  });

  if (!res.ok) throw new Error('Error al editar alumno');

  const updatedAlumno = await res.json(); // 👈 ahora sí
  return updatedAlumno;
};
