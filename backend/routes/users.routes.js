import { Router } from "express"
import { handleChangePassword, handleListUsers } from "../controllers/users.controller.js"

const router = Router()

router.get("/", handleListUsers)
router.post("/change-password", handleChangePassword)

export default router
