import dayjs from 'dayjs';
import {
  getPlanesFromSheet,
  appendPlanToSheet,
  updatePlanInSheet,
  deletePlanInSheet,
  appendAumentoToSheet,
  getAumentosPlanesFromSheet,
  getAlumnosFromSheet,
  getPagosFromSheet
} from '../services/googleSheets.js';

export const getPlanes = async (req, res) => {
  try {
    const { tipo } = req.query;
    const planes = await getPlanesFromSheet();

    const filtrados = tipo
      ? planes.filter(p => p.Tipo?.toLowerCase() === tipo.toLowerCase())
      : planes;

    res.json(filtrados);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ message: 'Error al obtener planes' });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { Tipo, 'Plan o Producto': nombre, Precio, numero_Clases, Coins } = req.body;

    if (!Tipo || !nombre || !Precio) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const nuevoPlan = await appendPlanToSheet({ Tipo, 'Plan o Producto': nombre, Precio, numero_Clases, Coins });
    res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ message: 'Error al crear plan' });
  }
};

export const updatePlanByID = async (req, res) => {
  try {
    const { id } = req.params;
    const nuevosDatos = req.body;

    const planes = await getPlanesFromSheet();
    const planViejo = planes.find(p => p.ID === id);
    if (!planViejo) {
      return res.status(404).json({ message: 'No se encontró el plan' });
    }

    let registroDeAumento = null;
    if (nuevosDatos.Precio != null) {
      const precioAnterior = parseFloat(planViejo.Precio);
      const precioNuevo = parseFloat(nuevosDatos.Precio);

      console.log('Precio anterior vs nuevo:', precioAnterior, precioNuevo);

      if (isNaN(precioAnterior) || isNaN(precioNuevo)) {
        return res.status(400).json({ message: 'Precio anterior o nuevo no válido' });
      }

      if (precioNuevo !== precioAnterior) {
        const porcentaje = ((precioNuevo - precioAnterior) / precioAnterior) * 100;
        registroDeAumento = {
          Fecha: dayjs().format('DD/MM/YYYY'),
          Precio_anterior: precioAnterior,
          Precio_actualiza: precioNuevo,
          Porcentaje_aumento: `${porcentaje.toFixed(2)}%`,
          Plan: planViejo['Plan o Producto']
        };
      }
    }

    const actualizado = await updatePlanInSheet(id, nuevosDatos);
    if (!actualizado) {
      return res.status(404).json({ message: 'No se encontró el plan al actualizar' });
    }

    if (registroDeAumento) {
      await appendAumentoToSheet(registroDeAumento);
    }

    const msg = registroDeAumento
      ? 'Plan y registro de aumento guardados correctamente'
      : 'Plan actualizado correctamente';

    const planActualizado = { ...planViejo, ...nuevosDatos };

    return res.json(planActualizado);

  } catch (error) {
    console.error('Error al editar plan:', error);
    return res.status(500).json({ message: 'Error al editar plan' });
  }
};

export const deletePlanByID = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await deletePlanInSheet(id);
    if (!eliminado) return res.status(404).json({ message: 'No se encontró el plan' });

    res.json({ message: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ message: 'Error al eliminar plan' });
  }
};

export const getAumentosPlanes = async (req, res) => {
  try {
    const { plan } = req.query;
    if (!plan) {
      return res.status(400).json({ message: 'Se requiere el nombre del plan' });
    }

    const aumentos = await getAumentosPlanesFromSheet();

    const aumentosFiltrados = aumentos.filter(a => a.Plan?.toLowerCase() === plan.toLowerCase());

    res.json(aumentosFiltrados);
  } catch (error) {
    console.error('Error al obtener aumentos:', error);
    res.status(500).json({ message: 'Error al obtener aumentos' });
  }
};

export const getPlanesPersonalizadosPorProfesor = async (req, res) => {
  try {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);

    if (!mes || !anio) {
      return res.status(400).json({ error: "Mes y año requeridos" });
    }

    const alumnos = await getAlumnosFromSheet();
    const pagos = await getPagosFromSheet();

    const pagosFiltrados = pagos.filter((pago) => {

      if (!pago.Fecha_de_Pago || !pago["Socio DNI"] || !pago.Tipo) return false;

      const fecha = dayjs(
        pago.Fecha_de_Pago.trim(),
        ["D/M/YYYY", "DD/MM/YYYY"],
        true
      );
      const tipo = pago.Tipo.toUpperCase().trim();

      return (
        fecha.isValid() &&
        fecha.month() + 1 === mes &&
        fecha.year() === anio &&
        tipo === "GIMNASIO"
      );
    });

    const resultado = pagosFiltrados.reduce((acc, pago) => {
      const dni = pago["Socio DNI"];
      const alumno = alumnos.find((a) => a.DNI === dni);
      if (!alumno) return acc;

      const planRaw = alumno.Plan || "";
      const plan = planRaw.trim().toLowerCase();

      if (plan !== "personalizado") return acc;

      const profesor = alumno.Profesor_asignado || "Sin profesor";
      const nombre = alumno.Nombre || "Alumno sin nombre";

      const existente = acc.find((p) => p.profesor === profesor);
      if (existente) {
        if (!existente.alumnos.includes(nombre)) {
          existente.alumnos.push(nombre);
          existente.cantidad += 1;
        }
      } else {
        acc.push({ profesor, cantidad: 1, alumnos: [nombre] });
      }
      return acc;
    }, []);

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener planes personalizados:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
