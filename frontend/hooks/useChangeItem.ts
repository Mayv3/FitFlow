import { useQueryClient } from '@tanstack/react-query';

type ChangeItemOptions<T> = {
  queryKey: any[];
  identifierKey: keyof T;
  action: 'edit' | 'delete';
  item: Partial<T>; // Debe incluir el identificador
};

export const useChangeItem = <T>() => {
  const queryClient = useQueryClient();

  const changeItem = ({ queryKey, identifierKey, action, item }: ChangeItemOptions<T>) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      const idValue = item[identifierKey];

      if (!idValue) return oldData;

      const updatedItems =
        action === 'delete'
          ? oldData.items.filter((i: T) => i[identifierKey] !== idValue)
          : oldData.items.map((i: T) =>
              i[identifierKey] === idValue ? { ...i, ...item } : i
            );

      return {
        ...oldData,
        items: updatedItems,
        total: action === 'delete' ? oldData.total - 1 : oldData.total,
      };
    });
  };

  return { changeItem };
};
