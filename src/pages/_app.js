import { CssBaseline, ThemeProvider } from "@mui/material";

import { useAutoLogout } from "@/utils/useAutoLogout";

export default function App({ Component, pageProps }) {
  useAutoLogout();
  return (
    <>
      <CssBaseline />
      {/* <ThemeProvider theme={notionTheme}> */}
      <Component {...pageProps} />
      {/* </ThemeProvider> */}
    </>
  );
}
