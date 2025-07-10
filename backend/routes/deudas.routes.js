import express from "express"
import {
  getDeudas,
  createDeuda,
  updateDeuda,
  deleteDeuda,
  getDeudaAlumno,
  getDeudasPorMes,
} from "../controllers/deudas.controller.js"

const router = express.Router()

router.get("/", getDeudas)
router.post("/", createDeuda)
router.put("/:id", updateDeuda)
router.delete("/:id", deleteDeuda)

router.get("/mes", getDeudasPorMes)
router.get("/alumno/:dni", getDeudaAlumno)

export default router