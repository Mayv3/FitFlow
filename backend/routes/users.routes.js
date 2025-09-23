import { Router } from "express"
import { handleChangePassword, handleDeleteUser, handleListUsers, handleUpdateUserRole } from "../controllers/users.controller.js"

const router = Router()

router.get("/", handleListUsers)
router.post("/change-password", handleChangePassword)

router.put("/:id", handleUpdateUserRole)
router.delete("/:id", handleDeleteUser)

export default router
