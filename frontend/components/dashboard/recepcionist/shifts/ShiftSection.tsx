"use client"

import { useEffect, useRef, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash, CalendarDays, User, ClipboardList } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext"
import { useAppData } from "@/context/AppDataContext"

import axios from "axios"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import { notify } from "@/lib/toast"
import { FormEnterToTab } from "@/components/FormEnterToTab"
import { parse } from 'date-fns'
import { es } from 'date-fns/locale'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface TurnoForm {
    Tipo: string
    Fecha_turno: Date | null
    Profesional: string
    Responsable: string
    Hora: string
}

export default function ShiftsSection() {
    const { turnos, setTurnos } = useAppData()
    const { user } = useUser()

    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedType, setSelectedType] = useState("todas")
    const [fechaError, setFechaError] = useState(false)
    const isFirstLoad = useRef(true)

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState<TurnoForm>({ Tipo: "", Fecha_turno: null, Profesional: "", Responsable: "", Hora: "", })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingTurno, setEditingTurno] = useState<any | null>(null)
    const [editForm, setEditForm] = useState<TurnoForm>({ Tipo: "", Fecha_turno: null, Profesional: "", Responsable: "", Hora: "", })

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedTurno, setSelectedTurno] = useState<any | null>(null)
    const [isSubmitting, setisSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const filteredTurnos = turnos.filter((turno) => {
        if (selectedType === "todas") return true
        return turno.Tipo === selectedType
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedShifts = filteredTurnos.slice(startIndex, endIndex)

    const parseDate = (str: string): Date | null => {
        try {
            const parsed = parse(str, 'dd/MM/yyyy', new Date(), { locale: es })
            return isNaN(parsed.getTime()) ? null : parsed
        } catch {
            return null
        }
    }

    const fetchTurnosPorFecha = async () => {
        try {
            const fechaFormateada = dayjs(selectedDate).format("DD/MM/YYYY")
            const { data } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos?fecha=${fechaFormateada}`
            )
            setTurnos(data)
            console.log(turnos)
        } catch (error) {
            console.error("Error al cargar turnos por fecha:", error)
        }
    }

    const handleConfirmCreate = async () => {

        if (!createForm.Fecha_turno || !createForm.Hora || !createForm.Profesional || !createForm.Tipo) {
            notify.error("Por favor completa todos los campos antes de enviar.");
            return;
        }

        if (!createForm.Fecha_turno) {
            setFechaError(true)
            return
        }
        setFechaError(false)
        setisSubmitting(true)
        try {
            const payload = {
                tipo: createForm.Tipo,
                fecha_turno: dayjs(createForm.Fecha_turno).format("DD/MM/YYYY"),
                profesional: createForm.Profesional,
                responsable: user?.nombre,
                hora: createForm.Hora,
            }

            const { data: nuevoTurno } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`,
                payload
            )

            // opcional: agregar solo si está dentro de 7 días
            const fechaDelTurno = dayjs(nuevoTurno.Fecha_turno, "DD/MM/YYYY")
            const hoy = dayjs()
            if (
                fechaDelTurno.isSameOrAfter(hoy, "day") &&
                fechaDelTurno.isSameOrBefore(hoy.add(7, "day"), "day")
            ) {
                setTurnos((prev) => [...prev, nuevoTurno])
            }

            fetchTurnosPorFecha()
            setShowCreateDialog(false)
            setCreateForm({
                Tipo: "",
                Fecha_turno: null,
                Profesional: "",
                Responsable: "",
                Hora: "",
            })
            notify.success("¡Turno registrado con éxito!")
            setisSubmitting(false)
        } catch (error) {
            console.error("Error creando turno:", error)
            notify.error("Error al registrar el turno")
        }
    }

    const handleConfirmEdit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!editingTurno) return
        setisSubmitting(true)

        try {
            const payload = {
                Tipo: editForm.Tipo,
                Fecha_turno: dayjs(editForm.Fecha_turno!).format("DD/MM/YYYY"),
                Profesional: editForm.Profesional,
                Responsable: editForm.Responsable,
                Hora: editForm.Hora,
            }

            const { data: turnoActualizado } = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${editingTurno.ID}`,
                payload
            )

            setTurnos((prev) =>
                prev.map((t) =>
                    t.ID === editingTurno.ID ? { ...t, ...turnoActualizado } : t
                )
            )
            setShowEditDialog(false)
            setEditingTurno(null)
            notify.success("¡Turno editado con éxito!")
        } catch (error) {
            notify.error("Error al editar el turno")
        }
        setisSubmitting(false)
    }

    const handleConfirmDelete = async () => {
        if (!selectedTurno) return
        setisSubmitting(true)
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${selectedTurno.ID}`
            )
            setTurnos((prev) =>
                prev.filter((t) => t.ID !== selectedTurno.ID)
            )
            setShowDeleteDialog(false)
            setSelectedTurno(null)
            notify.info("¡Turno eliminado con éxito!")
        } catch (error) {
            notify.error("Error al eliminar el turno")
        }
        setisSubmitting(false)
    }

    useEffect(() => {
        if (isFirstLoad.current) {
            isFirstLoad.current = false
            return
        }
        fetchTurnosPorFecha()
    }, [selectedDate])


    useEffect(() => {
        setCurrentPage(1)
    }, [selectedDate, selectedType]);

    return (
        <TabsContent value="shifts" className="space-y-4">
            <Card>
                <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
                    <div className="flex justify-between">
                        <div>
                            <CardTitle>Turnos</CardTitle>
                            <CardDescription>Gestiona los turnos agendados.</CardDescription>
                        </div>
                        <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar turno
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Label>Fecha</Label>
                            <DatePicker
                                date={selectedDate}
                                setDate={setSelectedDate}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Tipo</Label>
                            <Select
                                value={selectedType}
                                onValueChange={setSelectedType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todos</SelectItem>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-auto md:border rounded-md max-w-[calc(100vw-2rem)]">
                        <div className="min-w-[900px] hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">Tipo</TableHead>
                                        <TableHead className="text-center">Fecha</TableHead>
                                        <TableHead className="text-center">Profesional</TableHead>
                                        <TableHead className="text-center">Horario</TableHead>
                                        <TableHead className="text-center">Responsable</TableHead>
                                        <TableHead className="text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedShifts.length ? (
                                        paginatedShifts.map((turno, i) => (
                                            <motion.tr
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="hover:bg-accent"
                                            >
                                                <TableCell className="text-center">
                                                    {turno.Tipo}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {turno.Fecha_turno}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {turno.Profesional}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {turno.Hora}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {turno.Responsable}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingTurno(turno)
                                                                setEditForm({
                                                                    Tipo: turno.Tipo,
                                                                    Fecha_turno: parse(
                                                                        turno.Fecha_turno,
                                                                        "dd/MM/yyyy",
                                                                        new Date(),
                                                                        { locale: es }
                                                                    ),
                                                                    Profesional: turno.Profesional,
                                                                    Responsable: turno.Responsable,
                                                                    Hora: turno.Hora,
                                                                })
                                                                setShowEditDialog(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedTurno(turno)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4">
                                                No hay turnos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="block md:hidden space-y-4">
                            {paginatedShifts.length > 0 ? (
                                paginatedShifts.map((turno, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="rounded-lg border bg-white dark:bg-zinc-900 shadow-sm p-4 space-y-2"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-lg font-bold">{turno.Tipo}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-medium font-semibold">{turno.Hora} - {turno.Fecha_turno}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-foreground">
                                            <div>
                                                <p>Profesional: {turno.Profesional}</p>
                                            </div>
                                            <div>
                                                <p>Responsable: {turno.Responsable}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="sm: w-full bg-orange-200"
                                                onClick={() => {
                                                    setEditingTurno(turno)
                                                    setEditForm({
                                                        Tipo: turno.Tipo,
                                                        Fecha_turno: parse(turno.Fecha_turno, "dd/MM/yyyy", new Date(), { locale: es }),
                                                        Profesional: turno.Profesional,
                                                        Responsable: turno.Responsable,
                                                        Hora: turno.Hora,
                                                    })
                                                    setShowEditDialog(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="sm: w-full bg-red-200"
                                                onClick={() => {
                                                    setSelectedTurno(turno)
                                                    setShowDeleteDialog(true)
                                                }}
                                            >
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">
                                    No hay turnos registrados.
                                </p>
                            )}
                        </div>

                        {filteredTurnos.length > itemsPerPage && (
                            <div className="flex justify-center gap-2 my-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="flex items-center px-2 text-sm">
                                    Página {currentPage} de {Math.ceil(filteredTurnos.length / itemsPerPage)}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            prev < Math.ceil(filteredTurnos.length / itemsPerPage) ? prev + 1 : prev
                                        )
                                    }
                                    disabled={currentPage >= Math.ceil(filteredTurnos.length / itemsPerPage)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}

                    </div>
                </CardContent>
            </Card>

            {/* Crear Turno */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar Turno"
                description="Completa los datos del nuevo turno"
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Responsable</Label>
                            <Input value={user?.nombre} disabled />
                        </div>
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select
                                value={createForm.Tipo}
                                onValueChange={(v) =>
                                    setCreateForm((p) => ({ ...p, Tipo: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Profesional</Label>
                            <Input
                                capitalizeFirst
                                value={createForm.Profesional}
                                onChange={(e) =>
                                    setCreateForm((p) => ({
                                        ...p,
                                        Profesional: e.target.value,
                                    }))
                                }
                                placeholder="Ej: Gabriel Torres"
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Fecha Turno</Label>
                            <DatePicker
                                date={createForm.Fecha_turno ?? undefined}
                                setDate={(date) =>
                                    setCreateForm((p) => ({ ...p, Fecha_turno: date }))
                                }
                            />
                            {fechaError && (
                                <span className="text-red-500 text-sm">
                                    La fecha del turno es obligatoria.
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>Horario</Label>
                            <Input
                                type="time"
                                value={createForm.Hora}
                                onChange={(e) =>
                                    setCreateForm((p) => ({ ...p, Hora: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Editar Turno */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar Turno"
                description="Modifica los datos del turno."
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Responsable</Label>
                            <Input value={editForm.Responsable} disabled />
                        </div>
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select
                                value={editForm.Tipo}
                                onValueChange={(v) =>
                                    setEditForm((p) => ({ ...p, Tipo: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Fecha Turno</Label>
                            <DatePicker
                                date={editForm.Fecha_turno ?? undefined}
                                setDate={(date) =>
                                    setEditForm((p) => ({ ...p, Fecha_turno: date }))
                                }
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Hora</Label>
                            <Input
                                type="time"
                                value={editForm.Hora}
                                onChange={(e) =>
                                    setEditForm((p) => ({ ...p, Hora: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Profesional</Label>
                            <Input
                                capitalizeFirst
                                value={editForm.Profesional}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        Profesional: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Eliminar Turno */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar Turno?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                loading={isSubmitting}
                onConfirm={handleConfirmDelete}
            >
                {selectedTurno && (
                    <div className="space-y-4 p-4 bg-muted/50 text-sm rounded-md">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <ClipboardList className="h-4 w-4 text-primary mr-2" />
                                <p>Tipo</p>
                            </div>
                            {selectedTurno.Tipo}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 text-primary mr-2" />
                                <p>Fecha: </p>
                            </div>
                            {selectedTurno.Fecha_turno}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <User className="h-4 w-4 text-primary mr-2" />
                                <p>Profesional:</p>
                            </div>
                            {selectedTurno.Profesional}
                        </div>
                    </div>
                )}
            </ConfirmDialog>
        </TabsContent>
    )
}
