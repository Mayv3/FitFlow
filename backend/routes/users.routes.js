// routes/users.routes.js
import { Router } from "express"
import { handleListUsers } from "../controllers/users.controller.js"

const router = Router()

router.get("/", handleListUsers)

export default router
