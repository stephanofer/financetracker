import { useRouteError, isRouteErrorResponse } from "react-router";

export function ErrorContainer() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          {error.status} - {error.statusText}
        </h1>
        <p>{error.data?.message || "Ocurrió un error inesperado."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600">Error inesperado</h1>
      <p>{String(error)}</p>
    </div>
  );
}
