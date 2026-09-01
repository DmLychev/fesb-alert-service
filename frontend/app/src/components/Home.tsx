import { Grid, GridItem, Stack } from "@chakra-ui/react";
import NavBar from "./NavBar";

const Home = () => {
  return (
    <Grid
      templateAreas={{
        base: `"nav" "main"`,
        lg: `"nav nav" "aside main"`,
      }}
    >
      <GridItem area="nav">
        <NavBar />
      </GridItem>
      <Stack hideBelow="lg">
        <GridItem area="aside" bg="gold">
          Aside
        </GridItem>
      </Stack>

      <GridItem area="main" bg="dodgerblue">
        Main
      </GridItem>
    </Grid>
  );
};

export default Home;
