import express from 'express';
const router = express.Router();

router.get('/dataloader-test', async (req, res) => {
  // Podés pasar dnis como query ?dnis=123,456,789
  const dnis = (req.query.dnis || '').split(',');
  // Llamamos loader.load para cada dni
  const results = await Promise.all(
    dnis.map(dni => req.loaders.alumnos.load(dni))
  );
  res.json(results);
});

export default router;
