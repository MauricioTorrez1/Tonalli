/**
 * Root HTML shell for the web export (Expo Router's `+html` convention).
 * This is where the PWA gets wired up: manifest link, iOS "Add to Home
 * Screen" meta tags, and the offline service worker registration. Every
 * other route reuses this shell.
 */
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es-MX">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <meta
          name="description"
          content="Time-blocking calmo y offline, diseñado para sostener la atención."
        />
        {/*
          Expo Router's static export always injects its own empty
          react-helmet-async title slot (`<title data-rh="true"></title>`) at
          the very front of <head>, unconditionally — confirmed by inspecting
          the generated HTML, and it happens whether or not the code uses
          expo-router/head's <Head> component (which only fills that slot for
          a screen react-navigation considers "focused", never true during
          the static prerender pass). A second static <title> here wouldn't
          fix it: the browser's `document.title` getter/setter targets the
          *first* <title> in the document, which is that empty one. Setting
          it via script — synchronously, before <body> paints — is what
          actually works.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.title = "TonalliBlock";`,
          }}
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#121110" />
        <link rel="icon" href="/favicon.png" />

        {/* iOS "Add to Home Screen" — Safari ignores manifest.json for these. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Tonalli" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Matches React Native Web's root view for correct scroll behavior. */}
        <ScrollViewStyleReset />

        {/*
          Re-asserts the title once more after load, in case react-helmet's
          own hydration briefly re-empties it before settling — and
          registers the offline cache; both safe to no-op if unsupported.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function () {
                document.title = "TonalliBlock";
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                }
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
