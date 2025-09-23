"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Paper,
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
} from "@mui/material"

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

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Usuarios del gimnasio</Typography>
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
              </TableRow>
            ))}
            {!users.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Sin usuarios</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}
