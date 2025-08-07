import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    MenuItem
} from '@mui/material';
import { Field } from '@/models/Field';
import { FieldLayout } from '@/models/FieldLayout';

export interface FormModalProps<T> {
    open: boolean;
    title: string;
    fields: Field[];
    initialValues?: T | null;
    onClose: () => void;
    onSubmit: (values: T) => void;
    confirmText?: string;
    cancelText?: string;
    gridColumns?: number;
    gridGap?: number;
    layout?: Record<string, FieldLayout>;
}

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
}: FormModalProps<T>) => {
    const [values, setValues] = useState<T>({} as T);

    useEffect(() => {
        if (open) {
            const combined = fields.reduce((acc, f) => {
                let initial: any;
                if (f.type === 'select' && Array.isArray(f.defaultValue) && f.defaultValue.length > 0) {
                    initial = f.defaultValue[0];
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
        }
    }, [open, initialValues, fields]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const f = fields.find(x => x.name === name);
        if (!f) return;

        let newVal: any = value;

        if (f.regex && !f.regex.test(newVal)) return;

        if (f.type === 'string' && f.maxLength != null) {
            newVal = newVal.slice(0, f.maxLength);
        }

        if (
            f.type === 'select' &&
            Array.isArray(f.defaultValue) &&
            typeof f.defaultValue[0] === 'number'
        ) {
            newVal = Number(newVal);
        }

        setValues(prev => ({ ...prev, [name]: newVal }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        for (const field of fields) {
            const val = values[field.name];

            if (field.required && (val === undefined || val === null || val === '')) {
                alert(`El campo "${field.label}" es obligatorio.`);
                return;
            }

            if (
                field.type === 'string' &&
                field.minLength != null &&
                typeof val === 'string' &&
                val.length < field.minLength
            ) {
                alert(`El campo "${field.label}" debe tener al menos ${field.minLength} caracteres.`);
                return;
            }

            if (field.regex && typeof val === 'string' && !field.regex.test(val)) {
                alert(`El campo "${field.label}" tiene un formato inválido.`);
                return;
            }

            if (field.validate) {
                const msg = field.validate(val);
                if (msg) {
                    alert(msg);
                    return;
                }
            }
        }

        onSubmit(values);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent dividers>
                    <Box
                        display="grid"
                        gridTemplateColumns={`repeat(${gridColumns}, 1fr)`}
                        gap={`${gridGap}px`}
                    >
                        {fields.map(field => {
                            const val = values[field.name] ?? '';
                            const lay = layout[field.name] ?? {};
                            const style: React.CSSProperties = {
                                gridColumn: lay.colStart != null ? `${lay.colStart} / span ${lay.colSpan ?? 1}` : `auto / span ${lay.colSpan ?? 1}`,
                                gridRow: lay.rowStart != null ? `${lay.rowStart} / span ${lay.rowSpan ?? 1}` : undefined,
                                minWidth: 0,
                            };

                            const length = String(val).length;
                            const minLen = field.minLength ?? 0;
                            const maxLen = field.maxLength ?? Infinity;
                            const reachedMax = field.maxLength != null && length >= field.maxLength;

                            const isTooShort = field.type === 'string' && length < minLen;
                            const isTooLong = field.type === 'string' && length > maxLen;

                            const isNumber = field.type === 'number' && !isNaN(Number(val));
                            const isBelowMin = field.type === 'number' && field.min != null && Number(val) < field.min;
                            const isAboveMax = field.type === 'number' && field.max != null && Number(val) > field.max;

                            const validationMessage = field.validate?.(val);
                            const isExternalError = !!validationMessage;

                            const isError = isTooShort || isTooLong || isBelowMin || isAboveMax || isExternalError;

                            const helperText =
                                isExternalError ? validationMessage :
                                    isTooShort ? `Mínimo ${minLen} caracteres` :
                                        isTooLong ? `Máximo ${maxLen} caracteres` :
                                            isBelowMin ? `Debe ser al menos ${field.min}` :
                                                isAboveMax ? `No debe superar ${field.max}` :
                                                    '';

                            const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
                                maxLength: field.maxLength ?? undefined,
                                ...field.inputProps,
                            };

                            if (field.type === 'number') {
                                inputProps.min = field.min;
                                inputProps.max = field.max;
                            }

                            const options: string[] =
                                field.type === 'select' && Array.isArray(field.defaultValue)
                                    ? (field.defaultValue as string[])
                                    : [];

                            return (
                                <Box key={field.name} style={style}>
                                    <TextField
                                        onBlur={e => field.onBlur?.(String(e.target.value))}
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
                                    >
                                        {field.type === 'select' && options.map(opt => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {field.maxLength != null && !isError && field.type === 'string' && (
                                        <Typography
                                            variant="caption"
                                            color={reachedMax ? 'error' : 'text.secondary'}
                                        >
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
                    <Button type="submit" variant="contained">
                        {confirmText}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
