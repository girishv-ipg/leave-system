import { CssBaseline, ThemeProvider } from "@mui/material";

export default function App({ Component, pageProps }) {
  return (
    <>
      <CssBaseline />
      {/* <ThemeProvider theme={notionTheme}> */}
      <Component {...pageProps} />
      {/* </ThemeProvider> */}
    </>
  );
}
