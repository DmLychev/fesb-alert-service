import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasValidSession } from "../auth";

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuthorization = async () => {
      const authorized = await hasValidSession();

      if (!cancelled) setIsAuthorized(authorized);
    };

    void checkAuthorization();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthorized === null) return <>Loading...</>;

  return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
