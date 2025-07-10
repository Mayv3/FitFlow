"use client"

import { useEffect, useRef, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormEnterToTab } from "@/components/FormEnterToTab"
import { useAppData } from "@/context/AppDataContext"
import { useUser } from "@/context/UserContext"
import axios from "axios"
import { notify } from "@/lib/toast"
import { motion } from "framer-motion"
import dayjs from "dayjs"
import { DatePicker } from "../../date-picker"

interface DeudaForm {
    DNI: string
    Nombre: string
    Tipo: string
    Monto: string
    Motivo: string
    Estado: string
    Responsable: string
}

export default function DebtsSection() {
    const { user } = useUser()
    const [deudas, setDeudas] = useState<any[]>([])
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState<DeudaForm>({
        DNI: "",
        Nombre: "",
        Tipo: "",
        Monto: "",
        Motivo: "",
        Estado: "No pagado",
        Responsable: user?.nombre || "",
    })
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingDeuda, setEditingDeuda] = useState<any | null>(null)
    const [editForm, setEditForm] = useState<DeudaForm>({ ...createForm })
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedDeuda, setSelectedDeuda] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [filteredDeudas, setFilteredDeudas] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const dataFiltrada = searchTerm ? filteredDeudas : deudas;

    const totalMes = deudas
        .filter(d => d.Estado === "No pagado")
        .reduce((acc, d) => acc + Number(d.Monto || 0), 0)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const paginatedDeudas = dataFiltrada.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchDeudas = async () => {
        try {
            const mes = selectedDate ? dayjs(selectedDate).month() + 1 : new Date().getMonth() + 1
            const anio = selectedDate ? dayjs(selectedDate).year() : new Date().getFullYear()

            console.log(mes, anio)
            const { data } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/mes?mes=${mes}&anio=${anio}`
            )
            setDeudas(data);
            setFilteredDeudas(data);
        } catch (error) {
            console.error("Error al cargar deudas:", error)
        }
    }

    const handleConfirmCreate = async () => {
        const { DNI, Nombre, Tipo, Monto, Motivo } = createForm
        if (!DNI || !Nombre || !Tipo || !Monto || !Motivo) {
            notify.error("Todos los campos son obligatorios")
            return
        }
        setIsSubmitting(true)
        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas`,
                {
                    dni: createForm.DNI,
                    nombre: createForm.Nombre,
                    tipo: createForm.Tipo,
                    monto: createForm.Monto,
                    motivo: createForm.Motivo,
                    estado: createForm.Estado,
                    responsable: user?.nombre || ""
                }
            )
            setDeudas((prev) => [...prev, data])
            setShowCreateDialog(false)
            setCreateForm({ DNI: "", Nombre: "", Tipo: "", Monto: "", Motivo: "", Estado: "No pagado", Responsable: user?.nombre || "" })
            notify.success("Deuda creada correctamente")
        } catch {
            notify.error("Error al crear deuda")
        }
        setIsSubmitting(false)
    }

    const handleConfirmEdit = async () => {
        if (!editingDeuda) return
        setIsSubmitting(true)
        try {
            const { data } = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/${editingDeuda.ID}`,
                editForm
            )
            setDeudas((prev) =>
                prev.map((d) => (d.ID === editingDeuda.ID ? { ...d, ...data } : d))
            )
            setShowEditDialog(false)
            setEditingDeuda(null)
            notify.success("Deuda actualizada")
        } catch {
            notify.error("Error al editar deuda")
        }
        setIsSubmitting(false)
    }

    const handleConfirmDelete = async () => {
        if (!selectedDeuda) return
        setIsSubmitting(true)
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/${selectedDeuda.ID}`
            )
            setDeudas((prev) => prev.filter((d) => d.ID !== selectedDeuda.ID))
            setShowDeleteDialog(false)
            setSelectedDeuda(null)
            notify.info("Deuda eliminada")
        } catch {
            notify.error("Error al eliminar deuda")
        }
        setIsSubmitting(false)
    }

    const handleSearch = (term: string) => {
        setSearchTerm(term)
        const lowerTerm = term.toLowerCase()
        const filtered = deudas.filter(
            d => d.Nombre.toLowerCase().includes(lowerTerm) || d.DNI.includes(lowerTerm)
        )
        setFilteredDeudas(filtered)
        setCurrentPage(1)
    }

    useEffect(() => {
        setCurrentPage(1)
        fetchDeudas()
    }, [selectedDate])
    return (
        <TabsContent value="deudas" className="space-y-4">
            <Card>
                <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Deudas</CardTitle>
                            <CardDescription>Gestión de deudas registradas</CardDescription>
                        </div>
                        <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar deuda
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-start">
                        <div className="flex justify-end mb-4 gap-2">
                            <Input
                                placeholder="Nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="max-w-sm"
                            />
                            <DatePicker date={selectedDate} setDate={setSelectedDate} />
                        </div>
                        <div className="text-right text-sm font-medium ">
                            <p className={`${totalMes === 0 ? 'bg-green-200' : 'bg-red-100'} rounded p-2 text-lg dark:bg-zinc-900`}>Total adeudado del mes:{' '}
                                <span className={`font-bold ${totalMes === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalMes}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="overflow-auto border rounded-md">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="grid grid-cols-9 text-sm pt-3">
                                    <TableHead className="py-2 text-center">DNI</TableHead>
                                    <TableHead className="py-2 text-center">Nombre</TableHead>
                                    <TableHead className="py-2 text-center">Tipo</TableHead>
                                    <TableHead className="py-2 text-center">Monto</TableHead>
                                    <TableHead className="py-2 text-center">Motivo</TableHead>
                                    <TableHead className="py-2 text-center">Fecha</TableHead>
                                    <TableHead className="py-2 text-center">Responsable</TableHead>
                                    <TableHead className="py-2 text-center">Pago</TableHead>
                                    <TableHead className="py-2 text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDeudas.length ? (
                                    paginatedDeudas.map((deuda, i) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="grid grid-cols-9 items-center border-b py-2 text-center"
                                        >
                                            <TableCell>{deuda.DNI}</TableCell>
                                            <TableCell>{deuda.Nombre}</TableCell>
                                            <TableCell><span className={`font-semibold px-2 dark:bg-zinc-900 py-1 rounded ${deuda.Tipo === "El alumno le debe al gimnasio" ? "bg-red-200" : "bg-orange-300"}`}>
                                                {deuda.Tipo}
                                            </span></TableCell>
                                            <TableCell>${deuda.Monto}</TableCell>
                                            <TableCell>{deuda.Motivo}</TableCell>
                                            <TableCell>{deuda.Fecha}</TableCell>
                                            <TableCell>{deuda.Responsable}</TableCell>
                                            <TableCell>
                                                <span className={`font-semibold px-2 dark:bg-zinc-900 py-1 rounded ${deuda.Estado === "Pagado" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>
                                                    {deuda.Estado}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingDeuda(deuda)
                                                            setEditForm({
                                                                DNI: deuda.DNI,
                                                                Nombre: deuda.Nombre,
                                                                Tipo: deuda.Tipo,
                                                                Monto: deuda.Monto,
                                                                Motivo: deuda.Motivo,
                                                                Estado: deuda.Estado,
                                                                Responsable: deuda.Responsable,
                                                            })
                                                            setShowEditDialog(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedDeuda(deuda)
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
                                        <TableCell colSpan={9} className="text-center py-4">
                                            No hay deudas registradas en este mes
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {deudas.length > itemsPerPage && (
                            <div className="flex justify-center gap-2 my-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="flex items-center px-2 text-sm">
                                    Página {currentPage} de {Math.ceil(deudas.length / itemsPerPage)}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            prev < Math.ceil(deudas.length / itemsPerPage) ? prev + 1 : prev
                                        )
                                    }
                                    disabled={currentPage >= Math.ceil(deudas.length / itemsPerPage)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Crear deuda */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar Deuda"
                description="Completa los datos de la deuda"
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        {Object.entries(createForm).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <Label>{key}</Label>

                                {/* Select para Tipo y Estado */}
                                {key === "Tipo" || key === "Estado" ? (
                                    <Select
                                        value={value}
                                        onValueChange={(v) =>
                                            setCreateForm((p) => ({ ...p, [key]: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Seleccionar ${key.toLowerCase()}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {key === "Tipo" ? (
                                                <>
                                                    <SelectItem value="El alumno le debe al gimnasio">
                                                        El alumno le debe al gimnasio
                                                    </SelectItem>
                                                    <SelectItem value="El gimnasio le debe al alumno">
                                                        El gimnasio le debe al alumno
                                                    </SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="No pagado">No pagado</SelectItem>
                                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>

                                ) : key === "Responsable" ? (
                                <Input value={user?.nombre || ""} disabled />
                                ) : (
                                <Input
                                    type={key === "Monto" || key === "DNI" ? "number" : "text"}
                                    inputMode={key === "Monto" || key === "DNI" ? "numeric" : undefined}
                                    value={value}
                                    onChange={(e) =>
                                        setCreateForm((p) => ({ ...p, [key]: e.target.value }))
                                    }
                                />
              )}
                            </div>
                        ))}
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Editar deuda */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar Deuda"
                description="Modifica los datos de la deuda"
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        {Object.entries(editForm).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <Label>{key}</Label>
                                {key === "Tipo" || key === "Estado" ? (
                                    <Select
                                        value={value}
                                        onValueChange={(v) =>
                                            setEditForm((p) => ({ ...p, [key]: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {key === "Tipo" ? (
                                                <>
                                                    <SelectItem value="El alumno le debe al gimnasio">
                                                        El alumno le debe al gimnasio
                                                    </SelectItem>
                                                    <SelectItem value="El gimnasio le debe al alumno">
                                                        El gimnasio le debe al alumno
                                                    </SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="No pagado">No pagado</SelectItem>
                                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : key === "Responsable" ? (
                                    <Input value={user?.nombre} disabled />
                                ) : (
                                    <Input
                                        type={key === "Monto" || key === "DNI" ? "number" : "text"}
                                        value={value}
                                        onChange={(e) =>
                                            setEditForm((p) => ({ ...p, [key]: e.target.value }))
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Eliminar deuda */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar Deuda?"
                description="Esta acción no se puede deshacer"
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                loading={isSubmitting}
                onConfirm={handleConfirmDelete}
            >
                {selectedDeuda && (
                    <div className="text-sm p-4 bg-muted/50 rounded-md space-y-2">
                        <div><strong>Nombre:</strong> {selectedDeuda.Nombre}</div>
                        <div><strong>Motivo:</strong> {selectedDeuda.Motivo}</div>
                        <div><strong>Monto:</strong> ${selectedDeuda.Monto}</div>
                    </div>
                )}
            </ConfirmDialog>
        </TabsContent>
    )
}
