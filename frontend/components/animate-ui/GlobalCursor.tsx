'use client';

import {
  Cursor,
  CursorProvider,
} from '@/components/animate-ui/components/animate/cursor';

/**
 * Cursor animado global. Reemplaza el puntero nativo en toda la web.
 * Montado una sola vez en el RootLayout.
 */
export function GlobalCursor() {
  return (
    <CursorProvider global>
      <Cursor />
    </CursorProvider>
  );
}
