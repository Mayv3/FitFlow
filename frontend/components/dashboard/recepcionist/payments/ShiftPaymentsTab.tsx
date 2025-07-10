"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { PaymentsFilters } from "@/hooks/usePayments"

interface ShiftPaymentsTabProps {
  currentShiftPayments: any[]

  selectedDay?: number
  setSelectedDay: (n?: number) => void
  selectedMonth?: number
  setSelectedMonth: (n?: number) => void
  selectedYear?: number
  setSelectedYear: (n?: number) => void

  selectedShift: string
  setSelectedShift: (shift: string) => void

  setShowAddPayment: (show: boolean) => void
  setSelectedPaymentToDelete: (payment: any) => void
  setShowDeletePaymentDialog: (show: boolean) => void
  onMemberUpdated: (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => void
  refreshPayments: (filters: PaymentsFilters) => void
  cashOpen: boolean
}

export function ShiftPaymentsTab({
  currentShiftPayments,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedShift,
  setSelectedShift,
  setShowAddPayment,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  refreshPayments,
  cashOpen,
}: ShiftPaymentsTabProps) {
  const [resumenPorTipo, setResumenPorTipo] = useState<{ [tipo: string]: { [metodo: string]: number } }>({})
  const [totalesPorMetodo, setTotalesPorMetodo] = useState({ efectivo: 0, tarjeta: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const totales: Record<string, Record<string, number>> = {}
    let totalEfectivo = 0
    let totalTarjeta = 0

    currentShiftPayments.forEach((pago: any) => {
      const tipo = pago.Tipo || "Sin tipo"
      const metodo = pago.Metodo_de_Pago || "Sin método"
      const monto = parseFloat(pago.Monto || "0")

      if (!totales[tipo]) totales[tipo] = {}
      totales[tipo][metodo] = (totales[tipo][metodo] || 0) + monto

      if (metodo.toLowerCase() === "efectivo") totalEfectivo += monto
      else if (metodo.toLowerCase() === "tarjeta") totalTarjeta += monto
    })

    setResumenPorTipo(totales)
    setTotalesPorMetodo({ efectivo: totalEfectivo, tarjeta: totalTarjeta })
  }, [currentShiftPayments])

  const filteredPayments = currentShiftPayments.filter(p => {
    const nombreMatch = p.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Ultimo_Plan?.toLowerCase().includes(searchTerm.toLowerCase())
    const tipoMatch = tipoFiltro === "todos" || p.Tipo === tipoFiltro
    return nombreMatch && tipoMatch
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFiltro])

  const resumenAgrupado: Record<
    string,
    { metodos: Record<string, number>; deuda: number }
  > = {}

  for (const [tipo, metodos] of Object.entries(resumenPorTipo)) {
    let clave = tipo
    let esDeuda = false

    if (tipo.toLowerCase().includes("deuda gimnasio")) {
      clave = "GIMNASIO"
      esDeuda = true
    } else if (tipo.toLowerCase().includes("deuda clases")) {
      clave = "CLASE"
      esDeuda = true
    }

    if (!resumenAgrupado[clave]) {
      resumenAgrupado[clave] = { metodos: {}, deuda: 0 }
    }

    for (const [metodo, monto] of Object.entries(metodos)) {
      resumenAgrupado[clave].metodos[metodo] =
        (resumenAgrupado[clave].metodos[metodo] || 0) + monto

      if (esDeuda) {
        resumenAgrupado[clave].deuda += monto
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
          <div className="flex justify-between">
            <div>
              <CardTitle>Pagos</CardTitle>
              <CardDescription>Visualiza y gestiona los pagos del turno actual.</CardDescription>
            </div>
            <Button variant="orange" onClick={() => setShowAddPayment(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Pago
            </Button>
          </div>

        </CardHeader>
        <CardContent>
          {/* FILTROS */}
          {!cashOpen && (
            <div className="flex flex-wrap justify-between pb-4">
              <div className="flex gap-4">
                <div className="max-w-sm">
                  <Label htmlFor="search">Buscar por nombre</Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Alumno o plan"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <Label>Tipo</Label>
                  <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="GIMNASIO">GIMNASIO</SelectItem>
                      <SelectItem value="CLASE">CLASE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <div className="w-24">
                    <Label>Día</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={selectedDay ?? ""}
                      onChange={e =>
                        setSelectedDay(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>

                  <div className="w-24">
                    <Label>Mes</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedMonth ?? ""}
                      onChange={e =>
                        setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>

                  <div className="w-28">
                    <Label>Año</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={selectedYear ?? ""}
                      onChange={e =>
                        setSelectedYear(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        const today = new Date()
                        refreshPayments({
                          dia: cashOpen ? today.getDate() : selectedDay,
                          mes: selectedMonth,
                          anio: selectedYear,
                          turno: selectedShift,
                        })
                      }}
                      disabled={cashOpen}
                    >
                      Filtrar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-32">
                <Label>Turno</Label>
                <Select
                  value={selectedShift}
                  onValueChange={setSelectedShift}
                  disabled={cashOpen}
                >
                  <SelectTrigger className={selectedShift === 'todos' ? 'animate-blink border-orange-500' : ''}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          )}
          <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)] mb-6">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-32">Miembro</TableHead>
                    <TableHead className="text-center w-32">Hora</TableHead>
                    <TableHead className="text-center w-32">Monto</TableHead>
                    <TableHead className="text-center w-32">Método</TableHead>
                    <TableHead className="text-center w-32">Fecha de pago</TableHead>
                    <TableHead className="text-center w-32">Fecha de venc.</TableHead>
                    <TableHead className="text-center w-32">Tipo</TableHead>
                    <TableHead className="text-center w-32">Turno</TableHead>
                    <TableHead className="text-center w-32">Plan Pagado</TableHead>
                    <TableHead className="text-center w-32">Registrado Por</TableHead>
                    <TableHead className="text-center w-32">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>

                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="text-center font-medium">{payment.Nombre}</TableCell>
                        <TableCell className="text-center">{payment.Hora || "—"}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          ${payment.Monto}
                        </TableCell>
                        <TableCell className="text-center">{payment.Metodo_de_Pago}</TableCell>
                        <TableCell className="text-center">{payment.Fecha_de_Pago}</TableCell>
                        <TableCell className="text-center">{payment.Fecha_de_Vencimiento}</TableCell>
                        <TableCell className="text-center">{payment.Tipo}</TableCell>
                        <TableCell className="text-center">{payment.Turno}</TableCell>
                        <TableCell className="text-center">{payment.Ultimo_Plan || "—"}</TableCell>
                        <TableCell className="text-center">{payment.Responsable}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPaymentToDelete(payment)
                              setShowDeletePaymentDialog(true)
                            }}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                        No hay pagos registrados para este turno
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredPayments.length > itemsPerPage && (
              <div className="flex justify-center gap-2 my-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-2 text-sm">
                  Página {currentPage} de {Math.ceil(filteredPayments.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredPayments.length / itemsPerPage) ? prev + 1 : prev
                    )
                  }
                  disabled={currentPage >= Math.ceil(filteredPayments.length / itemsPerPage)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>

          <div className="bg-background rounded-2xl shadow-sm py-6 space-y-6">
            <div className="">
              <h2 className="text-2xl">Totales del turno {selectedShift}</h2>
              <div className="mb-4 text-sm text-muted-foreground">
                Mostrando pagos del{" "}
                <span className="font-medium">{selectedDay}/{selectedMonth}/{selectedYear}</span>{" "}
                - Turno: <span className="font-medium">{selectedShift}</span>
              </div>
            </div>
            {Object.keys(resumenPorTipo).length > 0 && (
              <div className="grid gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">

                {Object.entries(resumenAgrupado).map(([tipo, { metodos, deuda }]) => {
                  const totalPorTipo = Object.values(metodos).reduce((sum, val) => sum + val, 0)
                  return (
                    <div key={tipo} className="bg-muted rounded-xl p-5 border flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold mb-2">
                          {tipo}
                          {deuda > 0 && (
                            <span className="text-sm text-red-600 ml-2">
                              (incluye ${deuda.toLocaleString("es-AR")} de deuda)
                            </span>
                          )}
                        </h4>
                        <ul className="space-y-1">
                          {Object.entries(metodos).map(([metodo, total]) => (
                            <li key={metodo} className="flex justify-between">
                              <span>{metodo}</span>
                              <span className="font-semibold">${total.toLocaleString("es-AR")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-4 font-bold">
                        <span>Total de {tipo}</span>
                        <span>${totalPorTipo.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="bg-muted rounded-xl p-5  border flex flex-col justify-between">
                  <h4 className="font-semibold mb-1">Por metodo de pago</h4>
                  <div className="flex justify-between">
                    <span>Total en Tarjeta:</span>
                    <span className="font-semibold">${totalesPorMetodo.tarjeta.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total en Efectivo:</span>
                    <span className="font-semibold">${totalesPorMetodo.efectivo.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold">
                      $
                      {currentShiftPayments
                        .reduce((sum, p) => sum + parseFloat(p.Monto || "0"), 0)
                        .toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
