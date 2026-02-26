import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, useMediaQuery, CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Field, FormModalProps } from '@/models/Fields/Field';
import { debounce } from '@/utils/debounce/debounce';
import { notify } from '@/lib/toast';
import { FormEnterToTab } from "@/components/ui/tables/FormEnterToTab"

import {
  resolveMetodoPago,
  getVisibleFields,
  applyPlanChangeEffects,
  applyServicioChangeEffects,
  applyProductoChangeEffects,
  applyMetodoPagoChangeEffects,
} from './formModal.payments';
import {
  validateAllFields,
  getFieldValidationState,
  computeCellStyle,
} from './formModal.validation';
import {
  ColorField,
  EmailsField,
  SearchSelectField,
  StandardField,
} from './formModal.fields';

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
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = React.useRef<HTMLInputElement | null>(null);

  const metodoSeleccionado = resolveMetodoPago(values['metodo_pago']);
  const visibleFields = getVisibleFields(fields, values['origen_pago'], metodoSeleccionado);

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const paperWidth = { xs: '92vw', sm: 560, md: 720 };

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

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
        if (typeof firstInputRef.current.select === 'function') {
          firstInputRef.current.select();
        }
      }
    }, 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (onValuesChange) onValuesChange(values);
  }, [values]);

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
    if (f.type === 'select' && Array.isArray(f.options) && typeof f.options[0]?.value === 'number') {
      newVal = Number(newVal);
    }
    if (f.inputProps?.style?.textTransform === 'capitalize' && typeof newVal === 'string') {
      newVal = newVal.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    setValues(prev => {
      let next = { ...prev, [name]: newVal } as Record<string, any>;

      if (name === 'plan_id') return applyPlanChangeEffects(next, fields, metodoSeleccionado) as T;
      if (name === 'metodo_pago') return applyMetodoPagoChangeEffects(next, resolveMetodoPago(newVal)) as T;

      if (name === 'servicio_id') next = applyServicioChangeEffects(next, fields, metodoSeleccionado);
      if (name === 'producto_id') next = applyProductoChangeEffects(next, fields, metodoSeleccionado);

      if (asyncTrigger === 'change') runAsyncValidation(name, newVal, next as T);
      return next as T;
    });
  };

  const handleBlur = (name: string, raw: any) => {
    if (isLockedField(name)) return;
    const f = fields.find(x => x.name === name);
    f?.onBlur?.(String(raw));
    if (asyncTrigger === 'blur') runAsyncValidation(name, raw, values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValues = Object.entries(values).reduce((acc, [key, val]) => {
      acc[key as keyof T] = typeof val === 'string' ? val.trim() : val;
      return acc;
    }, {} as T);

    const fieldError = validateAllFields(fields, trimmedValues);
    if (fieldError) { notify.error(fieldError); return; }

    const pendingExternalError = Object.values(externalErrors).find(Boolean);
    if (pendingExternalError) { notify.error(String(pendingExternalError)); return; }

    try {
      setSubmitting(true);
      await onSubmit(trimmedValues);
    } finally {
      setSubmitting(false);
    }
  };

  const isEmpty = (f: Field, v: any) =>
    v === undefined || v === null || (typeof v === 'string' ? v.trim() === '' : v === '');

  const hasErrors = Object.values(externalErrors).some(Boolean);
  const hasEmptyRequired = fields.some(f => f.required && isEmpty(f, values[f.name]));

  const renderField = (field: Field, index: number) => {
    const val = values[field.name] ?? '';
    const style = computeCellStyle(field.name, layout as Record<string, any>, isMdUp, metodoSeleccionado, values['origen_pago']);
    const locked = isLockedField(field.name);
    const { isError, helperText } = getFieldValidationState(field, val, externalErrors[field.name]);

    if (field.type === 'color') {
      return <ColorField key={field.name} field={field} val={val} style={style} setValues={setValues} />;
    }
    if (field.name === 'emails') {
      return <EmailsField key={field.name} field={field} val={val} style={style} mode={mode} setValues={setValues} />;
    }
    if (field.type === 'search-select' && field.searchFromCache) {
      return (
        <SearchSelectField
          key={field.name}
          field={field} val={val} style={style}
          isError={isError} helperText={helperText}
          isSmDown={isSmDown} locked={locked} gymId={gymId}
          searchTerms={searchTerms} setSearchTerms={setSearchTerms}
          setValues={setValues}
        />
      );
    }
    return (
      <StandardField
        key={field.name}
        field={field} val={val} style={style} index={index}
        isError={isError} helperText={helperText}
        isSmDown={isSmDown} locked={locked}
        firstInputRef={firstInputRef}
        handleChange={handleChange} handleBlur={handleBlur}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      scroll="paper"
      PaperProps={{ sx: { width: paperWidth, m: { xs: 2, sm: 3 }, borderRadius: 2 } }}
    >
      <FormEnterToTab onSubmit={handleSubmit}>
        <DialogTitle sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          {title}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            maxHeight: { xs: '68vh', sm: '72vh' },
            overflowY: 'auto',
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns={`repeat(${isMdUp ? gridColumns : 12}, 1fr)`}
            gap={`${isSmDown ? 12 : gridGap}px`}
          >
            {visibleFields.map(renderField)}
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
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            '& > :is(button, .MuiBox-root)': {
              width: { xs: '100%', sm: 'auto' },
            },
          }}
        >
          {extraActions}
          <Button onClick={onClose} variant="outlined" disabled={submitting}>{cancelText}</Button>
          <Button type="submit" variant="contained" disabled={hasErrors || hasEmptyRequired || submitting}>
            {submitting ? <CircularProgress size={22} color="inherit" /> : confirmText}
          </Button>
        </DialogActions>
      </FormEnterToTab>
    </Dialog>
  );
};
