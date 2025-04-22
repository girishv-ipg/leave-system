import LoginPage from "./login";
import React from "react";
import { Stack } from "@mui/material";

const index = () => {
  return (
    <Stack sx={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <LoginPage />
    </Stack>
  );
};

export default index;
