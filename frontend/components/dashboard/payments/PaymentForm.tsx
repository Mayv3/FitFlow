'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Field } from '@/models/Fields/Field';
import { Autocomplete } from '@mui/material';
import { notify } from '@/lib/toast';
import { FormEnterToTab } from '@/components/ui/tables/FormEnterToTab';

type PaymentFormProps = {
  open: boolean;
  title: string;
  fields: Field[];
  layout: any;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
  gymId?: string;
  confirmText?: string;
  cancelText?: string;
  mode?: 'create' | 'edit';
};

export const PaymentForm = ({
  open,
  title,
  fields,
  layout,
  onClose,
  onSubmit,
  gymId,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  mode = 'create',
}: PaymentFormProps) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const firstInputRef = React.useRef<HTMLInputElement | null>(null);

  const showError = (msg: string) => notify.error(msg);

  const paperWidth = {
    xs: '92vw',
    sm: 560,
    md: 720,
  };

  useEffect(() => {
    if (!open) return;
    const combined = fields.reduce((acc, f) => {
      let val: any = f.defaultValue ?? '';
      acc[f.name] = val;
      return acc;
    }, {} as Record<string, any>);
    setValues(combined);
  }, [open, fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = fields.find((f) => f.name === name);
    if (!field) return;
    if (field.regex && !field.regex.test(value)) return;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    for (const field of fields) {
      const val = values[field.name];
      if (field.required && !val) {
        showError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
    }

    onSubmit(values);
  };

  const computeCellStyle = (fieldName: string): React.CSSProperties => {
    if (!isMdUp) {
      return { gridColumn: '1 / span 12', minWidth: 0 };
    }
    const lay = layout[fieldName] ?? {};
    return {
      gridColumn:
        lay.colStart != null
          ? `${lay.colStart} / span ${lay.colSpan ?? 1}`
          : `auto / span ${lay.colSpan ?? 1}`,
      gridRow: lay.rowStart != null ? `${lay.rowStart} / span ${lay.rowSpan ?? 1}` : undefined,
      minWidth: 0,
    };
  };

  const metodo = values.metodo ?? values.tipo_de_pago ?? ''; 

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      scroll="paper"
      PaperProps={{
        sx: {
          width: paperWidth,
          m: { xs: 2, sm: 3 },
          borderRadius: 2,
        },
      }}
    >
      <FormEnterToTab onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>{title}</DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            maxHeight: { xs: '68vh', sm: '72vh' },
            overflowY: 'auto',
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns={`repeat(${isMdUp ? 12 : 12}, 1fr)`}
            gap={`${isSmDown ? 12 : 16}px`}
          >
            {fields.map((field, index) => {
              const val = values[field.name] ?? '';
              const style = computeCellStyle(field.name);

              if (['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(field.name)) {
                if (metodo === 'mixto' && field.name === 'monto_efectivo') {
                  const montoFields = fields.filter((f) =>
                    ['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(f.name)
                  );
                  return (
                    <Box
                      key="montos-mixtos"
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        gridColumn: '1 / span 12',
                      }}
                    >
                      {montoFields.map((mf) => (
                        <TextField
                          key={mf.name}
                          label={mf.label}
                          name={mf.name}
                          type="number"
                          value={values[mf.name] ?? ''}
                          onChange={handleChange}
                          placeholder={mf.placeholder}
                          fullWidth
                        />
                      ))}
                    </Box>
                  );
                }

                // si no es mixto, mostrar solo el campo correspondiente
                if (metodo && metodo !== 'mixto') {
                  const match =
                    (metodo === 'efectivo' && field.name === 'monto_efectivo') ||
                    (metodo === 'mp' && field.name === 'monto_mp') ||
                    (metodo === 'tarjeta' && field.name === 'monto_tarjeta');

                  if (!match) return null;
                }
              }

              // campo de búsqueda (alumno)
              if (field.type === 'search-select' && field.searchFromCache) {
                const term = searchTerms[field.name] ?? '';
                const allOptions = field.searchFromCache(gymId ?? '', '');
                let results = term ? field.searchFromCache(gymId ?? '', term) : allOptions;
                if (!results || results.length === 0) results = allOptions;

                const selectedOption = values[field.name]
                  ? allOptions.find((o) => o.value === values[field.name]) || null
                  : null;

                return (
                  <Box key={field.name} style={style}>
                    <Autocomplete
                      options={results}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      getOptionLabel={(option) => option.label}
                      value={selectedOption}
                      onInputChange={(_, newInputValue) => {
                        setSearchTerms((prev) => ({ ...prev, [field.name]: newInputValue }));
                      }}
                      onChange={(_, newValue) => {
                        setValues((prev) => ({
                          ...prev,
                          [field.name]: newValue?.value ?? null,
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={field.label}
                          placeholder={field.placeholder}
                          fullWidth
                          size={isSmDown ? 'small' : 'medium'}
                        />
                      )}
                      fullWidth
                    />
                  </Box>
                );
              }

              return (
                <Box key={field.name} style={style}>
                  <TextField
                    inputRef={index === 0 ? firstInputRef : undefined}
                    select={field.type === 'select'}
                    fullWidth
                    size={isSmDown ? 'small' : 'medium'}
                    label={field.label}
                    name={field.name}
                    type={field.type !== 'select' ? (field.type as any) : undefined}
                    value={val}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    {field.type === 'select' &&
                      field.options?.map((opt) => (
                        <MenuItem key={String(opt.value)} value={opt.value ?? ''}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </TextField>
                </Box>
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            gap: 1.5,
            bgcolor: 'background.paper',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            '& > :is(button, .MuiBox-root)': {
              width: { xs: '100%', sm: 'auto' },
            },
          }}
        >
          <Button onClick={onClose} variant="outlined">
            {cancelText}
          </Button>
          <Button type="submit" variant="contained">
            {confirmText}
          </Button>
        </DialogActions>
      </FormEnterToTab>
    </Dialog>
  );
};
