'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  Grid,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Field } from '@/models/Fields/Field';

interface SimpleFormModalProps {
  open: boolean;
  title: string;
  fields: Field[];
  initialValues?: Record<string, any>;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
  confirmText?: string;
  cancelText?: string;
  gridColumns?: number;
  gridGap?: number;
  layout?: Record<string, any>;
  mode?: 'create' | 'edit';
}

export const SimpleFormModal: React.FC<SimpleFormModalProps> = ({
  open,
  title,
  fields,
  initialValues = {},
  onClose,
  onSubmit,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  gridColumns = 12,
  gridGap = 16,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      const initialFormValues: Record<string, any> = {};
      fields.forEach((field) => {
        initialFormValues[field.name] =
          initialValues?.[field.name] ?? field.defaultValue ?? '';
      });
      setValues(initialFormValues);
    }
  }, [open, fields, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: gridGap / 8 }}>
          {fields.map((field) => {
            if (field.type === 'select') {
              return (
                <FormControl fullWidth key={field.name} margin="normal">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    name={field.name}
                    value={values[field.name] ?? ''}
                    onChange={handleChange as any}
                    label={field.label}
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (field.type === 'date') {
              return (
                <TextField
                  key={field.name}
                  type="date"
                  name={field.name}
                  label={field.label}
                  value={values[field.name] ?? ''}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  fullWidth
                  margin="normal"
                />
              );
            }

            if (field.type === 'number') {
              return (
                <TextField
                  key={field.name}
                  type="number"
                  name={field.name}
                  label={field.label}
                  value={values[field.name] ?? ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  fullWidth
                  margin="normal"
                />
              );
            }

            return (
              <TextField
                key={field.name}
                name={field.name}
                label={field.label}
                value={values[field.name] ?? ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                multiline={field.type === 'string' && field.placeholder?.includes('Describe')}
                rows={field.type === 'string' && field.placeholder?.includes('Describe') ? 3 : 1}
                fullWidth
                margin="normal"
              />
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          {cancelText}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};