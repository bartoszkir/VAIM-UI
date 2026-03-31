import { BrowserRouter } from "react-router";
import { LinksProvider, VuiProvider, Toaster } from "@veracity/vui";
import AppRouter from "./Router";

export default function App() {
  return (
    <BrowserRouter>
      <VuiProvider>
        <LinksProvider>
          <AppRouter />
        </LinksProvider>
        <Toaster />
      </VuiProvider>
    </BrowserRouter>
  );
}
