import { createContext, useContext } from "react";
import type { UserInfo } from "./types";

const context = createContext<UserInfo | null>(null);

export const ContextProvider = context.Provider;

export function useUserInfo() {
  return useContext(context);
}
