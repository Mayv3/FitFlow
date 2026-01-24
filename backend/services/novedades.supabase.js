import { uploadNovedadImageSvc } from '../services/novedades.upload.service.js';

export const getNovedadesSvc = async ({ supa, gymId, page, pageSize, q, tipo, activo }) => {
  let query = supa
    .from('novedades')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('fecha_publicacion', { ascending: false }) // Más reciente primero

  if (q) {
    const lower = q.toLowerCase()
    query = query.or(`titulo.ilike.%${lower}%,descripcion.ilike.%${lower}%`)
  }

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (activo !== undefined) {
    query = query.eq('activo', activo)
  }

  if (page && pageSize) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) throw error

  return page && pageSize
    ? { items: data ?? [], total: count ?? 0 }
    : data ?? []
}

export const getNovedadByIdSvc = async ({ supa, id }) => {
  const { data, error } = await supa
    .from('novedades')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export const createNovedadSvc = async ({ supa, novedad }) => {
  const { data, error } = await supa
    .from('novedades')
    .insert([novedad])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateNovedadSvc = async ({ supa, id, novedad }) => {
  const { data, error } = await supa
    .from('novedades')
    .update(novedad)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteNovedadSvc = async ({ supa, id }) => {
  const { data, error } = await supa
    .from('novedades')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const toggleActivoNovedadSvc = async ({ supa, id, activo }) => {
  const { data, error } = await supa
    .from('novedades')
    .update({ activo })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateOrdenNovedadSvc = async ({ supa, id, orden }) => {
  const { data, error } = await supa
    .from('novedades')
    .update({ orden })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getNovedadesActivasSvc = async ({ supa, gymId, tipo }) => {
  let query = supa
    .from('novedades')
    .select('*')
    .eq('gym_id', gymId)
    .eq('activo', true)
    .is('deleted_at', null)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  // Filtrar por fecha si hay fecha_fin
  const today = new Date().toISOString().split('T')[0]
  query = query.or(`fecha_fin.is.null,fecha_fin.gte.${today}`)

  const { data, error } = await query

  if (error) throw error
  return data ?? []
}

export const uploadNovedadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }

    const imageUrl = await uploadNovedadImageSvc({
      supa: req.supa,
      file: req.file,
    });

    res.status(201).json({
      image_url: imageUrl,
    });
  } catch (error) {
    console.error('Error uploadNovedadImage:', error);
    res.status(500).json({
      message: 'Error al subir imagen',
      error: error.message,
    });
  }
};
