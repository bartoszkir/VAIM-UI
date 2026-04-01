import { BrowserRouter } from "react-router";
import { LinksProvider, VuiProvider, Toaster } from "@veracity/vui";
import { AppQueryClientProvider } from "./api/client";
import AppRouter from "./Router";
import AuthProvider from "./auth/AuthProvider";

export default function App() {
  return (
    <BrowserRouter>
      <AppQueryClientProvider>
        <VuiProvider>
          <AuthProvider>
            <LinksProvider>
              <AppRouter />
            </LinksProvider>
            <Toaster />
          </AuthProvider>
        </VuiProvider>
      </AppQueryClientProvider>
    </BrowserRouter>
  );
}
