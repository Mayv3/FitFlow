export interface TokenPayload {
  id: string;
  dni: string;
  role: 'administrador' | 'recepcionista';
  gym_id: string;
  iat: number;
  exp: number;
};