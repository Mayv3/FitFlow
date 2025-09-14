import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, Typography, MenuItem,
} from '@mui/material';
import { Field, FormModalProps } from '@/models/Fields/Field';
import { debounce } from '@/utils/debounce/debounce';
import { Autocomplete } from '@mui/material';
import { notify } from '@/lib/toast';
import { ColorPickerPopover } from '../colorSelector/colorSelector';
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
}: FormModalProps<T>) => {
  const [values, setValues] = useState<T>({} as T);
  const [externalErrors, setExternalErrors] = useState<Record<string, string | undefined>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const showError = (msg: string) => notify.error(msg);

  const setFieldError = (name: string, msg?: string) => setExternalErrors(prev => ({ ...prev, [name]: msg }));

  const isLockedField = (fieldName: string) => lockedFields.includes(fieldName);

  useEffect(() => {
    if (!open) return;
    const combined = fields.reduce((acc, f) => {
      let initial: any;
      if (f.type === 'select' && Array.isArray(f.options) && f.options.length > 0) {
        initial = initialValues?.[f.name] ?? f.options[0].value;
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
    () => debounce(async (name: string, value: any, allValues: T) => {
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
    if (f.type === 'select' && Array.isArray(f.options) && typeof f.options[0]?.value === 'number') {
      newVal = Number(newVal);
    }

    setValues(prev => {
      const next = { ...prev, [name]: newVal };
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
      if (field.type === 'string' && field.minLength != null && typeof val === 'string' && val.length < field.minLength) {
        showError(`El campo "${field.label}" debe tener al menos ${field.minLength} caracteres.`);
        return;
      }
      if (field.regex && typeof val === 'string' && !field.regex.test(val)) {
        showError(`El campo "${field.label}" tiene un formato inválido.`);
        return;
      }
      if (field.type === 'number') {
        const n = Number(val);
        if (Number.isNaN(n)) { showError(`El campo "${field.label}" debe ser numérico.`); return; }
        if (field.min != null && n < field.min) { showError(`El campo "${field.label}" debe ser al menos ${field.min}.`); return; }
        if (field.max != null && n > field.max) { showError(`El campo "${field.label}" no debe superar ${field.max}.`); return; }
      }
      if (field.validate) {
        const msg = field.validate(val);
        if (msg) { showError(msg); return; }
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gridTemplateColumns={`repeat(${gridColumns}, 1fr)`} gap={`${gridGap}px`}>
            {fields.map(field => {
              const val = values[field.name] ?? '';
              const lay = layout[field.name] ?? {};

              const style: React.CSSProperties = {
                gridColumn: lay.colStart != null ? `${lay.colStart} / span ${lay.colSpan ?? 1}` : `auto / span ${lay.colSpan ?? 1}`,
                gridRow: lay.rowStart != null ? `${lay.rowStart} / span ${lay.rowSpan ?? 1}` : undefined,
                minWidth: 0,
              };

              const trimmedVal = typeof val === 'string' ? val.trim() : val;
              const length = String(trimmedVal).length;
              const minLen = field.minLength ?? 0;
              const maxLen = field.maxLength ?? Infinity;
              const reachedMax = field.maxLength != null && length >= field.maxLength;

              const isTooShort = field.type === 'string' && length < minLen;
              const isTooLong = field.type === 'string' && length > maxLen;

              const isBelowMin = field.type === 'number' && field.min != null && Number(val) < field.min;
              const isAboveMax = field.type === 'number' && field.max != null && Number(val) > field.max;

              const syncMsg = field.validate?.(val);
              const asyncMsg = externalErrors[field.name];
              const validationMessage = asyncMsg || syncMsg;

              const isError = !!validationMessage || isTooShort || isTooLong || isBelowMin || isAboveMax;

              const helperText =
                validationMessage
                  ? validationMessage
                  : isTooShort ? `Mínimo ${minLen} caracteres`
                    : isTooLong ? `Máximo ${maxLen} caracteres`
                      : isBelowMin ? `Debe ser al menos ${field.min}`
                        : isAboveMax ? `No debe superar ${field.max}`
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
                      onChange={(c) => setValues((prev) => ({ ...prev, [field.name]: c }))}
                      label={field.label}
                    />
                  </Box>
                )
              }

              if (field.type === 'search-select' && field.searchFromCache) {
                const term = searchTerms[field.name] ?? ''

                const allOptions = field.searchFromCache(gymId ?? '', '')
                let results = term ? field.searchFromCache(gymId ?? '', term) : allOptions

                // 👇 Fallback: si no hay resultados, mostrar todos
                if (!results || results.length === 0) {
                  results = allOptions
                }

                const selectedOption = values[field.name]
                  ? allOptions.find(o => o.value === values[field.name]) || null
                  : null

                return (
                  <Box key={field.name} style={style}>
                    <Autocomplete
                      options={results}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      getOptionLabel={(option) => option.label}
                      value={selectedOption}   // en create = null, en edit = alumno correcto
                      onInputChange={(_, newInputValue) => {
                        setSearchTerms(prev => ({ ...prev, [field.name]: newInputValue }))
                      }}
                      onChange={(_, newValue) => {
                        setValues(prev => ({ ...prev, [field.name]: newValue?.value ?? null }))
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={field.label}
                          placeholder={field.placeholder}
                          required={field.required}
                          error={isError}
                          helperText={helperText}
                        />
                      )}
                      disabled={locked}
                      noOptionsText={null}
                    />
                  </Box>
                )
              }

              return (
                <Box key={field.name} style={style}>
                  <TextField
                    onBlur={e => !locked && handleBlur(field.name, String(e.target.value))}
                    select={field.type === 'select'}
                    fullWidth
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
                    InputProps={{ readOnly: locked }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        const match = options.find(o =>
                          (o.value === selected) ||
                          (o.value == null && (selected == null || selected === ''))
                        );
                        if (match) return match.label;
                        return field.placeholder ?? '';
                      },
                    }}
                  >
                    {field.type === 'select' && options.map(opt => (
                      <MenuItem key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {field.maxLength != null && !isError && field.type === 'string' && (
                    <Typography variant="caption" color={reachedMax ? 'error' : 'text.secondary'}>
                      {length} / {maxLen}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{cancelText}</Button>
          {extraActions}
          <Button type="submit" variant="contained" disabled={hasErrors || hasEmptyRequired}>
            {confirmText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
