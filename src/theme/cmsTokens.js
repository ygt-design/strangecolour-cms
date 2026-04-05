export const FONT_STACK = "'Citerne', system-ui, -apple-system, sans-serif";

export const FW_LIGHT = 300;
export const FW_MEDIUM = 500;
export const FW_BOLD = 700;

/**
 * Color tokens backed by CSS custom properties.
 * Light/dark values are defined in styles.js via :root / [data-theme="dark"].
 */
export const G = {
  bg: "var(--cms-bg)",
  surface: "var(--cms-surface)",
  surfaceHover: "var(--cms-surface-hover)",
  surfaceBright: "var(--cms-surface-bright)",
  border: "var(--cms-border)",
  borderLight: "var(--cms-border-light)",
  line: "var(--cms-line)",
  lineHover: "var(--cms-line-hover)",
  text: "var(--cms-text)",
  placeholder: "var(--cms-placeholder)",
  emphasis: "var(--cms-emphasis)",
  ink: "var(--cms-ink)",
  errorText: "var(--cms-error-text)",
  errorBorder: "var(--cms-error-border)",
  successText: "var(--cms-success-text)",
  successBorder: "var(--cms-success-border)",
};
