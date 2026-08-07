'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FlushDialogActions } from '@/components/ui/modals/FlushDialogActions';
import { notify } from '@/lib/toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  useNovedades,
  useCreateNovedad,
  useUpdateNovedad,
  useDeleteNovedad,
  useToggleActivoNovedad
} from '@/hooks/novedades/useNovedadesApi';

import type { Novedad, NovedadFormValues } from '@/models/Novedad';
import { getErrorMessage } from '@/utils/errors/apiError';


const getTipoColor = (tipo: string) => {
  const colors = {
    novedad: 'primary',
    feature: 'secondary',
    promocion: 'warning',
    evento: 'info',
    error: 'error',
    fix: 'success',
  } as const;

  return colors[tipo as keyof typeof colors] || 'default';
};

const getTipoLabel = (tipo: string) => {
  const labels = {
    novedad: 'Novedad',
    feature: 'Feature',
    promocion: 'Promoción',
    evento: 'Evento',
    error: 'Error',
    fix: 'Fix',
  };

  return labels[tipo as keyof typeof labels] || tipo;
};

const getTipoIcon = (tipo: string) => {
  const icons = {
    novedad: <NewReleasesIcon fontSize="small" />,
    feature: <AnnouncementIcon fontSize="small" />,
    promocion: <LocalOfferIcon fontSize="small" />,
    evento: <EventIcon fontSize="small" />,
    error: <BugReportIcon fontSize="small" />,
    fix: <BuildIcon fontSize="small" />,
  };

  return icons[tipo as keyof typeof icons] || <AnnouncementIcon fontSize="small" />;
};

// Los formularios de alta/edicion se arman inline mas abajo con Dialog + TextField;
// las definiciones novedadesFields / novedadesLayout que vivian aca eran de la
// version con FormModal y quedaron sin usar (ademas referenciaban fecha_inicio,
// que no existe en la tabla de novedades).

async function uploadNovedadImageApi(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  
  const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  const res = await fetch(`${API_BASE}/novedades/upload-image`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al subir imagen');
  }

  const data = await res.json();
  return data.image_url;
}

