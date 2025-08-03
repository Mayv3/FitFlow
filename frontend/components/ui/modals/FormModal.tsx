import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Grid, TextField, Typography
} from '@mui/material';

type Field = {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    inputProps?: any;
};

type FormModalProps<T = Record<string, any>> = {
    open: boolean;
    title: string;
    fields: Field[];
    initialValues?: T;
    onClose: () => void;
    onSubmit: (values: T) => void;
    confirmText?: string;
    cancelText?: string;
    gridColumns: number;
};

export const FormModal = <T extends Record<string, any>>({
    open,
    title,
    fields,
    initialValues = {} as T,
    onClose,
    onSubmit,
    confirmText = 'Guardar',
    cancelText = 'Cancelar',
    gridColumns = 3
}: FormModalProps<T>) => {
    const [values, setValues] = useState<T>(initialValues);

    useEffect(() => {
        setValues(initialValues);
    }, [initialValues, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const field = fields.find(f => f.name === name);

        let newValue: any = value;

        if (field?.type === 'number') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (field.max !== undefined) {
                    newValue = Math.min(numValue, field.max).toString();
                }
                if (field.min !== undefined) {
                    newValue = Math.max(parseFloat(newValue), field.min).toString();
                }
            }
        }

        setValues({ ...values, [name]: newValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(values);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <Box sx={{
                        pt: 2,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                        gap: 2
                    }}>
                        {fields.map((field) => {
                            const value = values[field.name] ?? '';
                            const isNumber = field.type === 'number';
                            const showCharCount = field.maxLength && !isNumber;

                            const inputProps = {
                                min: field.min,
                                max: field.max,
                                ...(showCharCount ? { maxLength: field.maxLength } : {}),
                                ...field.inputProps
                            };

                            return (
                                <Box key={field.name}>
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        name={field.name}
                                        type={field.type || 'text'}
                                        value={value}
                                        required={field.required}
                                        onChange={handleChange}
                                        inputProps={inputProps}
                                    />
                                    {isNumber && (field.min !== undefined || field.max !== undefined) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {field.min !== undefined ? `Mín: ${field.min}` : ''}
                                                {field.min !== undefined && field.max !== undefined ? ' - ' : ''}
                                                {field.max !== undefined ? `Máx: ${field.max}` : ''}
                                            </Typography>
                                        </Box>
                                    )}
                                    {showCharCount && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                            <Typography
                                                variant="caption"
                                                color={value.length === field.maxLength ? 'error' : 'text.secondary'}
                                            >
                                                {value.length} / {field.maxLength}
                                            </Typography>
                                        </Box>
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