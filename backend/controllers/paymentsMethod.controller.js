
import { getPaymentMethodsService } from '../services/paymentMethods.supabase.js';

export async function getPaymentMethodsController(req, res) {
    try {
      const paymentMethods = await getPaymentMethodsService();
      res.status(200).json(paymentMethods);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error al obtener los métodos de pago' });
    }
  }