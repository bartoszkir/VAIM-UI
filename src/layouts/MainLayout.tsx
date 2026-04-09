import { Box, Footer, Sidemenu } from "@veracity/vui";
import { Outlet, useNavigate } from "react-router";
import AppHeader from "./AppHeader";

export default function MainLayout() {
  const sidemenuItems = [
    { title: "Skills", path: "/skills", icon: "uiCode" },
    { title: "Agents", path: "/agents", icon: "uiBrainCircuit" },
    { title: "Prompts", path: "/prompts", icon: "uiBookOpen" },
    { title: "Instructions", path: "/instructions", icon: "uiCogs" },
    { title: "Tags", path: "/tags", icon: "uiBookmark" },
  ];

  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box column w={1}>
      <AppHeader />
      <Box w="auto">
        <Sidemenu
          isSticky
          zIndex={111}
          items={sidemenuItems}
          onNavigate={handleNavigate}
        />
        <Box column w={1} minH="calc(100vh - 72px)" bg="sandstone.95">
          <Outlet />
        </Box>
      </Box>
      <Footer isSlim />
    </Box>
  );
}
