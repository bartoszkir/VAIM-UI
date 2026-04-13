import { Box, Footer, Sidemenu } from "@veracity/vui";
import { Outlet, useNavigate } from "react-router";
import AppHeader from "./AppHeader";

export default function MainLayout() {
  const sidemenuItems = [
    { title: "Artifacts", path: "/artifacts", icon: "uiDatabase" },
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
        <Box
          column
          w={1}
          h="calc(100vh - 72px)"
          bg="sandstone.95"
          overflow="auto"
        >
          <Outlet />
        </Box>
      </Box>
      <Footer isSlim />
    </Box>
  );
}
