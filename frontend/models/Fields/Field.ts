import { FieldLayout } from "./FieldLayout";

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
  regex?: RegExp;
  disabled?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  onBlur?: (value: string) => void;
  validate?: (value: any) => string | null;
  onChange?:
  | ((value: any, values: Record<string, any>) => Record<string, any>)
  | ((value: any, values: Record<string, any>) => void);
};


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
  mode?: 'create' | 'edit';
  lockedFields?: string[];
  asyncValidators?: Record<string, (value: any, values: T) => Promise<string | null>>;
  asyncTrigger?: 'blur' | 'change';
  asyncDebounceMs?: number;
}