import { useEffect, useState, type ReactNode } from "react";
import { hasValidSession } from "../auth";
import { Navigate } from "react-router-dom";

interface LoginRouteProps {
  children: ReactNode;
}

function LoginRoute({ children }: LoginRouteProps) {
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

  return isAuthorized ? <Navigate to="/" replace /> : children;
}

export default LoginRoute;
