import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasValidSession } from "../auth";

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuthorization = async () => {
      const authorized = await hasValidSession();

      if (cancelled) return;

      setIsAuthorized(authorized);
      setIsLoading(false);
    };

    void checkAuthorization();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <>Loading...</>;

  return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
