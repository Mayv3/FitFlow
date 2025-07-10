"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash, Edit, Tag, Box, DollarSign, CalendarDays, FileText, Coins } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppData } from "@/context/AppDataContext"
import { notify } from "@/lib/toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { FormEnterToTab } from "@/components/FormEnterToTab"
import { parse } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PlansSection() {
    const { planes, setPlanes } = useAppData();

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState({ Tipo: "GIMNASIO", "Plan o Producto": "", Precio: "", numero_Clases: "", Coins: "" })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any | null>(null)
    const [editForm, setEditForm] = useState({ Tipo: "", "Plan o Producto": "", Precio: "", numero_Clases: "", Coins: "" })

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null)

    const [showAumentosDialog, setShowAumentosDialog] = useState(false)
    const [aumentos, setAumentos] = useState<any[]>([])
    const [planSeleccionado, setPlanSeleccionado] = useState<any | null>(null)

    const [isSubmitting, setisSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("")

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const filteredPlanes = planes.filter(plan => {
        const term = searchTerm.toLowerCase()
        return (
            plan['Plan o Producto']?.toLowerCase().includes(term) ||
            plan.Tipo?.toLowerCase().includes(term)
        )
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedPlanes = filteredPlanes.slice(startIndex, endIndex)

    const parseDate = (str: string): Date | null => {
        try {
            const parsed = parse(str, 'dd/MM/yyyy', new Date(), { locale: es })
            return isNaN(parsed.getTime()) ? null : parsed
        } catch {
            return null
        }
    }

    const handleConfirmCreate = async () => {
        const { Tipo, 'Plan o Producto': plan, Precio, numero_Clases, Coins } = createForm;

        if (!plan || !Precio || !numero_Clases || !Coins) {
            notify.error("Por favor, completá todos los campos obligatorios.");
            return;
        }

        setisSubmitting(true);
        try {
            const { data: nuevoPlan } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`, createForm);
            setPlanes(prev => [...prev, nuevoPlan]);
            setShowCreateDialog(false);
            setCreateForm({ Tipo: "", "Plan o Producto": "", Precio: "", numero_Clases: "", Coins });
            notify.success("¡Plan registrado con éxito!");
        } catch (error) {
            notify.error("Error al registrar el plan");
        }
        setisSubmitting(false);
    };

    const handleConfirmEdit = async () => {
        if (!editingPlan) return

        const { Tipo, 'Plan o Producto': plan, Precio, numero_Clases } = editForm;

        if (!plan || !Precio || !numero_Clases) {
            notify.error("Por favor, completá todos los campos obligatorios.");
            return;
        }

        setisSubmitting(true);
        try {
            const { data: planActualizado } = await axios.patch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${editingPlan.ID}`,
                editForm
            );

            setPlanes(prev =>
                prev.map(plan => plan.ID === editingPlan.ID ? planActualizado : plan)
            );

            setShowEditDialog(false);
            setEditingPlan(null);
            notify.success("¡Plan editado con éxito!");
        } catch (error) {
            notify.error("Error al editar el plan");
        }
        setisSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPlan) return

        setisSubmitting(true)
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${selectedPlan.ID}`)

            setPlanes(prev =>
                prev.filter(plan => plan.ID !== selectedPlan.ID)
            )
            setShowDeleteDialog(false)
            setSelectedPlan(null)
            notify.info("¡Plan eliminado con éxito!")
        } catch (error) {
            notify.error("Error al eliminar el plan")
        }
        setisSubmitting(false)
    }

    const handleShowAumentos = async (plan: any) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/aumentos?plan=${encodeURIComponent(plan['Plan o Producto'])}`)
            setAumentos(res.data)
            setPlanSeleccionado(plan)
            setShowAumentosDialog(true)
        } catch (error) {
            console.error('Error al obtener aumentos:', error)
            alert('Error al cargar aumentos.')
        }
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])


    return (
        <TabsContent value="plans" className="space-y-4">
            <Card>
                <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
                    <div className="flex justify-between">
                        <div>
                            <CardTitle>Planes</CardTitle>
                            <CardDescription>Gestiona tus planes y productos.</CardDescription>
                        </div>
                        <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar plan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col max-w-sm mb-4">
                        <Label htmlFor="search">Buscar por nombre o tipo</Label>
                        <Input
                            id="search"
                            type="text"
                            placeholder="Ej: personalizado, gimnasio, clase..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                        <div className="min-w-[800px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="grid grid-cols-7">
                                        <TableHead className="flex items-center justify-center">Tipo</TableHead>
                                        <TableHead className="flex items-center justify-center col-span-2">Plan</TableHead>
                                        <TableHead className="flex items-center justify-center">Precio</TableHead>
                                        <TableHead className="flex items-center justify-center">Clases</TableHead>
                                        <TableHead className="flex items-center justify-center">Coins</TableHead>
                                        <TableHead className="flex items-center justify-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {paginatedPlanes.length > 0 ? (
                                        paginatedPlanes.map((plan, i) => (
                                            <TableRow key={i} className="grid grid-cols-7 hover:bg-accent">
                                                <TableCell className="flex items-center justify-center">{plan.Tipo}</TableCell>
                                                <TableCell className="flex items-center justify-center col-span-2">{plan['Plan o Producto']}</TableCell>
                                                <TableCell className="flex items-center justify-center">{plan.Precio}</TableCell>
                                                <TableCell className="flex items-center justify-center">{plan.numero_Clases}</TableCell>
                                                <TableCell className="flex items-center justify-center">{plan.Coins}</TableCell>
                                                <TableCell className="flex items-center justify-center">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingPlan(plan)
                                                                setEditForm({
                                                                    Tipo: plan.Tipo,
                                                                    'Plan o Producto': plan['Plan o Producto'],
                                                                    Precio: plan.Precio,
                                                                    numero_Clases: `${plan.numero_Clases}`,
                                                                    Coins: plan.Coins
                                                                })
                                                                setShowEditDialog(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Button>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleShowAumentos(plan)}
                                                        >
                                                            <FileText className="h-4 w-4 text-primary" />
                                                        </Button>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedPlan(plan)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="grid grid-cols-5">
                                            <TableCell colSpan={5} className="col-span-5 text-center py-4 text-muted-foreground">
                                                No hay planes disponibles
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {filteredPlanes.length > itemsPerPage && (
                                <div className="flex justify-center gap-2 my-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="flex items-center px-2 text-sm">
                                        Página {currentPage} de {Math.ceil(filteredPlanes.length / itemsPerPage)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                prev < Math.ceil(filteredPlanes.length / itemsPerPage) ? prev + 1 : prev
                                            )
                                        }
                                        disabled={currentPage >= Math.ceil(filteredPlanes.length / itemsPerPage)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Crear Plan */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar plan"
                description="Complete los datos del nuevo plan"
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select value={createForm.Tipo} onValueChange={(value) => {
                                setCreateForm(prev => ({ ...prev, Tipo: value }))
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="GIMNASIO O CLASE" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GIMNASIO">GIMNASIO</SelectItem>
                                    <SelectItem value="CLASE">CLASE</SelectItem>
                                    <SelectItem value="SERVICIO">SERVICIO</SelectItem>
                                    <SelectItem value="PRODUCTO">PRODUCTO</SelectItem>
                                    <SelectItem value="DEUDA GIMNASIO">DEUDA GIMNASIO</SelectItem>
                                    <SelectItem value="DEUDA CLASES">DEUDA CLASES</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Plan o Producto</Label>
                            <Input
                                value={createForm['Plan o Producto']}
                                onChange={e => setCreateForm({ ...createForm, 'Plan o Producto': e.target.value })}
                                placeholder="Ej: 3 veces x semana - Tela 2 veces x semana"
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Precio</Label>
                            <Input
                                type="number"
                                value={createForm.Precio}
                                onChange={e => setCreateForm({ ...createForm, Precio: e.target.value })}
                                placeholder="Ej: 20000"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Número de Clases</Label>
                            <Input
                                type="number"
                                value={createForm.numero_Clases}
                                onChange={e => setCreateForm({ ...createForm, numero_Clases: e.target.value })}
                                placeholder="Ej: 12"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Número Coins</Label>
                            <Input
                                type="number"
                                value={createForm.Coins}
                                onChange={e => setCreateForm({ ...createForm, Coins: e.target.value })}
                                placeholder="Ej: 400"
                                required
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Editar Plan */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar plan"
                description="Modificá los datos de este plan registrado." confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Tipo</Label>

                            <Select value={editForm.Tipo} onValueChange={(value) => {
                                setEditForm(prev => ({ ...prev, Tipo: value }))
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="GIMNASIO O CLASE" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GIMNASIO">GIMNASIO</SelectItem>
                                    <SelectItem value="CLASE">CLASE</SelectItem>
                                    <SelectItem value="SERVICIO">SERVICIO</SelectItem>
                                    <SelectItem value="PRODUCTO">PRODUCTO</SelectItem>
                                    <SelectItem value="DEUDA GIMNASIO">DEUDA GIMNASIO</SelectItem>
                                    <SelectItem value="DEUDA CLASES">DEUDA CLASES</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Plan o Producto</Label>
                            <Input
                                required
                                value={editForm['Plan o Producto']}
                                onChange={e => setEditForm({ ...editForm, 'Plan o Producto': e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Precio</Label>
                            <Input
                                required
                                type="number"
                                value={editForm.Precio}
                                onChange={e => setEditForm({ ...editForm, Precio: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Número de Clases</Label>
                            <Input
                                required
                                type="number"
                                value={editForm.numero_Clases}
                                onChange={e => setEditForm({ ...editForm, numero_Clases: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Número de Coins</Label>
                            <Input
                                required
                                type="number"
                                value={editForm.Coins}
                                onChange={e => setEditForm({ ...editForm, Coins: e.target.value })}
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar plan?"
                description="Esta acción es permanente y no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                loading={isSubmitting}
                destructive
                onConfirm={handleConfirmDelete}
            >
                {selectedPlan && (
                    <div className="space-y-4 p-4 bg-muted/50 text-sm rounded-md">
                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <Tag className="mr-2 h-4 w-4" />
                                Tipo:
                            </div>
                            <div>{selectedPlan.Tipo}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <Box className="mr-2 h-4 w-4" />
                                Plan:
                            </div>
                            <div>{selectedPlan['Plan o Producto']}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Precio:
                            </div>
                            <div>{selectedPlan.Precio}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Clases:
                            </div>
                            <div>{selectedPlan.numero_Clases}</div>
                        </div>
                    </div>
                )}
            </ConfirmDialog>

            <ConfirmDialog
                open={showAumentosDialog}
                onOpenChange={setShowAumentosDialog}
                title="Historial de aumentos"
                description={planSeleccionado?.['Plan o Producto'] || ''}
                confirmText="Cerrar"
                onConfirm={() => setShowAumentosDialog(false)}
            >
                <div className="p-2 bg-muted/50 rounded-md text-sm">
                    {aumentos.length > 0 ? (
                        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                            {aumentos.map((aumento, idx) => (
                                <div key={idx} className="flex flex-col gap-2 border-b py-2">
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            Fecha:
                                        </div>
                                        <div>{aumento.Fecha}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Precio anterior:
                                        </div>
                                        <div>{aumento.Precio_anterior}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Precio actualizado:
                                        </div>
                                        <div>{aumento.Precio_actualizado}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <Tag className="mr-2 h-4 w-4" />
                                            Aumento:
                                        </div>
                                        <div>{aumento.Porcentaje_aumento}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            No hay aumentos registrados para este plan.
                        </div>
                    )}
                </div>
            </ConfirmDialog>


        </TabsContent>
    )
}
