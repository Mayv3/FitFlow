import { useValidateDniFromApi } from "@/hooks/validatorsInput/useValidateDni";

export const useMemberAsyncValidators = () => {
  const validateDniApi = useValidateDniFromApi();

  return {
    dni: async (value: string) => {
      const v = String(value || '').trim();
      if (!v) return null;
      return await validateDniApi(v);
    }
  };
};