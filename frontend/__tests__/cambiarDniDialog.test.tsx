import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

jest.mock('@/hooks/validatorsInput/useValidateDni', () => ({
  useValidateDniFromApi: () => jest.fn().mockResolvedValue(null),
}));

import { CambiarDniDialog } from '@/components/dashboard/members/CambiarDniDialog';

describe('CambiarDniDialog', () => {
  it('abre directo en el campo del DNI nuevo, sin pedir confirmación', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <CambiarDniDialog open dniActual="12345678" onClose={() => {}} onChanged={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByRole('textbox', { name: /nuevo dni/i })).toBeInTheDocument();
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sí, editar/i })).not.toBeInTheDocument();
  });
});
