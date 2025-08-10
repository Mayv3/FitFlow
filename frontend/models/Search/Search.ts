export interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  debounce?: number;
};