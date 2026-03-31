import {
  createContext,
  createElement,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import type { UserInfo } from "./types";
import { fetchCurrentUser } from "../api/authService";

const context = createContext<UserInfo | null>(null);

export function useUserInfo() {
  return useContext(context);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isError } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  useEffect(() => {
    if (isError && pathname !== "/unauthorized") {
      navigate("/unauthorized", { replace: true });
    }
  }, [isError, navigate, pathname]);

  return createElement(context.Provider, { value: data ?? null }, children);
}
