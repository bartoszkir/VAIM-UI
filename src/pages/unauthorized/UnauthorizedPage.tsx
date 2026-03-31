import { Box, Button, Card, H2, P } from "@veracity/vui";
import AppHeader from "../../layouts/AppHeader";
import { Link } from "react-router";
import config from "../../config";

export default function UnauthorizedPage() {
  return (
    <Box column w={1} h="100vh">
      <AppHeader />
      <Box
        alignItems="center"
        aria-live="assertive"
        bg="sandstone.95"
        justifyContent="center"
        flex={1}
        role="alert"
      >
        <Card
          alignItems="center"
          bg="white"
          column
          justifyContent="center"
          maxW={580}
          minW={580}
          p={3}
          gap={3}
        >
          <H2>Unauthorized</H2>
          <P textAlign="center">
            You don't have permission to access this page.
          </P>
          <Link to={config.signInUrl}>
            <Button aria-label="Sign in">Sign in</Button>
          </Link>
        </Card>
      </Box>
    </Box>
  );
}
