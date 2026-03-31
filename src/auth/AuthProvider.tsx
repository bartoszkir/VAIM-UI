import { useQuery } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router";
import { ContextProvider } from "./authContext";
import { getCurrentUser } from "../api/auth";

export default function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isError } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    if (isError && pathname !== "/unauthorized") {
      navigate("/unauthorized", { replace: true });
    }
  }, [isError, navigate, pathname]);

  return <ContextProvider value={data}>{children}</ContextProvider>;
}
