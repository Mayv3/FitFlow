import {
  getProductosSvc,
  getProductoByIdSvc,
  createProductoSvc,
  updateProductoSvc,
  deleteProductoSvc,
  updateStockProductoSvc
} from '../services/productos.supabase.js'

export const getProductos = async (req, res) => {
  try {
    const { page, pageSize, q, categoria } = req.query
    const gymId = req.gymId

    console.log(
      `Received getProductos request with params: page=${page}, pageSize=${pageSize}, q=${q}, categoria=${categoria}, gymId=${gymId}`
    )

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const pageNum = page ? parseInt(page, 10) : undefined
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : undefined

    if (pageNum && pageSizeNum) {
      const { items, total } = await getProductosSvc({
        supa: req.supa,
        gymId,
        page: pageNum,
        pageSize: pageSizeNum,
        q,
        categoria
      })

      if (total <= 100) {
        const allProductos = await getProductosSvc({
          supa: req.supa,
          gymId,
          q,
          categoria
        })

        return res.status(200).json({ items: allProductos, total })
      }

      return res.status(200).json({ items, total })
    } else {
      const productos = await getProductosSvc({
        supa: req.supa,
        gymId,
        q,
        categoria
      })

      return res.status(200).json(productos)
    }
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return res.status(500).json({ message: 'Error al obtener productos', error: error.message })
  }
}

export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const producto = await getProductoByIdSvc({
      supa: req.supa,
      id
    })

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    return res.status(200).json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return res.status(500).json({ message: 'Error al obtener producto', error: error.message })
  }
}

export const createProducto = async (req, res) => {
  try {
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      activo
    } = req.body

    if (!nombre || precio === undefined) {
      return res.status(400).json({ message: 'El nombre y el precio son obligatorios' })
    }

    const nuevoProducto = await createProductoSvc({
      supa: req.supa,
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      activo,
      gymId
    })

    return res.status(201).json(nuevoProducto)
  } catch (error) {
    console.error('Error al crear producto:', error)
    return res.status(500).json({ message: 'Error al crear producto', error: error.message })
  }
}

export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      activo
    } = req.body

    const productoActualizado = await updateProductoSvc({
      supa: req.supa,
      id,
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      activo
    })

    return res.status(200).json(productoActualizado)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return res.status(500).json({ message: 'Error al actualizar producto', error: error.message })
  }
}

export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    const productoEliminado = await deleteProductoSvc({
      supa: req.supa,
      id
    })

    return res.status(200).json({ message: 'Producto eliminado correctamente', producto: productoEliminado })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return res.status(500).json({ message: 'Error al eliminar producto', error: error.message })
  }
}

export const updateStockProducto = async (req, res) => {
  try {
    const { id } = req.params
    const { cantidad, operacion } = req.body
    const gymId = req.gymId

    if (!gymId) {
      return res.status(401).json({ message: 'Gym no identificado' })
    }

    if (!cantidad || !operacion) {
      return res.status(400).json({ message: 'La cantidad y la operación son obligatorias' })
    }

    const productoActualizado = await updateStockProductoSvc({
      supa: req.supa,
      id,
      cantidad,
      operacion
    })

    return res.status(200).json(productoActualizado)
  } catch (error) {
    console.error('Error al actualizar stock:', error)
    return res.status(500).json({ message: 'Error al actualizar stock', error: error.message })
  }
}


