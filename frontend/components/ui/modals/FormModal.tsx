import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, Typography, MenuItem, useMediaQuery,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Field, FormModalProps } from '@/models/Fields/Field';
import { debounce } from '@/utils/debounce/debounce';
import { Autocomplete } from '@mui/material';
import { notify } from '@/lib/toast';
import { ColorPickerPopover } from '../colorSelector/colorSelector';
import { FormEnterToTab } from "@/components/ui/tables/FormEnterToTab"

export const FormModal = <T extends Record<string, any>>({
  open,
  title,
  fields,
  initialValues = {} as T,
  onClose,
  onSubmit,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  gridColumns = 12,
  gridGap = 16,
  layout = {},
  mode = 'create',
  lockedFields = [],
  asyncValidators,
  asyncTrigger = 'blur',
  asyncDebounceMs = 400,
  gymId,
  extraActions,
  onValuesChange,
}: FormModalProps<T>) => {
  const [values, setValues] = useState<T>({} as T);
  const [externalErrors, setExternalErrors] = useState<Record<string, string | undefined>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const firstInputRef = React.useRef<HTMLInputElement | null>(null)

  const origenPago = values['origen_pago'];
  const metodoSeleccionado = values['metodo_pago'];

  const visibleFields = fields.filter(field => {
    const isPagoForm = fields.some(f => f.name === 'origen_pago');

    if (isPagoForm) {
      if (!origenPago && (field.name === 'plan_id' || field.name === 'servicio_id')) return false;
      if (origenPago === 'plan' && field.name === 'servicio_id') return false;
      if (origenPago === 'servicio' && field.name === 'plan_id') return false;
      if (['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(field.name)) {
        if (metodoSeleccionado === 'Efectivo') return field.name === 'monto_efectivo';
        if (metodoSeleccionado === 'Mercado Pago') return field.name === 'monto_mp';
        if (metodoSeleccionado === 'Tarjeta') return field.name === 'monto_tarjeta';
        if (metodoSeleccionado === 'Mixto') return true;
        return false;
      }
    }

    return true;
  });


  const showError = (msg: string) => notify.error(msg);

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const paperWidth = {
    xs: '92vw',
    sm: 560,
    md: 720,
  };

  const setFieldError = (name: string, msg?: string) =>
    setExternalErrors(prev => ({ ...prev, [name]: msg }));

  const isLockedField = (fieldName: string) => lockedFields.includes(fieldName);

  useEffect(() => {
    if (!open) return;
    const combined = fields.reduce((acc, f) => {
      let initial: any;
      if (f.type === 'select' && Array.isArray(f.options) && f.options.length > 0) {
        initial = initialValues?.[f.name] ?? '';
      } else {
        initial = initialValues?.[f.name] ?? f.defaultValue ?? '';
      }
      if (typeof initial === 'string' && f.maxLength != null) {
        initial = initial.slice(0, f.maxLength);
      }
      acc[f.name] = initial;
      return acc;
    }, {} as Record<string, any>);
    setValues(combined as T);
    setExternalErrors({});
  }, [open, initialValues, fields]);

  const runAsyncValidation = React.useMemo(
    () =>
      debounce(async (name: string, value: any, allValues: T) => {
        const fn = asyncValidators?.[name];
        if (!fn) return;

        const current = String(value);
        const msg = await fn(value, allValues);

        if (String((allValues as any)[name]) === current) {
          setFieldError(name, msg ?? undefined);
        }
      }, asyncDebounceMs),
    [asyncValidators, asyncDebounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const f = fields.find(x => x.name === name);
    if (!f) return;
    if (isLockedField(name)) return;

    let newVal: any = value;

    if (f.regex && !f.regex.test(newVal)) return;
    if (f.type === 'string' && f.maxLength != null) newVal = newVal.slice(0, f.maxLength);
    if (
      f.type === 'select' &&
      Array.isArray(f.options) &&
      typeof f.options[0]?.value === 'number'
    ) {
      newVal = Number(newVal);
    }

    if (f.inputProps?.style?.textTransform === 'capitalize' && typeof newVal === 'string') {
      newVal = newVal
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    setValues(prev => {
      const next = { ...prev, [name]: newVal };

      if (name === 'plan_id') {
        const planField = fields.find(f => f.name === 'plan_id');
        const selectedPlan = planField?.options?.find(opt => opt.value === newVal) as any;

        const mutableNext = { ...next } as Record<string, any>;

        if (selectedPlan) {
          mutableNext['clases_pagadas'] = String(selectedPlan.numero_clases ?? 0);
          mutableNext['clases_realizadas'] = 0;
        } else {
          mutableNext['clases_pagadas'] = 0;
          mutableNext['clases_realizadas'] = 0;
        }


        console.log('selectedPlan', selectedPlan)
        const precioPlan = selectedPlan?.precio ?? 0;

        if (precioPlan > 0) {
          if (metodoSeleccionado === 'Efectivo') mutableNext['monto_efectivo'] = String(precioPlan);
          else if (metodoSeleccionado === 'Mercado Pago') mutableNext['monto_mp'] = String(precioPlan);
          else if (metodoSeleccionado === 'Tarjeta') mutableNext['monto_tarjeta'] = String(precioPlan);
          else if (metodoSeleccionado === 'Mixto') {
            mutableNext['monto_efectivo'] = '';
            mutableNext['monto_mp'] = '';
            mutableNext['monto_tarjeta'] = '';
          }
        }

        return mutableNext as T;
      }

      if (name === 'servicio_id') {
        const selectedService = fields
          .find(f => f.name === 'servicio_id')
          ?.options?.find(opt => opt.value === newVal);

        let precioServicio = 0;
        if (selectedService?.label) {
          const match = selectedService.label.match(/\$\s?([\d.,]+)/);
          if (match) {
            precioServicio = Number(match[1].replace(/\./g, '').replace(',', '.'));
          }
        }

        if (precioServicio > 0) {
          const mutableNext = next as Record<string, any>;
          if (metodoSeleccionado === 'Efectivo') mutableNext['monto_efectivo'] = String(precioServicio);
          else if (metodoSeleccionado === 'Mercado Pago') mutableNext['monto_mp'] = String(precioServicio);
          else if (metodoSeleccionado === 'Tarjeta') mutableNext['monto_tarjeta'] = String(precioServicio);
          else if (metodoSeleccionado === 'Mixto') {
            mutableNext['monto_efectivo'] = '';
            mutableNext['monto_mp'] = '';
            mutableNext['monto_tarjeta'] = '';
          }
        }
      }

      if (name === 'metodo_pago') {
        const mutableNext = { ...next } as Record<string, any>;

        const total =
          Number(mutableNext['monto_efectivo'] || 0) +
          Number(mutableNext['monto_mp'] || 0) +
          Number(mutableNext['monto_tarjeta'] || 0);

        if (newVal === 'Efectivo') {
          mutableNext['monto_efectivo'] = total ? String(total) : '';
          mutableNext['monto_mp'] = '';
          mutableNext['monto_tarjeta'] = '';
        } else if (newVal === 'Mercado Pago') {
          mutableNext['monto_mp'] = total ? String(total) : '';
          mutableNext['monto_efectivo'] = '';
          mutableNext['monto_tarjeta'] = '';
        } else if (newVal === 'Tarjeta') {
          mutableNext['monto_tarjeta'] = total ? String(total) : '';
          mutableNext['monto_efectivo'] = '';
          mutableNext['monto_mp'] = '';
        } else if (newVal === 'Mixto') {
          mutableNext['monto_efectivo'] = '';
          mutableNext['monto_mp'] = '';
          mutableNext['monto_tarjeta'] = '';
        }

        return mutableNext as T;
      }

      if (asyncTrigger === 'change') runAsyncValidation(name, newVal, next);
      return next;
    });
  };

  const handleBlur = (name: string, raw: any) => {
    if (isLockedField(name)) return;
    const f = fields.find(x => x.name === name);
    f?.onBlur?.(String(raw));
    if (asyncTrigger === 'blur') runAsyncValidation(name, raw, values);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValues = Object.entries(values).reduce((acc, [key, val]) => {
      acc[key as keyof T] = typeof val === 'string' ? val.trim() : val;
      return acc;
    }, {} as T);

    for (const field of fields) {
      const val = trimmedValues[field.name];

      if (field.required && (val === undefined || val === null || val === '')) {
        showError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
      if (
        field.type === 'string' &&
        field.minLength != null &&
        typeof val === 'string' &&
        val.length < field.minLength
      ) {
        showError(`El campo "${field.label}" debe tener al menos ${field.minLength} caracteres.`);
        return;
      }
      if (field.regex && typeof val === 'string' && !field.regex.test(val)) {
        showError(`El campo "${field.label}" tiene un formato inválido.`);
        return;
      }
      if (field.type === 'number') {
        const n = Number(val);
        if (Number.isNaN(n)) {
          showError(`El campo "${field.label}" debe ser numérico.`);
          return;
        }
        if (field.min != null && n < field.min) {
          showError(`El campo "${field.label}" debe ser al menos ${field.min}.`);
          return;
        }
        if (field.max != null && n > field.max) {
          showError(`El campo "${field.label}" no debe superar ${field.max}.`);
          return;
        }
      }
      if (field.validate) {
        const msg = field.validate(val);
        if (msg) {
          showError(msg);
          return;
        }
      }
    }

    const pendingExternalError = Object.values(externalErrors).find(Boolean);
    if (pendingExternalError) {
      showError(String(pendingExternalError));
      return;
    }

    onSubmit(trimmedValues);
  };

  const hasErrors = Object.values(externalErrors).some(Boolean);
  const isEmpty = (f: Field, v: any) =>
    v === undefined || v === null || (typeof v === 'string' ? v.trim() === '' : v === '');

  const hasEmptyRequired = fields.some(f => f.required && isEmpty(f, values[f.name]));

  const computeCellStyle = (fieldName: string): React.CSSProperties => {
    if (!isMdUp) {
      return { gridColumn: `1 / span 12`, minWidth: 0 };
    }

    if (
      ['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(fieldName) &&
      (metodoSeleccionado === 'Efectivo' ||
        metodoSeleccionado === 'Mercado Pago' ||
        metodoSeleccionado === 'Tarjeta')
    ) {
      return { gridColumn: '1 / span 12', minWidth: 0 };
    }

    const lay = (layout as any)[fieldName] ?? {};
    return {
      gridColumn:
        lay.colStart != null
          ? `${lay.colStart} / span ${lay.colSpan ?? 1}`
          : `auto / span ${lay.colSpan ?? 1}`,
      gridRow: lay.rowStart != null ? `${lay.rowStart} / span ${lay.rowSpan ?? 1}` : undefined,
      minWidth: 0,
    };
  };

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus()
        firstInputRef.current.select()
      }
    }, 150)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (onValuesChange) onValuesChange(values)
  }, [values]);

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
            gridTemplateColumns={`repeat(${isMdUp ? gridColumns : 12}, 1fr)`}
            gap={`${isSmDown ? 12 : gridGap}px`}
          >
            {visibleFields.map((field, index) => {
              const val = values[field.name] ?? '';
              const style = computeCellStyle(field.name);

              const trimmedVal = typeof val === 'string' ? val.trim() : val;
              const length = String(trimmedVal).length;
              const minLen = field.minLength ?? 0;
              const maxLen = field.maxLength ?? Infinity;
              const reachedMax = field.maxLength != null && length >= field.maxLength;

              const isTooShort = field.type === 'string' && length < minLen;
              const isTooLong = field.type === 'string' && length > maxLen;

              const isBelowMin =
                field.type === 'number' && field.min != null && Number(val) < field.min;
              const isAboveMax =
                field.type === 'number' && field.max != null && Number(val) > field.max;

              const syncMsg = field.validate?.(val);
              const asyncMsg = externalErrors[field.name];
              const validationMessage = asyncMsg || syncMsg;

              const isError =
                !!validationMessage || isTooShort || isTooLong || isBelowMin || isAboveMax;

              const helperText = validationMessage
                ? validationMessage
                : isTooShort
                  ? `Mínimo ${minLen} caracteres`
                  : isTooLong
                    ? `Máximo ${maxLen} caracteres`
                    : isBelowMin
                      ? `Debe ser al menos ${field.min}`
                      : isAboveMax
                        ? `No debe superar ${field.max}`
                        : '';

              const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
                maxLength: field.maxLength ?? undefined,
                ...field.inputProps,
              };

              if (field.type === 'number') {
                inputProps.min = field.min;
                inputProps.max = field.max;
              }

              const options = Array.isArray(field.options) ? field.options : [];
              const locked = isLockedField(field.name);

              if (field.type === 'color') {
                return (
                  <Box key={field.name} style={style}>
                    <ColorPickerPopover
                      value={val || ''}
                      onChange={c => setValues(prev => ({ ...prev, [field.name]: c }))}
                      label={field.label}
                    />
                  </Box>
                );
              }

              if (field.name === 'emails') {
                if (mode === 'edit') return null
                return (
                  <Box key={field.name} style={style}>
                    <Typography fontWeight={500} mb={0.5}>
                      {field.label || 'Correos electrónicos'}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        border: '1px solid rgba(0,0,0,0.23)',
                        borderRadius: 1,
                        p: 1,
                        minHeight: 56,
                        alignItems: 'center',
                      }}
                    >
                      {(Array.isArray(values.emails) ? values.emails : [])
                        .map((email: string, i: number) => (
                          <Chip
                            key={i}
                            label={email}
                            onDelete={() =>
                              setValues((prev) => ({
                                ...prev,
                                emails: prev.emails.filter((_: string, idx: number) => idx !== i),
                              }))
                            }
                            color="primary"
                            size="small"
                          />
                        ))}

                      <TextField
                        variant="standard"
                        placeholder="Agregar email y presionar Enter"
                        InputProps={{ disableUnderline: true }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const input = (e.target as HTMLInputElement).value.trim()
                            if (input && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
                              setValues((prev) => ({
                                ...prev,
                                emails: [...(Array.isArray(prev.emails) ? prev.emails : []), input],
                              }))
                                ; (e.target as HTMLInputElement).value = ''
                            }
                          }
                        }}
                        sx={{ flex: 1, minWidth: 180 }}
                      />
                    </Box>
                  </Box>
                )
              }

              if (field.type === 'search-select' && field.searchFromCache) {
                const term = searchTerms[field.name] ?? '';
                const allOptions = field.searchFromCache(gymId ?? '', '');
                let results = term ? field.searchFromCache(gymId ?? '', term) : allOptions;
                if (!results || results.length === 0) results = allOptions;

                const selectedOption = values[field.name]
                  ? allOptions.find(o => o.value === values[field.name]) || null
                  : null;

                return (
                  <Box key={field.name} style={style}>
                    <Autocomplete
                      options={results}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      getOptionLabel={option => option.label}
                      value={selectedOption}
                      onInputChange={(_, newInputValue) => {
                        setSearchTerms(prev => ({ ...prev, [field.name]: newInputValue }));
                      }}
                      onChange={(_, newValue) => {
                        setValues(prev => ({ ...prev, [field.name]: newValue?.value ?? null }));
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={field.label}
                          placeholder={field.placeholder}
                          required={field.required}
                          error={isError}
                          helperText={helperText}
                          fullWidth
                          size={isSmDown ? 'small' : 'medium'}
                        />
                      )}
                      disabled={locked}
                      noOptionsText={null}
                      fullWidth
                    />
                  </Box>
                );
              }

              return (
                <Box key={field.name} style={style}>
                  <TextField
                    inputRef={index === 0 ? firstInputRef : undefined}
                    onBlur={e => !locked && handleBlur(field.name, String(e.target.value))}
                    select={field.type === 'select'}
                    fullWidth
                    size={isSmDown ? 'small' : 'medium'}
                    label={field.label}
                    name={field.name}
                    type={field.type !== 'select' ? (field.type as any) : undefined}
                    value={val}
                    required={field.required}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    slotProps={{ htmlInput: inputProps, inputLabel: { shrink: true } }}
                    error={isError}
                    helperText={helperText}
                    disabled={locked || field.disabled}
                    InputProps={{
                      readOnly: locked,
                      sx: {
                        height: '60px',
                        '& .MuiInputBase-input': {
                          py: 1,
                        },
                      },
                    }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: selected => {
                        const match = options.find(
                          o =>
                            o.value === selected ||
                            (o.value == null && (selected == null || selected === ''))
                        );
                        if (match) return match.label;
                        return field.placeholder ?? '';
                      },
                      MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                    }}
                  >
                    {field.type === 'select' &&
                      options.map(opt => (
                        <MenuItem key={String(opt.value)} value={opt.value ?? ''}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </TextField>

                  {
                    field.maxLength != null && !isError && field.type === 'string' && (
                      <Typography
                        variant="caption"
                        color={reachedMax ? 'error' : 'text.secondary'}
                      >
                        {length} / {maxLen}
                      </Typography>
                    )
                  }
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
            borderTop: theme => `1px solid ${theme.palette.divider}`,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            '& > :is(button, .MuiBox-root)': {
              width: { xs: '100%', sm: 'auto' },
            },
          }}
        >
          {extraActions}
          <Button onClick={onClose} variant="outlined">
            {cancelText}
          </Button>
          <Button type="submit" variant="contained" disabled={hasErrors || hasEmptyRequired}>
            {confirmText}
          </Button>
        </DialogActions>
      </FormEnterToTab>
    </Dialog >
  );
};
