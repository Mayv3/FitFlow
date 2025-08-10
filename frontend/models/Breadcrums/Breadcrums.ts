export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export interface CustomBreadcrumbsProps {
  items: BreadcrumbItem[];
};