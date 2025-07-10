import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabaseClient.js'

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    console.log(process.env.JWT_SECRET)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' })
    }
}

export async function login(req, res) {
    const { dni } = req.body
    if (!dni) return res.status(400).json({ error: 'DNI requerido' })

    const { data: user, error } = await supabase
        .from('usuarios')
        .select(`
      id, dni, gym_id,
      roles ( name )
    `)
        .eq('dni', dni)
        .single()

    if (error || !user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const token = jwt.sign(
        {
            id: user.id,
            dni: user.dni,
            role: user.roles.name,
            gym_id: user.gym_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )

    res.json({
        token,
        user: {
            dni: user.dni,
            rol: user.roles.name,
        }
    })
}

export function onlyRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'No autorizado' })
        }
        next()
    }
}