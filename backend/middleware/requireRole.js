// Roles: OWNER=1, ADMINISTRADOR=2, RECEPCIONISTA=3
// Must be used after verifyToken (depends on req.user)

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roleId = Number(req.user?.app_metadata?.role_id)
    if (!roleId || !allowedRoles.includes(roleId)) {
      return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' })
    }
    next()
  }
}
