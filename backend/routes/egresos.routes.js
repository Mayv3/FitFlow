import express from "express";
import { getEgresos, createEgreso, removeEgreso } from "../controllers/egresos.controller.js";

const router = express.Router();

router.get("/", getEgresos);
router.post("/", createEgreso);
router.delete("/:id", removeEgreso);

export default router;
