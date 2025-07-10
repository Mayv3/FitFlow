import { appendEgresoToSheet, deleteEgresoByID, getEgresosFromSheet } from "../services/googleSheets.js";

export const getEgresos = async (req, res) => {
    try {
      const { anio, mes, tipo } = req.query;
      const egresos = await getEgresosFromSheet();
  
      const filtrados = egresos.filter(e => {
        let pasa = true;
  
        if (anio || mes) {
          const [dia, mesStr, anioStr] = e.Fecha.split("/");
          if (anio && anioStr !== String(anio)) pasa = false;
          if (mes && Number(mesStr) !== Number(mes)) pasa = false;
        }
  
        if (tipo && e.Tipo.toUpperCase() !== tipo.toUpperCase()) pasa = false;
  
        return pasa;
      });
  
      res.json(filtrados);
    } catch (err) {
      res.status(500).json({ message: "Error al filtrar egresos", error: err.message });
    }
  };

export const createEgreso = async (req, res) => {
  try {
    const nuevo = await appendEgresoToSheet(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ message: "Error al guardar egreso", error: err.message });
  }
};

export const removeEgreso = async (req, res) => {
  try {
    const success = await deleteEgresoByID(req.params.id);
    if (!success) return res.status(404).json({ message: "Egreso no encontrado" });
    res.json({ message: "Egreso eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar egreso", error: err.message });
  }
};
