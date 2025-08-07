import { useQueryClient } from '@tanstack/react-query';

type ChangeItemOptions<T> = {
  queryKey: any[];
  identifierKey: keyof T;
  action: 'edit' | 'delete' | 'add';
  item: Partial<T>;
};

export const useChangeItem = <T>() => {
  const queryClient = useQueryClient();

  const changeItem = ({ queryKey, identifierKey, action, item }: ChangeItemOptions<T>) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      const idValue = item[identifierKey];
      if (!idValue) return oldData;

      let updatedItems = [...oldData.items];

      if (action === 'delete') {
        updatedItems = updatedItems.filter((i: T) => i[identifierKey] !== idValue);
      }

      if (action === 'edit') {
        updatedItems = updatedItems.map((i: T) =>
          i[identifierKey] === idValue ? { ...i, ...item } : i
        );
      }

      if (action === 'add') {
        const exists = updatedItems.some((i: T) => i[identifierKey] === idValue);
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
