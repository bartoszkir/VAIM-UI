import { BrowserRouter } from "react-router";
import { LinksProvider, VuiProvider, Toaster } from "@veracity/vui";
import { AppQueryClientProvider } from "./api/client";
import AppRouter from "./Router";
import AuthProvider from "./auth/AuthProvider";

export default function App() {
  return (
    <BrowserRouter>
      <AppQueryClientProvider>
        <AuthProvider>
          <VuiProvider>
            <LinksProvider>
              <AppRouter />
            </LinksProvider>
            <Toaster />
          </VuiProvider>
        </AuthProvider>
      </AppQueryClientProvider>
    </BrowserRouter>
  );
}
