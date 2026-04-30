import { Router } from "express"
import { handleChangePassword, handleDeleteUser, handleListUsers, handleUpdateUserRole } from "../controllers/users.controller.js"
import { requireRole } from "../middleware/requireRole.js"

const adminOnly = requireRole(1, 2)

const router = Router()

router.get("/", adminOnly, handleListUsers)
router.post("/change-password", handleChangePassword) // any authenticated user (own password)
router.put("/:id", adminOnly, handleUpdateUserRole)
router.delete("/:id", adminOnly, handleDeleteUser)

export default router
