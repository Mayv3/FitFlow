import { supabase } from '../db/supabaseClient.js'

export const getAppointments = async (supa, { page, pageSize, q }) => {
    let query = supa
        .from('turnos')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

    if (q) query = query.ilike('titulo', `%${q}%`)

    if (page && pageSize) {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)
    }

    const { data, error, count } = await query
    if (error) throw error

    return { items: data, total: count ?? 0 }
}

export const createAppointment = async (supa, values) => {
    const { data, error } = await supa
        .from('turnos')
        .insert([values])
        .select()
        .single()

    if (error) throw error
    return data
}

export const updateAppointment = async (supa, id, values) => {
    const { data, error } = await supa
        .from('turnos')
        .update(values)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export const deleteAppointment = async (supa, id) => {
    const cleanId = id.replace(/"/g, "").trim()

    const { data, error } = await supa
        .from('turnos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', cleanId)
        .select('id')
        .single()

    if (error) throw error
    return data
}
