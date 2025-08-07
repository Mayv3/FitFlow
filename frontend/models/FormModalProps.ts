import { Field } from "./Field";
import { FieldLayout } from "./FieldLayout";

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