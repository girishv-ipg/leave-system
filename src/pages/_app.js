import { CssBaseline } from '@mui/material';

export default function App({ Component, pageProps }) {
  return (
    <>
      <CssBaseline />
      <Component {...pageProps} />
    </>
  );
}
