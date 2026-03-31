import { LoggedInHeader, LoggedOutHeader, styled } from "@veracity/vui";
import config from "../config";
import { useUserInfo } from "../auth/authContext";

const StyledLoggedInHeader = styled(LoggedInHeader)`
  top: 0px;
`;

const StyledLoggedOutHeader = styled(LoggedOutHeader)`
  top: 0px;
`;

export default function AppHeader() {
  const userInfo = useUserInfo();
  const commonHeaderProps = {
    applicationName: config.applicationName,
    isApplication: true,
    isSticky: true,
    zIndex: 222,
  };

  return userInfo != null ? (
    <StyledLoggedInHeader
      account={{ userInfo }}
      isCleanLayout
      url={config.signOutUrl}
      {...commonHeaderProps}
    />
  ) : (
    <StyledLoggedOutHeader
      createAccount={<></>}
      signIn={{ url: config.signInUrl }}
      {...commonHeaderProps}
    />
  );
}
