import { Navigate, Route, Routes } from "react-router";
import MainLayout from "./layouts/MainLayout";
import ArtifactsPage from "./pages/artifacts/ArtifactsPage";
import UnauthorizedPage from "./pages/unauthorized/UnauthorizedPage";
import TagsPage from "./pages/tags/TagsPage";
import BundlesPage from "./pages/bundles/BundlesPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/bundles" replace />} />
        <Route path="/bundles" element={<BundlesPage />} />
        <Route path="/artifacts" element={<ArtifactsPage />} />
        <Route path="/tags" element={<TagsPage />} />
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
}
