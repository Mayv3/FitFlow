
import * as appointmentService from '../services/appointmentsService.js'

export const getAppointments = async (req, res) => {
    try {
        const { page, pageSize, q } = req.query

        const result = await appointmentService.getAppointments(req.supa, {
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            q: q ? String(q) : '',
        })

        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}

export const createAppointment = async (req, res) => {
    try {
        const values = {
            ...req.body,
            gym_id: req.user.user_metadata.gym_id,
        }

        const data = await appointmentService.createAppointment(req.supa, values)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params
        const data = await appointmentService.updateAppointment(req.supa, id, req.body)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const deleteAppointmentController = async (req, res) => {
    try {
        const { id } = req.params
        await appointmentService.deleteAppointment(req.supa, id)
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
