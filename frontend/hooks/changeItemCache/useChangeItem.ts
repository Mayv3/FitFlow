import { QueryKey, useQueryClient } from '@tanstack/react-query';

type ChangeItemOptions<T> = {
  queryKey: QueryKey;
  identifierKey: keyof T;
  action: 'edit' | 'delete' | 'add';
  item: Partial<T>;
};

/** Pagina cacheada sobre la que opera changeItem. */
type CachedPage<T> = { items: T[]; total: number };

/**
 * Algunas entidades (alumnos) traen un `plan` anidado que se mergea en vez de
 * pisarse. Solo se toca si el item entrante lo trae.
 */
type WithPlan = { plan?: Record<string, unknown> };

export const useChangeItem = <T>() => {
  const queryClient = useQueryClient();

  const changeItem = ({ queryKey, identifierKey, action, item }: ChangeItemOptions<T>) => {
    queryClient.setQueryData<CachedPage<T>>(queryKey, oldData => {
      if (!oldData) return oldData;

      const idValue = item[identifierKey];
      if (!idValue) return oldData;

      let updatedItems = [...oldData.items];

      if (action === 'delete') {
        updatedItems = updatedItems.filter(i => i[identifierKey] !== idValue);
      }

      if (action === 'edit') {
        updatedItems = updatedItems.map(i => {
          if (i[identifierKey] !== idValue) return i;

          const next = { ...i, ...item };

          const incomingPlan = (item as WithPlan)?.plan;
          if (incomingPlan) {
            (next as WithPlan).plan = { ...(i as WithPlan).plan, ...incomingPlan };
          }

          return next as T;
        });
      }

      if (action === 'add') {
        const exists = updatedItems.some(i => i[identifierKey] === idValue);
        if (!exists) {
          updatedItems = [item as T, ...updatedItems];
        }
      }

      return {
        ...oldData,
        items: updatedItems,
        total: action === 'delete'
          ? oldData.total - 1
          : action === 'add'
            ? oldData.total + 1
            : oldData.total,
      };
    });
  };

  return { changeItem };
};