export function ManageNovedades() {
  const theme = useTheme();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
  const [formValues, setFormValues] = useState<NovedadFormValues>({});

  const { data: novedadesData, isLoading, error } = useNovedades();
  const createMutation = useCreateNovedad();
  const updateMutation = useUpdateNovedad();
  const deleteMutation = useDeleteNovedad();
  const toggleActivoMutation = useToggleActivoNovedad();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [, setUploadingImage] = useState(false);

  const novedades = useMemo(() => {
    if (!novedadesData) return [];
    if (Array.isArray(novedadesData)) return novedadesData;
    if (novedadesData.items && Array.isArray(novedadesData.items)) return novedadesData.items;
    return [];
  }, [novedadesData]);

  const stats = useMemo(() => {
    if (!novedades || !Array.isArray(novedades)) return { total: 0, activas: 0, features: 0, promociones: 0 };

    return {
      total: novedades.length,
      activas: novedades.filter((n: Novedad) => n.activo).length,
      features: novedades.filter((n: Novedad) => n.tipo === 'feature').length,
      promociones: novedades.filter((n: Novedad) => n.tipo === 'promocion').length,
    };
  }, [novedades]);

  const handleAdd = async (values: NovedadFormValues) => {
    try {
      setUploadingImage(true);

      let imagen_url = null;

      // 👇 1. SUBIR IMAGEN SI EXISTE
      if (imageFile) {
        imagen_url = await uploadNovedadImageApi(imageFile);
      }

      // 👇 2. CREAR PAYLOAD CON imagen_url
      const payload = {
        ...values,
        // el Select arranca en '', que no es un NovedadTipo valido para la API
        tipo: values.tipo || undefined,
        activo: values.activo === 'true' || values.activo === true,
        fecha_publicacion: values.fecha_publicacion || new Date().toISOString(),
        imagen_url, // 👈 ACÁ ESTABA EL FALLO
      };

      await createMutation.mutateAsync(payload);

      // 👇 3. LIMPIEZA
      setOpenAdd(false);
      setFormValues({});
      setImageFile(null);
      setImagePreview(null);

      notify.success('Novedad creada correctamente');
    } catch (error: unknown) {
      notify.error(getErrorMessage(error) || 'Error al crear novedad');
    } finally {
      setUploadingImage(false);
    }
  };


  const handleEdit = async (values: NovedadFormValues) => {
    if (!selectedNovedad) return;

    try {
      const payload = {
        ...values,
        // el Select arranca en '', que no es un NovedadTipo valido para la API
        tipo: values.tipo || undefined,
        activo: values.activo === 'true' || values.activo === true,
        fecha_publicacion: values.fecha_publicacion || new Date().toISOString(),
      };
      await updateMutation.mutateAsync({
        id: selectedNovedad.id,
        data: payload
      });
      setOpenEdit(false);
      setSelectedNovedad(null);
      notify.success('Novedad actualizada correctamente');
    } catch (error: unknown) {
      notify.error(getErrorMessage(error) || 'Error al actualizar novedad');
    }
  };

  const handleDelete = async () => {
    if (!selectedNovedad) return;

    try {
      await deleteMutation.mutateAsync(selectedNovedad.id);
      setOpenDelete(false);
      setSelectedNovedad(null);
      notify.success('Novedad eliminada correctamente');
    } catch (error: unknown) {
      notify.error(getErrorMessage(error) || 'Error al eliminar novedad');
    }
  };

  const handleToggleActivo = async (novedad: Novedad) => {
    try {
      await toggleActivoMutation.mutateAsync({
        id: novedad.id,
        activo: !novedad.activo
      });
      notify.success(`Novedad ${!novedad.activo ? 'activada' : 'desactivada'}`);
    } catch (error: unknown) {
      notify.error(getErrorMessage(error) || 'Error al cambiar estado');
    }
  };

  const triggerEdit = (novedad: Novedad) => {
    setSelectedNovedad(novedad);
    setFormValues({
      ...novedad,
      activo: novedad.activo ? 'true' : 'false',
    });
    setOpenEdit(true);
  };

  const columns: GridColDef[] = [
    {
      field: 'titulo',
      headerName: 'Título',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            {getTipoIcon(params.row.tipo)}
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {params.value}
            </Typography>
          </Box>
          {params.row.descripcion && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.descripcion}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params) => (
        <Chip
          icon={getTipoIcon(params.value)}
          label={getTipoLabel(params.value)}
          color={getTipoColor(params.value)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.value}
              onChange={() => handleToggleActivo(params.row)}
              size="small"
              color="success"
            />
          }
          label={
            <Typography variant="caption" fontWeight={500}>
              {params.value ? 'Activo' : 'Inactivo'}
            </Typography>
          }
          sx={{ m: 0 }}
        />
      ),
    },
    {
      field: 'fecha_publicacion',
      headerName: 'Fecha publicación',
      width: 160,
      renderCell: (params) => {
        if (!params.value) return <Typography color="text.secondary">-</Typography>;
        return (
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
        );
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => triggerEdit(params.row)}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedNovedad(params.row);
              setOpenDelete(true);
            }}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.1),
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error" variant="h6">
          Error al cargar novedades
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {(error as Error).message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
            }}
          >
            <AnnouncementIcon color="primary" sx={{ fontSize: 28 }} />
          </Paper>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Gestión de Novedades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra las novedades, features y promociones
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
          size="large"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          Nueva Novedad
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
        gap={2}
        mb={3}
      >
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Total
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stats.total}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                }}
              >
                <AnnouncementIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.03),
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Activas
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {stats.activas}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 2,
                }}
              >
                <NewReleasesIcon color="success" sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.secondary.main, 0.03),
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Features
                </Typography>
                <Typography variant="h4" fontWeight={700} color="secondary">
                  {stats.features}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  borderRadius: 2,
                }}
              >
                <BuildIcon color="secondary" sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.03),
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Promociones
                </Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {stats.promociones}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 2,
                }}
              >
                <LocalOfferIcon color="warning" sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* DataGrid */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={novedades || []}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            rowHeight={80}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
              },
            }}
          />
        </Box>
      </Card>

      {/* Modal Agregar */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Agregar Nueva Novedad
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              {/* SUBIR IMAGEN */}
              <Button variant="outlined" component="label">
                Subir imagen
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </Button>

              {/* PREVIEW */}
              {imagePreview && (
                <Box mt={2}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- next/image no aporta nada aca: next.config.mjs usa images.unoptimized; ademas es un blob/data URI de preview local. */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                </Box>
              )}
            </Box>
            <TextField
              label="Título"
              value={formValues.titulo || ''}
              onChange={(e) => setFormValues({ ...formValues, titulo: e.target.value })}
              placeholder="Ingresa el título de la novedad"
              fullWidth
            />
            <TextField
              label="Descripción"
              value={formValues.descripcion || ''}
              onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
              placeholder="Describe detalladamente la novedad"
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de novedad</InputLabel>
              <Select
                value={formValues.tipo || ''}
                onChange={(e) => setFormValues({ ...formValues, tipo: e.target.value })}
                label="Tipo de novedad"
              >
                <MenuItem value="novedad">Novedad</MenuItem>
                <MenuItem value="feature">Feature</MenuItem>
                <MenuItem value="promocion">Promoción</MenuItem>
                <MenuItem value="evento">Evento</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="fix">Fix</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formValues.activo || 'true'}
                onChange={(e) => setFormValues({ ...formValues, activo: e.target.value })}
                label="Estado"
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha de publicación"
              type="datetime-local"
              value={formValues.fecha_publicacion || ''}
              onChange={(e) => setFormValues({ ...formValues, fecha_publicacion: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <FlushDialogActions
          actions={[
            { label: 'Cancelar', onClick: () => setOpenAdd(false), tone: 'neutral' },
            {
              label: 'Crear Novedad',
              onClick: () => handleAdd(formValues),
              tone: 'confirm',
              disabled: !formValues.titulo || !formValues.tipo,
            },
          ]}
        />
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Editar Novedad
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Título"
              value={formValues.titulo || ''}
              onChange={(e) => setFormValues({ ...formValues, titulo: e.target.value })}
              placeholder="Ingresa el título de la novedad"
              fullWidth
            />
            <TextField
              label="Descripción"
              value={formValues.descripcion || ''}
              onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
              placeholder="Describe detalladamente la novedad"
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de novedad</InputLabel>
              <Select
                value={formValues.tipo || ''}
                onChange={(e) => setFormValues({ ...formValues, tipo: e.target.value })}
                label="Tipo de novedad"
              >
                <MenuItem value="novedad">Novedad</MenuItem>
                <MenuItem value="feature">Feature</MenuItem>
                <MenuItem value="promocion">Promoción</MenuItem>
                <MenuItem value="evento">Evento</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="fix">Fix</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formValues.activo || 'true'}
                onChange={(e) => setFormValues({ ...formValues, activo: e.target.value })}
                label="Estado"
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha de publicación"
              type="datetime-local"
              value={formValues.fecha_publicacion || ''}
              onChange={(e) => setFormValues({ ...formValues, fecha_publicacion: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <FlushDialogActions
          actions={[
            {
              label: 'Cancelar',
              onClick: () => {
                setOpenEdit(false);
                setSelectedNovedad(null);
                setFormValues({});
              },
              tone: 'neutral',
            },
            {
              label: 'Guardar Cambios',
              onClick: () => handleEdit(formValues),
              tone: 'confirm',
              disabled: !formValues.titulo || !formValues.tipo,
            },
          ]}
        />
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <GenericModal
        open={openDelete}
        title="Confirmar eliminación"
        content={
          <Typography>
            ¿Estás seguro de que deseas eliminar la novedad &quot;{selectedNovedad?.titulo}&quot;?
          </Typography>
        }
        onClose={() => {
          setOpenDelete(false);
          setSelectedNovedad(null);
        }}
        onConfirm={handleDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </Box >
  );
}