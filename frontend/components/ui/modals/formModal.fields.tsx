import React from 'react';
import { Box, TextField, Typography, MenuItem, Chip, Autocomplete } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Field, FieldValue, FormValues, SelectOption } from '@/models/Fields/Field';
import { ColorPickerPopover } from '../colorSelector/colorSelector';

// ── ColorField ────────────────────────────────────────────────────────────────

export interface ColorFieldProps {
  field: Field;
  val: FieldValue;
  style: React.CSSProperties;
  setValues: React.Dispatch<React.SetStateAction<FormValues>>;
}

export const ColorField: React.FC<ColorFieldProps> = ({ field, val, style, setValues }) => (
  <Box style={style}>
    <ColorPickerPopover
      value={typeof val === 'string' ? val : ''}
      onChange={c => setValues(prev => ({ ...prev, [field.name]: c }))}
      label={field.label}
    />
  </Box>
);

// ── EmailsField ───────────────────────────────────────────────────────────────

export interface EmailsFieldProps {
  field: Field;
  val: FieldValue;
  style: React.CSSProperties;
  mode: string;
  setValues: React.Dispatch<React.SetStateAction<FormValues>>;
}

export const EmailsField: React.FC<EmailsFieldProps> = ({ field, val, style, mode, setValues }) => {
  if (mode === 'edit') return null;
  return (
    <Box style={style}>
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
        {(Array.isArray(val) ? val : []).map((email: string, i: number) => (
          <Chip
            key={i}
            label={email}
            onDelete={() =>
              setValues(prev => ({
                ...prev,
                emails: (Array.isArray(prev.emails) ? prev.emails : []).filter(
                  (_, idx) => idx !== i
                ),
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
              e.preventDefault();
              const input = (e.target as HTMLInputElement).value.trim();
              if (input && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
                setValues(prev => ({
                  ...prev,
                  emails: [...(Array.isArray(prev.emails) ? prev.emails : []), input],
                }));
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          sx={{ flex: 1, minWidth: 180 }}
        />
      </Box>
    </Box>
  );
};

// ── SearchSelectField ─────────────────────────────────────────────────────────

export interface SearchSelectFieldProps {
  field: Field;
  val: FieldValue;
  style: React.CSSProperties;
  isError: boolean;
  helperText: string;
  isSmDown: boolean;
  locked: boolean;
  searchTerms: Record<string, string>;
  setSearchTerms: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setValues: React.Dispatch<React.SetStateAction<FormValues>>;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Autocomplete que busca en el server (`field.searchRemote`) mientras se
 * escribe, en vez de filtrar una lista entera cargada de antemano.
 */
export const SearchSelectField: React.FC<SearchSelectFieldProps> = ({
  field, val, style, isError, helperText, isSmDown, locked,
  searchTerms, setSearchTerms, setValues,
}) => {
  const term = searchTerms[field.name] ?? '';
  const { searchRemote, resolveOption } = field;

  const [debouncedTerm, setDebouncedTerm] = React.useState(term);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(term), term ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [term]);

  const search = useQuery({
    queryKey: ['search-select', field.name, debouncedTerm],
    queryFn: () => searchRemote!(debouncedTerm),
    enabled: Boolean(searchRemote),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
  const results = search.data ?? [];

  // Opción elegida: la que se tocó en el dropdown, la que vino en la búsqueda,
  // o (modo edición) la que trae resolveOption para el valor ya cargado.
  const [picked, setPicked] = React.useState<SelectOption | null>(null);
  const hasVal = val !== null && val !== undefined && val !== '';
  const fromPick = hasVal && picked?.value === val ? picked : undefined;
  const fromResults = hasVal ? results.find(o => o.value === val) : undefined;
  const resolved = useQuery({
    queryKey: ['search-select-resolve', field.name, val],
    queryFn: () => resolveOption!(val),
    enabled: hasVal && !fromPick && !fromResults && Boolean(resolveOption),
    staleTime: 5 * 60 * 1000,
  });
  const selectedOption = hasVal ? (fromPick ?? fromResults ?? resolved.data ?? null) : null;

  // La opción elegida siempre tiene que estar entre las options del Autocomplete.
  const options = selectedOption && !results.some(o => o.value === selectedOption.value)
    ? [selectedOption, ...results]
    : results;

  return (
    <Box style={style}>
      <Autocomplete
        options={options}
        filterOptions={x => x}
        loading={search.isFetching}
        isOptionEqualToValue={(o, v) => o.value === v.value}
        getOptionLabel={option => option.label}
        value={selectedOption}
        onInputChange={(_, newInputValue, reason) => {
          // 'reset' = MUI pone el label de la opción elegida: no es una búsqueda.
          if (reason === 'reset') return;
          setSearchTerms(prev => ({ ...prev, [field.name]: newInputValue }));
        }}
        onChange={(_, newValue: SelectOption | null) => {
          setPicked(newValue);
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
        loadingText="Buscando…"
        noOptionsText="Sin resultados"
        fullWidth
      />
    </Box>
  );
};

// ── StandardField ─────────────────────────────────────────────────────────────

export interface StandardFieldProps {
  field: Field;
  val: FieldValue;
  style: React.CSSProperties;
  index: number;
  isError: boolean;
  helperText: string;
  isSmDown: boolean;
  locked: boolean;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (name: string, raw: FieldValue) => void;
}

export const StandardField: React.FC<StandardFieldProps> = ({
  field, val, style, index, isError, helperText, isSmDown, locked,
  firstInputRef, handleChange, handleBlur,
}) => {
  const trimmedVal = typeof val === 'string' ? val.trim() : val;
  const length = String(trimmedVal).length;
  const maxLen = field.maxLength ?? Infinity;
  const reachedMax = field.maxLength != null && length >= field.maxLength;

  const options = Array.isArray(field.options) ? field.options : [];
  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    maxLength: field.maxLength ?? undefined,
    ...field.inputProps,
  };
  if (field.type === 'number') {
    inputProps.min = field.min;
    inputProps.max = field.max;
  }

  return (
    <Box style={style}>
      <TextField
        inputRef={index === 0 ? firstInputRef : undefined}
        onBlur={e => !locked && handleBlur(field.name, String(e.target.value))}
        select={field.type === 'select'}
        fullWidth
        size={isSmDown ? 'small' : 'medium'}
        label={field.label}
        name={field.name}
        type={field.type !== 'select' ? field.type : undefined}
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
            <MenuItem
              key={String(opt.value)}
              value={opt.value ?? ''}
              disabled={opt.disabled ?? false}
            >
              {opt.label}
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
};
