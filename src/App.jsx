import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import styled from "styled-components";
import GlobalStyle from "./styles.js";
import GridOverlay from "./components/GridOverlay.jsx";
import CmsLayout from "./layouts/CmsLayout.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import CreateSlashChannel from "./pages/CreateSlashChannel/CreateSlashChannel.jsx";
import CreateProjectChannel from "./pages/CreateProjectChannel/CreateProjectChannel.jsx";
import EditOurPractice from "./pages/EditOurPractice/EditOurPractice.jsx";
import ReorderCurrent from "./pages/ReorderCurrent/ReorderCurrent.jsx";
import EditCurrentLayout from "./pages/EditCurrentLayout/EditCurrentLayout.jsx";
import ManageProjects from "./pages/ManageProjects/ManageProjects.jsx";
import { getArenaToken, setArenaToken } from "./arena";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, FW_BOLD } from "./theme/cmsTokens";

// ─── Token Modal styled components ─────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cms-bg);
`;

const Card = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: min(420px, 90vw);
  padding: 2.5rem 2rem;
  background: var(--cms-surface);
  border: 1px solid var(--cms-border);
  border-radius: 8px;
`;

const Title = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: ${FW_BOLD};
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: var(--cms-ink);
  margin: 0;
`;

const Description = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.85rem;
  color: var(--cms-text);
  margin: 0;
  line-height: 1.5;
`;

const Input = styled.input`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.88rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--cms-border);
  border-radius: 5px;
  background: var(--cms-bg);
  color: var(--cms-ink);
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--cms-placeholder);
  }

  &:focus {
    border-color: var(--cms-line-hover);
  }
`;

const SubmitBtn = styled.button`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.7rem 1rem;
  border: 1px solid var(--cms-border);
  border-radius: 5px;
  background: var(--cms-ink);
  color: var(--cms-bg);
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`;

const ErrorMsg = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.78rem;
  color: var(--cms-error-text);
`;

// ─── Token Modal component ──────────────────────────────

function TokenModal({ onAuthenticated }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    setChecking(true);
    setError("");

    try {
      const res = await fetch("https://api.are.na/v3/me", {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (!res.ok) {
        setError("Invalid token — the Are.na API rejected it.");
        setChecking(false);
        return;
      }
    } catch {
      setError("Network error — could not reach Are.na.");
      setChecking(false);
      return;
    }

    setArenaToken(trimmed);
    onAuthenticated();
  };

  return (
    <Overlay>
      <Card onSubmit={handleSubmit}>
        <Title>Strange Colour CMS</Title>
        <Description>
          Enter the Are.na API token to access the content management system.
          The token will be saved in your browser.
        </Description>
        <Input
          type="password"
          placeholder="Are.na API token"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <SubmitBtn type="submit" disabled={!value.trim() || checking}>
          {checking ? "Verifying…" : "Continue"}
        </SubmitBtn>
      </Card>
    </Overlay>
  );
}

// ─── App ────────────────────────────────────────────────

function App() {
  const [hasToken, setHasToken] = useState(() => !!getArenaToken());

  return (
    <>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      {hasToken ? (
        <BrowserRouter>
          <Routes>
            <Route element={<CmsLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="current/new" element={<CreateSlashChannel />} />
              <Route path="current/reorder" element={<ReorderCurrent />} />
              <Route path="current/layout" element={<EditCurrentLayout />} />
              <Route path="project/manage" element={<ManageProjects />} />
              <Route
                path="project/new"
                element={<CreateProjectChannel />}
              />
              <Route
                path="our-practice/edit"
                element={<EditOurPractice />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      ) : (
        <TokenModal onAuthenticated={() => setHasToken(true)} />
      )}
    </>
  );
}

export default App;
