import { Navigate, Route, Routes } from "react-router";
import MainLayout from "./layouts/MainLayout";
import SkillsPage from "./pages/skills/SkillsPage";
import AgentsPage from "./pages/agents/AgentsPage";
import PromptsPage from "./pages/prompts/PromptsPage";
import InstructionsPage from "./pages/instructions/InstructionsPage";
import UnauthorizedPage from "./pages/unauthorized/UnauthorizedPage";
import TagsPage from "./pages/tags/TagsPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/skills" />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/instructions" element={<InstructionsPage />} />
        <Route path="/tags" element={<TagsPage />} />
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
}
