import { FieldLayout } from "./FieldLayout";

/**
 * Opcion de un `select`. Los ids del backend llegan como number (alumnos, planes)
 * o como string (productos, servicios via String(s.id)), asi que el contrato
 * admite ambos. null = opcion vacia.
 */
export type SelectOption = {
  label: string;
  value: string | number | null;
  disabled?: boolean;
  /**
   * Metadata que las options de planes adjuntan (ver hooks/plans/usePlanesPrecios)
   * para que el form de pagos autocomplete monto y clases al elegir un plan.
   */
  precio?: number;
  numero_clases?: number;
};

/**
 * Valor que puede tomar un campo del form. `string[]` cubre el campo `emails`,
 * el unico multivaluado.
 */
export type FieldValue = string | number | boolean | string[] | null | undefined;

/** Estado de un formulario indexado por `Field['name']`. */
export type FormValues = Record<string, FieldValue>;

export type Field = {
  label: string;
  name: string;
  type: 'string' | 'number' | 'email' | 'date' | 'search-select' | 'time' | 'select' | 'color' | 'password';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  defaultValue?: FieldValue;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  regex?: RegExp;
  disabled?: boolean;
  options?: SelectOption[];
  onBlur?: (value: string) => void;
  validate?: (value: FieldValue) => string | null;
  searchFromCache?: (gymId: string, q: string) => SelectOption[];
};


export interface FormModalProps<T> {
  open: boolean;
  title: string;
  fields: Field[];
  /** Semilla del form: puede ser parcial (ej. solo `origen_pago`). */
  initialValues?: Partial<T> | null;
  onClose: () => void;
  onSubmit: (values: T) => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  gridColumns?: number;
  gridGap?: number;
  layout?: Record<string, FieldLayout>;
  mode?: 'create' | 'edit';
  lockedFields?: string[];
  asyncValidators?: Record<string, (value: FieldValue, values: T) => Promise<string | null>>;
  asyncTrigger?: 'blur' | 'change';
  asyncDebounceMs?: number;
  gymId?: string;
  extraActions?: React.ReactNode
  onValuesChange?: (values: T) => void;
}