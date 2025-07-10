"use client"

import { useEffect, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash, Edit } from "lucide-react"
import { motion } from "framer-motion"
import { useAppData } from "@/context/AppDataContext"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import RegisterClassDialog from "./add-assists-dialog"
import { CalendarDays, Users, UserCircle, ClipboardList } from "lucide-react"
import dayjs from "dayjs"
import { Input } from "@/components/ui/input"
import { notify } from "@/lib/toast"
import { FormEnterToTab } from "@/components/FormEnterToTab"

export default function AssistsSection() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedType, setSelectedType] = useState("todas")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    Fecha: "",
    "Tipo de Clase": "",
    "Cantidad de presentes": "",
    Responsable: ""
  })
  const { assists, fetchAssists, deleteAsistencia, editAsistencia } = useAppData()
  const [isSubmitting, setisSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const handleDateChange = async (date: Date) => {
    setSelectedDate(date)
    await fetchAssists({ selectedDate: date, selectedType })
  }

  const handleTypeChange = async (type: string) => {
    setSelectedType(type)
    await fetchAssists({ selectedDate, selectedType: type })
  }

  const displayedAssists = assists.filter((asistencia: any) => {
    const mismaFecha = dayjs(asistencia.Fecha, "D/M/YYYY").isSame(dayjs(selectedDate), "day")
    const mismoTipo =
      selectedType === "todas" || asistencia["Tipo de Clase"] === selectedType
    return mismaFecha && mismoTipo
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAssists = displayedAssists.slice(startIndex, endIndex)

  const handleConfirmDelete = async () => {
    if (!selectedClass) return
    setisSubmitting(true)
    try {
      await deleteAsistencia(selectedClass.ID)
      setShowDeleteDialog(false)
      setSelectedClass(null)
      notify.info("¡Asistencia eliminada con éxito!")
    } catch (error) {
      alert("Error al eliminar la clase.")
    }
    setisSubmitting(false)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate, selectedType])

  return (
    <TabsContent value="assists" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
          <div>
            <CardTitle>Asistencias</CardTitle>
            <CardDescription>Controla las asistencias registradas en el sistema.</CardDescription>
          </div>
          <Button variant="orange" onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Registrar presentes de una clase
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label>Fecha</Label>
              <DatePicker
                date={selectedDate}
                setDate={handleDateChange}
              />
            </div>
            <div className="flex-1">
              <Label>Tipo de clase</Label>
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Tela">Tela</SelectItem>
                  <SelectItem value="Acrobacia">Acrobacia</SelectItem>
                  <SelectItem value="Funcional">Funcional</SelectItem>
                  <SelectItem value="Cross">Cross</SelectItem>
                  <SelectItem value="Yoga">Yoga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-1/5">Tipo de Clase</TableHead>
                    <TableHead className="text-center w-1/5">Fecha</TableHead>
                    <TableHead className="text-center w-1/5">Presentes</TableHead>
                    <TableHead className="text-center w-1/5">Responsable</TableHead>
                    <TableHead className="text-center w-1/5">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssists.length > 0 ? (
                    paginatedAssists.map((asistencia, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="text-center w-1/5">{asistencia["Tipo de Clase"]}</TableCell>
                        <TableCell className="text-center w-1/5">
                          {asistencia.Fecha}
                        </TableCell>
                        <TableCell className="text-center w-1/5">{asistencia["Cantidad de presentes"]}</TableCell>
                        <TableCell className="text-center w-1/5">{asistencia.Responsable}</TableCell>
                        <TableCell className="text-center w-1/5">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingClass(asistencia)
                                setEditForm({
                                  Fecha: asistencia.Fecha,
                                  "Tipo de Clase": asistencia["Tipo de Clase"],
                                  "Cantidad de presentes": asistencia["Cantidad de presentes"],
                                  Responsable: asistencia.Responsable
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
                                setSelectedClass(asistencia)
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
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No hay asistencias registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {displayedAssists.length > itemsPerPage && (
                <div className="flex justify-center gap-2 my-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-2 text-sm">
                    Página {currentPage} de {Math.ceil(displayedAssists.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        prev < Math.ceil(displayedAssists.length / itemsPerPage) ? prev + 1 : prev
                      )
                    }
                    disabled={currentPage >= Math.ceil(displayedAssists.length / itemsPerPage)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RegisterClassDialog
        open={showAddDialog}
        onOpenChange={async (open) => {
          setShowAddDialog(open)
          if (!open) {
            await fetchAssists({ selectedDate, selectedType })
          }
        }}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar clase?"
        description="Esta acción es permanente y no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        loading={isSubmitting}
        onConfirm={handleConfirmDelete}
      >
        {selectedClass && (
          <div className="space-y-5 rounded-md p-4 bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Tipo de Clase:</span>
              <span className="ml-auto">{selectedClass["Tipo de Clase"]}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Fecha:</span>
              <span className="ml-auto">{dayjs(selectedClass.Fecha, "D/M/YYYY").format("DD/MM/YYYY")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Presentes:</span>
              <span className="ml-auto">{selectedClass["Cantidad de presentes"]}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Responsable:</span>
              <span className="ml-auto">{selectedClass.Responsable}</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Editar clase"
        description="Modificá los datos de esta clase registrada."
        confirmText="Guardar cambios"
        cancelText="Cancelar"
        loading={isSubmitting}
        onConfirm={async () => {
          setisSubmitting(true)
          try {
            await editAsistencia(editingClass.ID, editForm)
            await fetchAssists({ selectedDate, selectedType })
            setShowEditDialog(false)
            notify.success("¡Asistencia editada con éxito!")
          } catch (error) {
            notify.error("Error al editar la asistencia")
          }
          setisSubmitting(false)
        }}
      >
        <FormEnterToTab>
          <div className="space-y-4 text-sm">
            <div className="flex flex-col">
              <Label>Fecha</Label>
              <Input
                value={editForm.Fecha}
                onChange={(e) => setEditForm({ ...editForm, Fecha: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <Label>Tipo de Clase</Label>
              <Input
                value={editForm["Tipo de Clase"]}
                onChange={(e) => setEditForm({ ...editForm, "Tipo de Clase": e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <Label>Cantidad de Presentes</Label>
              <Input
                type="number"
                value={editForm["Cantidad de presentes"]}
                onChange={(e) => setEditForm({ ...editForm, "Cantidad de presentes": e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <Label>Responsable</Label>
              <Input
                value={editForm.Responsable}
                disabled
                onChange={(e) => setEditForm({ ...editForm, Responsable: e.target.value })}
              />
            </div>
          </div>
        </FormEnterToTab>
      </ConfirmDialog>
    </TabsContent>
  )
}
