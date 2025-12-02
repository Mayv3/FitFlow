"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"

type Gym = { id: string; name: string; logo_url?: string }
type UserRow = { id: number; name: string; email: string; dni: number; role_id: number; auth_user_id: string }

const ROLE_OPTIONS = [
  { id: 2, label: "Dueño" },
  { id: 3, label: "Recepcionista" },
]

export function ManageGymUsers() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [gymId, setGymId] = useState<string>("")
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingGyms, setLoadingGyms] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [dni, setDni] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState<number>(3)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<number>(3)

  useEffect(() => {
    (async () => {
      setLoadingGyms(true)
      setError("")
      try {
        const token = Cookies.get("token")
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        )
        const items: Gym[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
        setGyms(items)
        if (!gymId && items.length) setGymId(items[0].id)
      } catch (e: any) {
        setError(e?.response?.data?.error || "No se pudieron cargar los gimnasios")
      } finally {
        setLoadingGyms(false)
      }
    })()
  }, [])

  const fetchUsers = async (gid: string) => {
    if (!gid) return
    setLoadingUsers(true)
    setError("")
    try {
      const token = Cookies.get("token")
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?gym_id=${gid}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      const items: UserRow[] = Array.isArray(data) ? data : (data?.items ?? [])
      setUsers(items)
    } catch (e: any) {
      setError(e?.response?.data?.error || "No se pudieron cargar los usuarios")
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (gymId) fetchUsers(gymId)
  }, [gymId])

  const onCreateUser = async () => {
    setError("")
    if (!gymId || !name.trim() || !dni.trim() || !email.trim() || !password.trim() || !roleId) {
      setError("Completá todos los campos")
      return
    }
    try {
      const token = Cookies.get("token")
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
        { name, email, password, dni: Number(dni), gym_id: gymId, role_id: roleId },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      await fetchUsers(gymId)
      setName("")
      setDni("")
      setEmail("")
      setPassword("")
    } catch (e: any) {
      setError(e?.response?.data?.error || "No se pudo crear el usuario")
    }
  }

  const handleOpenEditDialog = (user: UserRow) => {
    setSelectedUser(user)
    setEditingRoleId(user.role_id)
    setEditDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    setError("")
    try {
      const token = Cookies.get("token")
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${selectedUser.id}`,
        { role_id: editingRoleId },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      await fetchUsers(gymId)
      setEditDialogOpen(false)
      setSelectedUser(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || "No se pudo actualizar el rol")
    }
  }

  const handleOpenDeleteDialog = (user: UserRow) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setError("")
    try {
      const token = Cookies.get("token")
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${selectedUser.id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      await fetchUsers(gymId)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || "No se pudo eliminar el usuario")
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Crea y administra los usuarios de cada gimnasio.
      </Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* Select de gimnasio */}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="gym-select-label">Gimnasio</InputLabel>
          <Select
            labelId="gym-select-label"
            label="Gimnasio"
            value={gymId}
            onChange={(e) => setGymId(e.target.value)}
          >
            {gyms.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
            {gyms.length === 0 && <MenuItem disabled value="">(Sin gimnasios)</MenuItem>}
          </Select>
        </FormControl>
        {loadingGyms && <CircularProgress size={24} />}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Crear usuario */}
      <Typography variant="h6" sx={{ mb: 1 }}>Crear usuario</Typography>
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <TextField label="Nombre y apellido" fullWidth value={name} onChange={e=>setName(e.target.value)} />
        <TextField label="DNI" fullWidth value={dni} onChange={e=>setDni(e.target.value)} />
        <TextField label="Email" type="email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mt: 2 }}>
        <TextField label="Contraseña" type="password" fullWidth value={password} onChange={e=>setPassword(e.target.value)} />
        <FormControl fullWidth>
          <InputLabel id="role-select-label">Rol</InputLabel>
          <Select
            labelId="role-select-label"
            label="Rol"
            value={String(roleId)}
            onChange={(e)=>setRoleId(Number(e.target.value))}
          >
            {ROLE_OPTIONS.map(r => <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display:"flex", alignItems:"center" }}>
          <Button variant="contained" onClick={onCreateUser}>Crear</Button>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Lista */}
      <Typography variant="h6" sx={{ mb: 1 }}>Lista de usuarios</Typography>
      {loadingUsers ? (
        <CircularProgress size={24} />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Auth ID</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.dni}</TableCell>
                <TableCell>{ROLE_OPTIONS.find(r=>r.id===u.role_id)?.label ?? u.role_id}</TableCell>
                <TableCell style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.auth_user_id}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenEditDialog(u)}
                    title="Editar rol"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(u)}
                    title="Eliminar usuario"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!users.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">Sin usuarios</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Dialog Editar Rol */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Rol de Usuario</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Usuario:</strong> {selectedUser.name}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="edit-role-label">Rol</InputLabel>
                <Select
                  labelId="edit-role-label"
                  label="Rol"
                  value={String(editingRoleId)}
                  onChange={(e) => setEditingRoleId(Number(e.target.value))}
                >
                  {ROLE_OPTIONS.map(r => (
                    <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateRole}>
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar Usuario?</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography>
              ¿Estás seguro de que deseas eliminar a <strong>{selectedUser.name}</strong> ({selectedUser.email})?
              <br />
              Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
