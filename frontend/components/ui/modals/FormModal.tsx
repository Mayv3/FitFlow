import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Field, FieldValue, FormModalProps, FormValues } from '@/models/Fields/Field';
import { debounce } from '@/utils/debounce/debounce';
import { notify } from '@/lib/toast';
import { FormEnterToTab } from "@/components/ui/tables/FormEnterToTab"
import { FlushDialogActions } from './FlushDialogActions';

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

export const FormModal = <T extends object>({
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
  const [values, setValues] = useState<FormValues>({});
  const [externalErrors, setExternalErrors] = useState<Record<string, string | undefined>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = React.useRef<HTMLInputElement | null>(null);
  const wasOpenRef = useRef(false);

  const metodoSeleccionado = resolveMetodoPago(values['metodo_pago']);
  // `origen_pago` es siempre un select de strings; el resto de FieldValue no aplica.
  const origenPago = typeof values['origen_pago'] === 'string' ? values['origen_pago'] : undefined;
  const visibleFields = getVisibleFields(fields, origenPago, metodoSeleccionado);

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const paperWidth = { xs: '92vw', sm: 560, md: 720 };

  const setFieldError = (name: string, msg?: string) =>
    setExternalErrors(prev => ({ ...prev, [name]: msg }));

  const isLockedField = (fieldName: string) => lockedFields.includes(fieldName);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return; // already open — don't re-init on field option updates
    wasOpenRef.current = true;
    // T es la forma que expone el consumidor; adentro el form se maneja indexado por nombre.
    const initialsByName = (initialValues ?? {}) as FormValues;
    const combined = fields.reduce((acc, f) => {
      let initial: FieldValue;
      if (f.type === 'select' && Array.isArray(f.options) && f.options.length > 0) {
        initial = initialsByName[f.name] ?? '';
      } else {
        initial = initialsByName[f.name] ?? f.defaultValue ?? '';
      }
      if (typeof initial === 'string' && f.maxLength != null) {
        initial = initial.slice(0, f.maxLength);
      }
      acc[f.name] = initial;
      return acc;
    }, {} as FormValues);
    setValues(combined);
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

  // Ref al ultimo onValuesChange: si el padre no lo memoiza, ponerlo en deps
  // haria que el efecto corriera en cada render del padre.
  const onValuesChangeRef = React.useRef(onValuesChange);
  useEffect(() => { onValuesChangeRef.current = onValuesChange; }, [onValuesChange]);

  useEffect(() => {
    onValuesChangeRef.current?.(values as unknown as T);
  }, [values]);

  const runAsyncValidation = React.useMemo(
    () =>
      debounce(async (name: string, value: FieldValue, allValues: FormValues) => {
        const fn = asyncValidators?.[name];
        if (!fn) return;
        const current = String(value);
        const msg = await fn(value, allValues as unknown as T);
        if (String(allValues[name]) === current) {
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

    let newVal: FieldValue = value;
    if (f.regex && !f.regex.test(value)) return;
    if (f.type === 'string' && f.maxLength != null) newVal = value.slice(0, f.maxLength);
    if (f.type === 'select' && Array.isArray(f.options) && typeof f.options[0]?.value === 'number') {
      newVal = Number(newVal);
    }
    if (f.inputProps?.style?.textTransform === 'capitalize' && typeof newVal === 'string') {
      newVal = newVal.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    setValues(prev => {
      let next: FormValues = { ...prev, [name]: newVal };

      if (name === 'plan_id') return applyPlanChangeEffects(next, fields, metodoSeleccionado);
      if (name === 'metodo_pago') return applyMetodoPagoChangeEffects(next, resolveMetodoPago(newVal));

      if (name === 'servicio_id') next = applyServicioChangeEffects(next, fields, metodoSeleccionado);
      if (name === 'producto_id') next = applyProductoChangeEffects(next, fields, metodoSeleccionado, true);
      if (name === 'cantidad_producto') next = applyProductoChangeEffects(next, fields, metodoSeleccionado, false);

      if (asyncTrigger === 'change') runAsyncValidation(name, newVal, next);
      return next;
    });
  };

  const handleBlur = (name: string, raw: FieldValue) => {
    if (isLockedField(name)) return;
    const f = fields.find(x => x.name === name);
    f?.onBlur?.(String(raw));
    if (asyncTrigger === 'blur') runAsyncValidation(name, raw, values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValues = Object.entries(values).reduce((acc, [key, val]) => {
      acc[key] = typeof val === 'string' ? val.trim() : val;
      return acc;
    }, {} as FormValues);

    const fieldError = validateAllFields(fields, trimmedValues);
    if (fieldError) { notify.error(fieldError); return; }

    const pendingExternalError = Object.values(externalErrors).find(Boolean);
    if (pendingExternalError) { notify.error(String(pendingExternalError)); return; }

    try {
      setSubmitting(true);
      await onSubmit(trimmedValues as unknown as T);
    } finally {
      setSubmitting(false);
    }
  };

  const isEmpty = (v: FieldValue) =>
    v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

  const hasErrors = Object.values(externalErrors).some(Boolean);
  const hasEmptyRequired = fields.some(f => f.required && isEmpty(values[f.name]));

  const renderField = (field: Field, index: number) => {
    const val = values[field.name] ?? '';
    const style = computeCellStyle(field.name, layout, isMdUp, metodoSeleccionado, origenPago);
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
      PaperProps={{ sx: { width: paperWidth, m: { xs: 2, sm: 3 }, borderRadius: 2, overflow: 'hidden' } }}
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

        <Box sx={{ position: 'sticky', bottom: 0, zIndex: 1, bgcolor: theme.palette.background.paper }}>
          {extraActions && (
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 1.5,
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              {extraActions}
            </Box>
          )}
          <FlushDialogActions
            actions={[
              { label: cancelText, onClick: onClose, disabled: submitting, tone: 'neutral' },
              {
                label: confirmText,
                type: 'submit',
                tone: 'confirm',
                disabled: hasErrors || hasEmptyRequired || submitting,
                loading: submitting,
              },
            ]}
          />
        </Box>
      </FormEnterToTab>
    </Dialog>
  );
};
