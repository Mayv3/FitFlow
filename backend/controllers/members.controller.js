import {
  getAlumnoByDNI,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  getAlumnosService,
  getAlumnosSimpleService,
} from '../services/alumnos.supabase.js'

function isActiveByDate(dateLike) {
  if (!dateLike) return false;

  const s = typeof dateLike === 'string' ? dateLike.slice(0, 10) : new Date(dateLike).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return s >= today;
}

export async function handleListAlumnosByGym(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');

    const result = await getAlumnosService({ page, limit, q }, req.supa);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo alumnos' });
  }
}

export const getAlumno = async (req, res) => {
  console.log('🔑 JWT metadata:', req.user?.user_metadata);
  try {
    const alumno = await getAlumnoByDNI(req.params.dni, req.supa)
    if (!alumno) {
      return res.status(404).json({ error: 'No existe alumno con ese DNI' })
    }
    res.json(alumno)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const addAlumno = async (req, res) => {
  try {
    const payload = { ...req.body };

    const nuevo = await createAlumno(payload, req.supa);

    const hoy = new Date().toISOString().slice(0, 10);
    const activo = !!(nuevo?.fecha_de_vencimiento && nuevo.fecha_de_vencimiento >= hoy);

    req.app.get('io')
      .to(`gym:${nuevo.gym_id}`)
      .emit('member:created', { id: nuevo.id, activo, planId: nuevo?.plan_id ?? null });

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error('[addAlumno] Error:', error);
    return res.status(400).json({ error: error.message });
  }
};

export const editAlumno = async (req, res) => {
  try {
    const prev = await getAlumnoByDNI(req.params.dni, req.supa).catch(() => null);

    const actualizado = await updateAlumno(req.params.dni, req.body, req.supa);

    res.json(actualizado);

    try {
      const gymId = actualizado?.gym_id || prev?.gym_id;

      if (gymId) {
        const prevPlanId = prev?.plan_id != null ? Number(prev.plan_id) : null;

        let nextPlanId;
        if (Object.prototype.hasOwnProperty.call(req.body, 'plan_id')) {
          nextPlanId = req.body.plan_id === null ? null : Number(req.body.plan_id);
        } else {
          nextPlanId = prevPlanId;
        }

        const prevActivo = isActiveByDate(prev?.fecha_de_vencimiento);
        const nextActivo = isActiveByDate(
          Object.prototype.hasOwnProperty.call(req.body, 'fecha_de_vencimiento')
            ? req.body.fecha_de_vencimiento
            : prev?.fecha_de_vencimiento
        );

        req.app.get('io')
          ?.to(`gym:${gymId}`)
          .emit('member:updated', {
            dni: req.params.dni,
            // 👉 El emit puede seguir mandando el mix manual,
            // o directamente "actualizado" que ya tiene plan_nombre
            member: actualizado,
            prev: { planId: prevPlanId, activo: prevActivo },
            next: { planId: nextPlanId, activo: nextActivo },
          });
      }
    } catch (e) {
      console.warn('[editAlumno] emit fallo:', e?.message);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeAlumno = async (req, res) => {
  try {
    const { before } = await deleteAlumno(req.params.dni, req.supa);

    const prevActivo = isActiveByDate(before.fecha_de_vencimiento);

    req.app.get('io')
      ?.to(`gym:${before.gym_id}`)
      .emit('member:deleted', {
        dni: before.dni,
        alumno_id: before.id,
        prev: { planId: before.plan_id ?? null, activo: prevActivo },
      });

    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export async function getAlumnosByParams(req, res) {
  try {
    const gymId = String(req.query.gym_id ?? '');
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? '');

    if (!gymId) return res.status(400).json({ message: 'gym_id requerido' });

    const result = await getAlumnosService({ gymId, page, limit, q });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo alumnos' });
  }
}

export async function handleListAlumnosSimple(req, res) {
  try {
    const alumnos = await getAlumnosSimpleService(req.supa);
    res.json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message ?? 'Error obteniendo alumnos simples' });
  }
}