"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/dashboard/date-picker"
import dayjs from "dayjs"
import axios from "axios"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PlusCircle, Trash } from "lucide-react"
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { notify } from "@/lib/toast"
import { FormEnterToTab } from "@/components/FormEnterToTab"

interface Egreso {
    ID: string
    Fecha: string
    Motivo: string
    Monto: string
    Responsable: string
    Tipo: string
}

export default function EgresosSection() {
    const [egresos, setEgresos] = useState<Egreso[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedType, setSelectedType] = useState("todos")
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [egresoAEliminar, setEgresoAEliminar] = useState<Egreso | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isSubmitting, setisSubmitting] = useState(false);
    const { user } = useUser()

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [form, setForm] = useState({
        Fecha: dayjs().format("DD/MM/YYYY"),
        Motivo: "",
        Monto: "",
        Responsable: user?.nombre,
        Tipo: "GIMNASIO"
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedShifts = egresos.slice(startIndex, endIndex)

    const fetchEgresos = async () => {
        const anio = dayjs(selectedDate).year()
        const mes = dayjs(selectedDate).month() + 1
        console.log("Llamando fetchEgresos", { selectedDate, selectedType })

        try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos?anio=${anio}&mes=${mes}${selectedType !== "todos" ? `&tipo=${selectedType}` : ""}`
            const { data } = await axios.get(url)
            setEgresos(data)
        } catch (err) {
            console.error("Error al cargar egresos", err)
        }
    }

    const handleCreateEgreso = async () => {

        if (!form.Fecha || !form.Motivo.trim() || !form.Monto.trim() || !form.Tipo) {
            notify.error("Por favor completa todos los campos antes de enviar.");
            return;
        }

        setisSubmitting(true)
        try {
            const payload = { ...form }

            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos`,
                payload
            )

            const nuevoEgreso: Egreso = {
                ID: String(data.id),
                Fecha: data.Fecha,
                Motivo: data.Motivo,
                Monto: data.Monto,
                Responsable: data.Responsable,
                Tipo: data.Tipo,
            }

            setEgresos(prev => [...prev, nuevoEgreso])

            setShowCreateDialog(false)
            notify.success("¡Egreso registrado con éxito!")

            setForm({
                Fecha: dayjs().format("DD/MM/YYYY"),
                Motivo: "",
                Monto: "",
                Responsable: user?.nombre ?? "",
                Tipo: "GIMNASIO",
            })
        } catch (error) {
            console.error(error)
            notify.error("Error al registrar el egreso")
        }
        setisSubmitting(false)
    }

    const handleDeleteEgreso = async () => {
        if (!egresoAEliminar) return
        setisSubmitting(true)
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos/${egresoAEliminar.ID}`)
            setEgresos(prev => prev.filter(e => e.ID !== egresoAEliminar.ID))
            setShowDeleteDialog(false)
            setEgresoAEliminar(null)
            notify.info("¡Egreso eliminado con éxito!")
        } catch (error) {
            console.log(error)
            notify.error("Error al eliminar el egreso")
        }
        setisSubmitting(false)
    }

    useEffect(() => {
        fetchEgresos();
        setCurrentPage(1)
    }, [selectedDate, selectedType])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between bg-orange-50 mb-4 dark:bg-zinc-900 rounded-t-lg">
                <div>
                    <CardTitle>Egresos</CardTitle>
                    <CardDescription>Listado de egresos filtrado por fecha y tipo</CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Egreso
                </Button>
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
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                                <SelectItem value="CLASE">Clase</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md md:border overflow-auto max-w-[calc(100vw-2rem)]">
                    <div className="hidden md:block">
                        <div className="min-w-[800px] overflow-x-auto">
                            <Table className="table-fixed w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center w-1/6">Fecha</TableHead>
                                        <TableHead className="text-center w-1/6">Motivo</TableHead>
                                        <TableHead className="text-center w-1/6">Monto</TableHead>
                                        <TableHead className="text-center w-1/6">Responsable</TableHead>
                                        <TableHead className="text-center w-1/6">Tipo</TableHead>
                                        <TableHead className="text-center w-1/6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {egresos.length > 0 ? (
                                        paginatedShifts.map((e, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-center">{e.Fecha}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="truncate overflow-hidden whitespace-nowrap max-w-[160px] mx-auto">
                                                        {e.Motivo}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">${e.Monto}</TableCell>
                                                <TableCell className="text-center">{e.Responsable}</TableCell>
                                                <TableCell className="text-center">{e.Tipo}</TableCell>
                                                <TableCell className="text-center">
                                                    <button
                                                        onClick={() => {
                                                            setEgresoAEliminar(e)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        className="text-red-600 font-medium hover:underline"
                                                    >
                                                        <Trash className="h-4 w-4 text-destructive" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                No hay egresos para este mes.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Vista tipo cards para mobile */}
                    <div className="block md:hidden space-y-4 mt-4">
                        {egresos.length > 0 ? (
                            paginatedShifts.map((e, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border bg-white dark:bg-zinc-900 p-4 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="text-lg font-bold">{e.Tipo}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-medium font-semibold">{e.Fecha} -  ${e.Monto}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="text-medium font-medium">Responsable: {e.Responsable}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <i className="text-medium font-medium">{e.Motivo}</i>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={() => {
                                                setEgresoAEliminar(e)
                                                setShowDeleteDialog(true)
                                            }}
                                            className="text-destructive flex items-center justify-center gap-1 w-full bg-red-500 p-2 rounded-lg text-white"
                                        >
                                            <Trash className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-muted-foreground">
                                No hay egresos para este mes.
                            </p>
                        )}
                    </div>

                    {egresos.length > itemsPerPage && (
                        <div className="flex justify-center gap-2 my-4">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>
                            <span className="flex items-center px-2 text-sm">
                                Página {currentPage} de {Math.ceil(egresos.length / itemsPerPage)}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        prev < Math.ceil(egresos.length / itemsPerPage) ? prev + 1 : prev
                                    )
                                }
                                disabled={currentPage >= Math.ceil(egresos.length / itemsPerPage)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
                <ConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title="¿Eliminar egreso?"
                    description="Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    destructive
                    loading={isSubmitting}
                    onConfirm={handleDeleteEgreso}
                >
                    {egresoAEliminar && (
                        <div className="dark:bg-zinc-900 space-y-2 text-lg md:text-sm p-4 bg-gray-100 rounded text-orange-600">
                            <p><strong>Fecha:</strong> {egresoAEliminar.Fecha}</p>
                            <p className="max-w-xs overflow-hidden text-ellipsis break-words line-clamp-3">
                                <strong>Motivo:</strong> {egresoAEliminar.Motivo}
                            </p>
                            <p><strong>Monto:</strong> ${egresoAEliminar.Monto}</p>
                        </div>
                    )}
                </ConfirmDialog>
                <ConfirmDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    title="Registrar Egreso"
                    description="Completa los datos para registrar un egreso"
                    confirmText="Registrar"
                    cancelText="Cancelar"
                    loading={isSubmitting}
                    onConfirm={handleCreateEgreso}
                >
                    <FormEnterToTab>
                        <div className="space-y-4 text-sm bg-background text-foreground">
                            <div className="flex flex-col">
                                <Label>Responsable</Label>
                                <Input
                                    className="border border-input bg-background text-foreground px-2 py-1 rounded cursor-disabled"
                                    value={user?.nombre}
                                    disabled
                                    onChange={(e) => setForm(prev => ({ ...prev, Responsable: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col">
                                <Label>Tipo</Label>
                                <Select value={form.Tipo} onValueChange={(val) => setForm(prev => ({ ...prev, Tipo: val }))}>
                                    <SelectTrigger className="bg-background text-foreground border-input">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GIMNASIO">GIMNASIO</SelectItem>
                                        <SelectItem value="CLASE">CLASE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col">
                                <Label>Fecha</Label>
                                <DatePicker
                                    date={selectedDate}
                                    setDate={setSelectedDate}
                                />
                            </div>
                            <div className="flex flex-col">
                                <Label>Motivo</Label>
                                <Input
                                    capitalizeFirst
                                    required
                                    className="border border-input bg-background text-foreground px-2 py-1 rounded"
                                    value={form.Motivo}
                                    onChange={(e) => setForm(prev => ({ ...prev, Motivo: e.target.value }))}
                                    placeholder="Motivo por el egreso"
                                />
                            </div>
                            <div className="flex flex-col">
                                <Label>Monto</Label>
                                <Input
                                    type="number"
                                    className="border border-input bg-background text-foreground px-2 py-1 rounded"
                                    value={form.Monto}
                                    onChange={(e) => setForm(prev => ({ ...prev, Monto: e.target.value }))}
                                    placeholder="Ej: 20000"
                                />
                            </div>

                        </div>
                    </FormEnterToTab>
                </ConfirmDialog>
            </CardContent>
        </Card>

    )
}
