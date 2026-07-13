'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-white">Algo salió mal</h1>
        <p className="mt-2 text-sm text-white/60">
          Ocurrió un error inesperado. Puedes intentar de nuevo.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
