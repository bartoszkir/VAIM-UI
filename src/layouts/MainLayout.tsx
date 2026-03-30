import {
  Box,
  Footer,
  LoggedInHeader,
  LoggedOutHeader,
  Sidemenu,
  styled,
} from "@veracity/vui";
import { Outlet, useNavigate } from "react-router";

const StyledLoggedInHeader = styled(LoggedInHeader)`
  top: 0px;
`;
const StyledLoggedOutHeader = styled(LoggedOutHeader)`
  top: 0px;
`;

const APP_NAME = "AI Marketplace";

export default function MainLayout() {
  const isLoggedIn = true;

  const account = {
    userInfo: {
      companyName: "Veracity",
      displayName: "John Doe",
    },
  };

  const commonHeaderProps = {
    applicationName: APP_NAME,
    isApplication: true,
    isSticky: true,
    zIndex: 222,
  };

  const sidemenuItems = [
    { title: "Skills", path: "/skills", icon: "uiCode" },
    { title: "Agents", path: "/agents", icon: "uiBrainCircuit" },
    { title: "Prompts", path: "/prompts", icon: "uiBookOpen" },
    { title: "Instructions", path: "/instructions", icon: "uiCogs" },
  ];

  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box column w={1}>
      {isLoggedIn ? (
        <StyledLoggedInHeader
          account={account}
          isCleanLayout
          url="/logout"
          {...commonHeaderProps}
        />
      ) : (
        <StyledLoggedOutHeader
          createAccount={{ url: "https://id.veracity.com/sign-up" }}
          signIn={{ url: "/sign-in" }}
          {...commonHeaderProps}
        />
      )}
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
