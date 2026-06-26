/**
 * _app.jsx
 *
 * Custom Next.js App component. Runs on every page.
 * Imports global styles including Tailwind CSS and fonts.
 */

import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
