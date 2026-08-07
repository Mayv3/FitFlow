import { useValidateDniFromApi } from "@/hooks/validatorsInput/useValidateDni";
import { FieldValue } from "@/models/Fields/Field";

export const useMemberAsyncValidators = () => {
  const validateDniApi = useValidateDniFromApi();

  return {
    dni: async (value: FieldValue) => {
      const v = String(value || '').trim();
      if (!v) return null;
      return await validateDniApi(v);
    }
  };
};