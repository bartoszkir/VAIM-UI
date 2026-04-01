import { useQuery } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router";
import { Box, Spinner } from "@veracity/vui";
import { ContextProvider } from "./authContext";
import { getCurrentUser } from "../api/auth";

export default function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isError, isPending } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    if (isError && pathname !== "/unauthorized") {
      navigate("/unauthorized", { replace: true });
    }
  }, [isError, navigate, pathname]);

  if (isPending) {
    return (
      <Box
        column
        alignItems="center"
        justifyContent="center"
        h="100dvh"
        w={1}
        aria-live="polite"
      >
        <Spinner aria-label="Loading authentication state" />
      </Box>
    );
  }

  return <ContextProvider value={data ?? null}>{children}</ContextProvider>;
}
