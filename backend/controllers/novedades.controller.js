import {
  getNovedadesSvc,
  getNovedadByIdSvc,
  createNovedadSvc,
  updateNovedadSvc,
  deleteNovedadSvc,
  toggleActivoNovedadSvc,
  updateOrdenNovedadSvc,
  getNovedadesActivasSvc
} from '../services/novedades.supabase.js'
import { uploadNovedadImageSvc } from '../services/novedades.upload.service.js'

export const getNovedades = async (req, res) => {
  try {
    const { page, pageSize, q, tipo, activo } = req.query

    console.log(
      `Received getNovedades request with params: page=${page}, pageSize=${pageSize}, q=${q}, tipo=${tipo}, activo=${activo}`
    )

    const pageNum = page ? parseInt(page, 10) : undefined
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : undefined
    const activoBool = activo !== undefined ? activo === 'true' : undefined

    if (pageNum && pageSizeNum) {
      const { items, total } = await getNovedadesSvc({
        supa: req.supa,
        page: pageNum,
        pageSize: pageSizeNum,
        q,
        tipo,
        activo: activoBool
      })

      if (total <= 100) {
        const allNovedades = await getNovedadesSvc({
          supa: req.supa,
          q,
          tipo,
          activo: activoBool
        })

        return res.status(200).json({ items: allNovedades, total })
      }

      return res.status(200).json({ items, total })
    } else {
      const novedades = await getNovedadesSvc({
        supa: req.supa,
        q,
        tipo,
        activo: activoBool
      })

      return res.status(200).json(novedades)
    }
  } catch (error) {
    console.error('Error en getNovedades:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const getNovedadById = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`Received getNovedadById request for id: ${id}`)

    const novedad = await getNovedadByIdSvc({
      supa: req.supa,
      id: parseInt(id, 10)
    })

    if (!novedad) {
      return res.status(404).json({ message: 'Novedad no encontrada' })
    }

    res.status(200).json(novedad)
  } catch (error) {
    console.error('Error en getNovedadById:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const createNovedad = async (req, res) => {
  try {
    const { titulo, descripcion, tipo, activo, fecha_publicacion, imagen_url } = req.body

    console.log('Received createNovedad request with data:', {
      titulo,
      descripcion,
      tipo,
      activo,
      fecha_publicacion,
      imagen_url
    })

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ message: 'El título es obligatorio' })
    }

    const tiposValidos = ['novedad', 'feature', 'promocion', 'evento', 'error', 'fix']
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: 'Tipo inválido. Debe ser: novedad, feature, promocion, evento, error o fix'
      })
    }

    const novedadData = {
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      tipo: tipo || 'novedad',
      activo: activo !== undefined ? activo : true,
      fecha_publicacion: fecha_publicacion || new Date().toISOString(),
      imagen_url: imagen_url?.trim() || null
    }

    const novedad = await createNovedadSvc({
      supa: req.supa,
      novedad: novedadData
    })

    res.status(201).json(novedad)
  } catch (error) {
    console.error('Error en createNovedad:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const updateNovedad = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, tipo, activo, fecha_publicacion, imagen_url } = req.body

    console.log(`Received updateNovedad request for id: ${id} with data:`, req.body)

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ message: 'El título es obligatorio' })
    }

    const tiposValidos = ['novedad', 'feature', 'promocion', 'evento', 'error', 'fix']
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: 'Tipo inválido. Debe ser: novedad, feature, promocion, evento, error o fix'
      })
    }

    const updateData = {
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      tipo: tipo || 'novedad',
      activo: activo !== undefined ? activo : true,
      fecha_publicacion: fecha_publicacion || null,
      imagen_url: imagen_url?.trim() || null
    }

    const novedad = await updateNovedadSvc({
      supa: req.supa,
      id: parseInt(id, 10),
      novedad: updateData
    })

    if (!novedad) {
      return res.status(404).json({ message: 'Novedad no encontrada' })
    }

    res.status(200).json(novedad)
  } catch (error) {
    console.error('Error en updateNovedad:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const deleteNovedad = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`Received deleteNovedad request for id: ${id}`)

    const novedad = await deleteNovedadSvc({
      supa: req.supa,
      id: parseInt(id, 10)
    })

    if (!novedad) {
      return res.status(404).json({ message: 'Novedad no encontrada' })
    }

    res.status(200).json({ message: 'Novedad eliminada correctamente', data: novedad })
  } catch (error) {
    console.error('Error en deleteNovedad:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const toggleActivoNovedad = async (req, res) => {
  try {
    const { id } = req.params
    const { activo } = req.body

    console.log(`Received toggleActivoNovedad request for id: ${id}, activo: ${activo}`)

    if (activo === undefined) {
      return res.status(400).json({ message: 'El campo activo es obligatorio' })
    }

    const novedad = await toggleActivoNovedadSvc({
      supa: req.supa,
      id: parseInt(id, 10),
      activo
    })

    if (!novedad) {
      return res.status(404).json({ message: 'Novedad no encontrada' })
    }

    res.status(200).json(novedad)
  } catch (error) {
    console.error('Error en toggleActivoNovedad:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const updateOrdenNovedad = async (req, res) => {
  try {
    const { id } = req.params
    const { orden } = req.body

    console.log(`Received updateOrdenNovedad request for id: ${id}, orden: ${orden}`)

    if (orden === undefined) {
      return res.status(400).json({ message: 'El campo orden es obligatorio' })
    }

    const novedad = await updateOrdenNovedadSvc({
      supa: req.supa,
      id: parseInt(id, 10),
      orden: parseInt(orden, 10)
    })

    if (!novedad) {
      return res.status(404).json({ message: 'Novedad no encontrada' })
    }

    res.status(200).json(novedad)
  } catch (error) {
    console.error('Error en updateOrdenNovedad:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

export const getNovedadesActivas = async (req, res) => {
  try {
    const { tipo } = req.query
    const gymId = req.gymId

    console.log(`Received getNovedadesActivas request with tipo: ${tipo}, gymId: ${gymId}`)

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const novedades = await getNovedadesActivasSvc({
      supa: req.supa,
      gymId,
      tipo
    })

    res.status(200).json(novedades)
  } catch (error) {
    console.error('Error en getNovedadesActivas:', error)
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    })
  }
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