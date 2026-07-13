'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-black font-sans text-white antialiased">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Algo salió mal</h1>
          <p className="mt-2 text-sm text-white/60">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
        </div>
      </body>
    </html>
  );
}
