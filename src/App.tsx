import { BrowserRouter } from "react-router";
import { LinksProvider, VuiProvider, Toaster } from "@veracity/vui";
import { AppQueryClientProvider } from "./api/client";
import AppRouter from "./Router";
import AuthProvider from "./auth/AuthProvider";
import ModalProvider from "./shared/modals/ModalProvider";

export default function App() {
  return (
    <BrowserRouter>
      <AppQueryClientProvider>
        <VuiProvider>
          <AuthProvider>
            <ModalProvider>
              <LinksProvider>
                <AppRouter />
              </LinksProvider>
            </ModalProvider>
            <Toaster />
          </AuthProvider>
        </VuiProvider>
      </AppQueryClientProvider>
    </BrowserRouter>
  );
}
