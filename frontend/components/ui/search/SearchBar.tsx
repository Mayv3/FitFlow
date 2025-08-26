'use client';
import { useEffect, useRef, useState } from 'react';
import { TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { SearchBarProps } from '@/models/Search/Search';
import { searchValidator } from '@/utils/validators/searchValidator';

export function SearchBar({
    value,
    onChange,
    onSearch,
    placeholder = 'Buscar por DNI, nombre, email o teléfono…',
    isLoading = false,
    autoFocus = false,
}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [local, setLocal] = useState(value);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    const handleCommit = () => {
        onSearch?.(local.trim());
    };

    const handleChange = (next: string) => {
        const { valido } = searchValidator(next);

        if (next === '') {
            setLocal(next);
            onChange(next);
            return;
        }

        if (!valido) return;

        setLocal(next);
        onChange(next);
    };
    return (
        <TextField
            fullWidth
            sx={{ flex: 1 }}
            value={local}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommit();
            }}
            placeholder={placeholder}
            inputRef={inputRef}
            error={!searchValidator(local).valido && local !== ''}
            helperText={!searchValidator(local).valido && local !== '' ? 'Entrada inválida' : ' '}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton aria-label="Buscar" edge="start" onClick={handleCommit}>
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            {isLoading ? (
                                <CircularProgress size={18} />
                            ) : value ? (
                                <IconButton
                                    aria-label="Limpiar búsqueda"
                                    edge="end"
                                    onClick={() => {
                                        setLocal('');
                                        onChange('');
                                        onSearch?.('');
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            ) : null}
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
