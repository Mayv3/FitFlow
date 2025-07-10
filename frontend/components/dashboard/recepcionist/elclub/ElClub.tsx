import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.locale('es')

interface Clase {
    ID: string
    'Nombre de clase': string
    Dia: string
    Hora: string
    'Cupo maximo': string
    Inscriptos: string,
    IncriptosNombre: string,
    ProximaFecha?: string
}

export const ElClub = () => {
    const [clases, setClases] = useState<Clase[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [dniList, setDniList] = useState<string[]>([])
    const [nombreClase, setNombreClase] = useState("")
    const todosLosDias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sábado"];
    const hoy = dayjs().locale("es").day();
    const indiceHoy = hoy === 0 ? 6 : hoy - 1;
    const [classDateTime, setClassDateTime] = useState<string>('');

    const ARG_TZ = "America/Argentina/Buenos_Aires";
    const now = dayjs().tz(ARG_TZ);

    const upcomingClases = clases.filter((clase) => {
        const fechaRaw = clase.ProximaFecha?.trim() || "";
        const [horaStr, minutoStr] = clase.Hora.split(":");
        const fechaClase = dayjs(fechaRaw, ["D/M/YYYY", "DD/MM/YYYY"])
            .hour(parseInt(horaStr, 10))
            .minute(parseInt(minutoStr, 10))
            .tz(ARG_TZ);
        return fechaClase.isAfter(now);
    });

    const diasOrden = [
        ...todosLosDias.slice(indiceHoy),
        ...todosLosDias.slice(0, indiceHoy),
    ];

    const clasesAgrupadas = diasOrden.map((dia) => {
        const clasesDelDia = upcomingClases
            .filter(c => c.Dia.toLowerCase() === dia.toLowerCase())
            .sort((a, b) => {
                const [hA, mA] = a.Hora.split(":").map(Number);
                const [hB, mB] = b.Hora.split(":").map(Number);
                return hA - hB || mA - mB;
            });
        return { dia, clases: clasesDelDia };
    });

    const fetchClases = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club`)
            setClases(res.data)
        } catch (err) {
            console.error("Error al cargar clases:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (clase: Clase) => {
        const lista = clase.InscriptosNombres
            ?.split(',')
            .map(d => d.trim())
            .filter(Boolean) || [];
        setDniList(lista);
        setNombreClase(clase['Nombre de clase']);
        setClassDateTime(`${clase.ProximaFecha} — ${clase.Hora} hs`);
        setModalOpen(true);
    }

    useEffect(() => {
        fetchClases()
    }, [])

    const diaHoy = diasOrden[0];

    return (
        <>
            <Card className="shadow-md">
                <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <div>
                            <CardTitle className="text-orange-700 text-lg sm:text-xl">Listado de Clases</CardTitle>
                            <CardDescription className="text-muted-foreground text-sm">
                                Visualizá todas las clases y consultá los inscriptos.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando clases...</p>
                    ) : (
                        <>
                            {/* VISTA ESCRITORIO */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="min-w-[700px] table-fixed w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/6 text-center">Clase</TableHead>
                                            <TableHead className="w-1/6 text-center">Día</TableHead>
                                            <TableHead className="w-1/6 text-center">Hora</TableHead>
                                            <TableHead className="w-1/6 text-center">Fecha</TableHead>
                                            <TableHead className="text-center w-1/6">Inscriptos</TableHead>
                                            <TableHead className="text-center w-1/6">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const grupoHoy = clasesAgrupadas.find(g => g.dia === diaHoy);
                                            if (grupoHoy && grupoHoy.clases.length === 0) {
                                                return (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                            Ya pasaron todas las clases del día.
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {clasesAgrupadas.map(({ dia, clases }) =>
                                            clases.map(clase => {
                                                const inscriptos = clase.Inscriptos
                                                    ?.split(",")
                                                    .map(d => d.trim())
                                                    .filter(Boolean) || [];

                                                return (
                                                    <TableRow key={clase.ID}>
                                                        <TableCell className="text-center w-1/6">{clase["Nombre de clase"]}</TableCell>
                                                        <TableCell className="text-center w-1/6">{clase.Dia}</TableCell>
                                                        <TableCell className="text-center w-1/6">{clase.Hora}</TableCell>
                                                        <TableCell className="text-center w-1/6">{clase.ProximaFecha}</TableCell>
                                                        <TableCell className="text-center w-1/6">
                                                            <span className="font-medium">{inscriptos.length}</span> / {clase["Cupo maximo"]}
                                                        </TableCell>
                                                        <TableCell className="text-center w-1/6">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleOpenModal(clase)}
                                                                disabled={inscriptos.length === 0}
                                                                className='bg-orange-200'
                                                            >
                                                                Ver inscriptos
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="block md:hidden space-y-8">
                                {clasesAgrupadas.map(({ dia, clases }) => (
                                    <div key={dia}>
                                        <h3 className="text-2xl font-bold mb-4 text-primary">{dia}</h3>

                                        {dia === diaHoy && clases.length === 0 ? (
                                            <p className="text-center text-muted-foreground">
                                                Ya pasaron todas las clases del día.
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                {clases.map(clase => {
                                                    const inscriptos = clase.Inscriptos
                                                        ?.split(",")
                                                        .map(d => d.trim())
                                                        .filter(Boolean) || [];

                                                    return (
                                                        <div
                                                            key={clase.ID}
                                                            className="border border-orange-300 dark:bg-zinc-900 dark:border-none rounded-lg p-4 shadow-sm flex flex-col justify-between"
                                                        >
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div>
                                                                    <h3 className="text-lg font-semibold">{clase["Nombre de clase"]}</h3>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {clase.ProximaFecha} — {clase.Hora} hs
                                                                    </span>
                                                                </div>
                                                                <Badge variant="outline" className="text-sm px-2 py-1">
                                                                    {inscriptos.length} / {clase["Cupo maximo"]}
                                                                </Badge>
                                                            </div>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => handleOpenModal(clase)}
                                                                disabled={inscriptos.length === 0}
                                                            >
                                                                Ver inscriptos
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>

            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-2xl flex justify-between items-center p-3">
                                <p className='text-sm md:text-2xl'>{nombreClase}</p>
                                <Badge variant="outline" className="text-sm px-2 py-1 bg-orange-200">
                                    {classDateTime}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {dniList.length > 0 ? (
                                dniList.map((dni, index) => (
                                    <Badge key={index} variant="outline" className="text-sm md:text-xl px-2 py-1">
                                        {dni}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No hay inscriptos.</p>
                            )}
                        </div>
                    </DialogContent>
            </Dialog>
        </>
    )
}
