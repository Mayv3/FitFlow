import { getGymStatsService } from '../services/stats.supabase.js';
import { getPaymentsStatsService } from '../services/paymentsStats.supabase.js';

export async function getGymStatsController(req, res) {
  try {
    const gymId =
      typeof req.query.gymId === 'string' && req.query.gymId.trim()
        ? req.query.gymId.trim()
        : undefined;

    const stats = await getGymStatsService({ gymId });
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[GET /stats] Error:', err);
    return res
      .status(500)
      .json({ message: 'No se pudieron obtener las estadísticas' });
  }
}

export async function getPaymentsStatsController(req, res) {
  try {
    const gymId = req.query.gymId || null;
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const result = await getPaymentsStatsService({ gymId, fromDate, toDate });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}