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
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Stack,
    Tooltip,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import { getInputFieldsGymUsers } from "@/const/inputs/gymUsers"

type UserRow = {
    id: number
    name: string
    email: string
    dni: number
    role_id: number
    auth_user_id: string
}

const ROLE_OPTIONS = [
    { id: 2, label: "Dueño" },
    { id: 3, label: "Recepcionista" },
]

export function MyGymUsers() {
    const [users, setUsers] = useState<UserRow[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [error, setError] = useState("")
    const currentUserId = Cookies.get("id") || ""

    const [formValues, setFormValues] = useState<Record<string, string>>({
        name: "",
        dni: "",
        email: "",
        password: "",
    })

    const [roleId, setRoleId] = useState<number>(3)
    const gymId = Cookies.get("gym_id") || ""

    const handleChange = (fieldName: string, value: string, maxLength?: number) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: maxLength ? value.slice(0, maxLength) : value,
        }))
    }

    const isFormValid = getInputFieldsGymUsers.every(field => {
        const val = formValues[field.name] ?? ""
        if (field.required && !val.trim()) return false
        if (field.minLength && val.trim().length < field.minLength) return false
        if (field.maxLength && val.trim().length > field.maxLength) return false
        if (field.regex && !field.regex.test(val)) return false
        return true
    })

    const fetchUsers = async () => {
        if (!gymId) return
        setLoadingUsers(true)
        setError("")
        try {
            const token = Cookies.get("token")
            const { data } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?gym_id=${gymId}`,
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )
            const items: UserRow[] = Array.isArray(data) ? data : data?.items ?? []
            setUsers(items)
        } catch (e: any) {
            setError(e?.response?.data?.error || "No se pudieron cargar los usuarios")
        } finally {
            setLoadingUsers(false)
        }
    }

    const onCreateUser = async () => {
        setError("")

        if (!isFormValid) {
            setError("Revisá los campos, hay datos inválidos")
            return
        }

        try {
            const token = Cookies.get("token")
            await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
                {
                    ...formValues,
                    dni: Number(formValues.dni),
                    gym_id: gymId,
                    role_id: roleId,
                },
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )
            await fetchUsers()
            setFormValues({ name: "", dni: "", email: "", password: "" })
        } catch (e: any) {
            setError(e?.response?.data?.error || "No se pudo crear el usuario")
        }
    }

    const onChangeRole = async (userId: number, newRoleId: number) => {
        try {
            const token = Cookies.get("token")
            await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`,
                { role_id: newRoleId },
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, role_id: newRoleId } : u))
            )
        } catch (e: any) {
            setError(e?.response?.data?.error || "No se pudo actualizar el rol")
        }
    }

    const onDeleteUser = async (userId: number) => {
        if (!confirm("¿Seguro que querés eliminar este usuario?")) return
        try {
            const token = Cookies.get("token")
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`,
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )
            setUsers(prev => prev.filter(u => u.id !== userId))
        } catch (e: any) {
            setError(e?.response?.data?.error || "No se pudo eliminar el usuario")
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [gymId])

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Usuarios de mi gimnasio
            </Typography>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
                <Box flex={1} width='100%'>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Crear usuario
                    </Typography>
                    <Stack direction="column" gap={2}>
                        {getInputFieldsGymUsers.map(field => {
                            const val = formValues[field.name] ?? ""

                            const length = String(val).length
                            const isTooShort = length > 0 && length < (field.minLength ?? 0)
                            const isTooLong = length > (field.maxLength ?? Infinity)
                            const invalidRegex = field.regex && !field.regex.test(val)

                            const helperText =
                                isTooShort
                                    ? `Mínimo ${field.minLength} caracteres`
                                    : isTooLong
                                        ? `Máximo ${field.maxLength} caracteres`
                                        : invalidRegex
                                            ? "Formato inválido"
                                            : field.maxLength
                                                ? `${length} / ${field.maxLength}`
                                                : ""

                            return (
                                <TextField
                                    key={field.name}
                                    label={field.label}
                                    fullWidth
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    value={val}
                                    onChange={e => handleChange(field.name, e.target.value, field.maxLength)}
                                    inputProps={{ maxLength: field.maxLength ?? undefined }}
                                    error={isTooShort || isTooLong || invalidRegex}
                                    helperText={helperText}
                                />
                            )
                        })}

                        <FormControl fullWidth>
                            <InputLabel id="role-select-label">Rol</InputLabel>
                            <Select
                                labelId="role-select-label"
                                label="Rol"
                                value={String(roleId)}
                                onChange={e => setRoleId(Number(e.target.value))}
                            >
                                {ROLE_OPTIONS.map(r => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            <Button
                                variant="contained"
                                disabled={!isFormValid}
                                onClick={onCreateUser}
                            >
                                Crear
                            </Button>
                        </Box>
                    </Stack>
                </Box>

                <Box flex={2} sx={{ maxWidth: "100%", overflowX: "auto" }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Lista de empleados
                    </Typography>

                    {loadingUsers ? (
                        <CircularProgress size={24} />
                    ) : (
                        <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">Nombre</TableCell>
                                        <TableCell align="center">Email</TableCell>
                                        <TableCell align="center">DNI</TableCell>
                                        <TableCell align="center">Rol</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell align="center">{u.name}</TableCell>
                                            <TableCell align="center">{u.email}</TableCell>
                                            <TableCell align="center">{u.dni}</TableCell>
                                            <TableCell align="center">
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={String(u.role_id)}
                                                        onChange={e => onChangeRole(u.id, Number(e.target.value))}
                                                        disabled={String(u.id) === currentUserId}
                                                    >
                                                        {ROLE_OPTIONS.map(r => (
                                                            <MenuItem key={r.id} value={r.id}>
                                                                {r.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip
                                                    title={
                                                        String(u.id) === currentUserId
                                                            ? "No podés eliminarte a vos mismo"
                                                            : "Eliminar usuario"
                                                    }
                                                >
                                                    <span>
                                                        <IconButton
                                                            onClick={() => onDeleteUser(u.id)}
                                                            color="error"
                                                            disabled={String(u.id) === currentUserId}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
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
                        </Box>
                    )}
                </Box>
            </Stack>
        </Paper>
    )
}
