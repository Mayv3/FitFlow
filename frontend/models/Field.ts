export type Field = {
    label: string;
    name: string;
    type: 'string' | 'number' | 'email' | 'date' | 'select';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    placeholder?: string;
    defaultValue?: any;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    onBlur?: (value: string) => void;
    validate?: (value: any) => string | null;
    regex?: RegExp;
};


export type FormModalProps<T = Record<string, any>> = {
    open: boolean;
    title: string;
    fields: Field[];
    initialValues?: T | null;
    onClose: () => void;
    onSubmit: (values: T) => void;
    confirmText?: string;
    cancelText?: string;
    gridColumns: number;
};