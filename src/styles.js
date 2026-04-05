import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  :root {
    --color-brand-green: rgb(0, 255, 0);

    /* Light theme (default) */
    --cms-bg: #fafafa;
    --cms-surface: #f3f3f3;
    --cms-surface-hover: #f7f7f7;
    --cms-surface-bright: #ffffff;
    --cms-border: #e6e6e6;
    --cms-border-light: #ebebeb;
    --cms-line: #d0d0d0;
    --cms-line-hover: #c4c4c4;
    --cms-text: #9a9a9a;
    --cms-placeholder: #b8b8b8;
    --cms-emphasis: #888888;
    --cms-ink: #111111;
    --cms-error-text: #a85c5c;
    --cms-error-border: #f5d4d4;
    --cms-success-text: #5a7a66;
    --cms-success-border: #d8ebe0;
  }

  [data-theme="dark"] {
    --cms-bg: #161616;
    --cms-surface: #1e1e1e;
    --cms-surface-hover: #272727;
    --cms-surface-bright: #232323;
    --cms-border: #303030;
    --cms-border-light: #2a2a2a;
    --cms-line: #333333;
    --cms-line-hover: #444444;
    --cms-text: #707070;
    --cms-placeholder: #505050;
    --cms-emphasis: #8a8a8a;
    --cms-ink: #e0e0e0;
    --cms-error-text: #d4817f;
    --cms-error-border: #3d2222;
    --cms-success-text: #7fb894;
    --cms-success-border: #1e3326;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbars hidden app-wide; scrolling still works (wheel, trackpad, touch) */
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* legacy Edge / IE */
  }

  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Chromium Edge */
    width: 0;
    height: 0;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: var(--cms-bg);
    color: var(--cms-ink);
  }

  #root {
    min-height: 100vh;
  }
`;

export default GlobalStyle;
