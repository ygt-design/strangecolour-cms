import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  getGroupChannels,
  buildAreNaChannelWebUrl,
  getArenaToken,
  setArenaToken,
  clearArenaToken,
  invalidateCache,
} from "../../arena";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, FW_BOLD, G } from "../../theme/cmsTokens";
import { GRID } from "../../grid";

// ─── Layout ─────────────────────────────────────────────

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const Heading = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: ${FW_BOLD};
  font-style: normal;
  text-transform: uppercase;
  font-size: clamp(3rem, 3.5vw, 4rem);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  max-width: 50%;
  line-height: 1.1;

  @media ${GRID.MEDIA_MOBILE} {
    max-width: 100%;
  }
`;

const Intro = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  margin-bottom: 2.5rem;
  font-size: 0.92rem;
  color: ${G.text};
  line-height: 1.5;
  max-width: 70%;

  @media ${GRID.MEDIA_MOBILE} {
    max-width: 100%;
  }
`;

// ─── Stats row ──────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid ${G.border};
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 2.5rem;

  @media ${GRID.MEDIA_MOBILE} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  padding: 1.15rem 1rem;
  background: ${G.surface};
`;

const StatValue = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_BOLD};
  font-size: 1.75rem;
  color: ${G.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 0.3rem;
`;

const StatLabel = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${G.text};
`;

// ─── Section ────────────────────────────────────────────

const SectionHeading = styled.h2`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${G.emphasis};
  margin: 0 0 0.75rem 0;
`;

// ─── Activity list ──────────────────────────────────────

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${G.border};
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 2.5rem;
`;

const ActivityRow = styled.a`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${G.surface};
  text-decoration: none;
  transition: background 0.12s;

  &:not(:last-child) {
    border-bottom: 1px solid ${G.border};
  }

  &:hover {
    background: ${G.surfaceHover};
  }
`;

const ActivityTitle = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.88rem;
  color: ${G.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActivityMeta = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};
  white-space: nowrap;
`;

const ActivityPrefix = styled.span`
  font-weight: ${FW_MEDIUM};
  color: ${G.emphasis};
  margin-right: 0.35rem;
`;

const EmptyState = styled.div`
  padding: 1.25rem 1rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.85rem;
  color: ${G.text};
  background: ${G.surface};
  border: 1px solid ${G.border};
  border-radius: 6px;
  margin-bottom: 2.5rem;
`;

// ─── Quick links ────────────────────────────────────────

const QuickLinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

const QuickLink = styled.a`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
  }
`;

const QuickLinkLabel = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.88rem;
  color: ${G.ink};
`;

const QuickLinkDesc = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};
`;

// ─── Token management ────────────────────────────────────

const TokenCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem 1rem;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  margin-bottom: 2.5rem;
`;

const TokenRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const TokenMasked = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.88rem;
  color: ${G.ink};
  letter-spacing: 0.04em;
`;

const TokenInput = styled.input`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.85rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid ${G.border};
  border-radius: 5px;
  background: ${G.bg};
  color: ${G.ink};
  outline: none;
  flex: 1;
  min-width: 180px;

  &::placeholder {
    color: ${G.placeholder};
  }

  &:focus {
    border-color: ${G.lineHover};
  }
`;

const TokenBtn = styled.button`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.45rem 0.75rem;
  border: 1px solid ${G.border};
  border-radius: 4px;
  background: transparent;
  color: ${G.ink};
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;

  &:hover {
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
  }
`;

const TokenBtnDanger = styled(TokenBtn)`
  color: var(--cms-error-text);
  border-color: var(--cms-error-border);

  &:hover {
    background: var(--cms-error-border);
  }
`;

// ─── Helpers ────────────────────────────────────────────

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function channelPrefix(title) {
  const t = String(title ?? "").trim();
  if (t.startsWith("Page /")) return "Page";
  if (t.startsWith("//")) return "//";
  if (t.startsWith("\u2192")) return "\u2192";
  if (t.startsWith("\u2193")) return "\u2193";
  return null;
}

function channelDisplayName(title) {
  const t = String(title ?? "").trim();
  const idx = t.indexOf("/");
  if (t.startsWith("//")) return t.slice(2).trim();
  if (idx !== -1 && (t.startsWith("Page") || t.startsWith("\u2192") || t.startsWith("\u2193"))) {
    return t.slice(idx + 1).trim();
  }
  return t;
}

// ─── Component ──────────────────────────────────────────

function maskToken(token) {
  if (!token) return "";
  if (token.length <= 6) return "\u2022".repeat(token.length);
  return "\u2022".repeat(token.length - 4) + token.slice(-4);
}

export default function Dashboard() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    getGroupChannels()
      .then((list) => {
        if (!cancelled) setChannels(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const current = channels.filter((ch) => String(ch.title ?? "").startsWith("//"));
    const projects = channels.filter((ch) => String(ch.title ?? "").startsWith("\u2192"));
    return {
      total: channels.length,
      current: current.length,
      projects: projects.length,
    };
  }, [channels]);

  const recentChannels = useMemo(() => {
    return [...channels]
      .sort((a, b) => {
        const da = new Date(a.updated_at ?? a.created_at ?? 0);
        const db = new Date(b.updated_at ?? b.created_at ?? 0);
        return db - da;
      })
      .slice(0, 8);
  }, [channels]);

  const groupSlug = import.meta.env.VITE_GROUP_SLUG ?? "\u2014";

  return (
    <Page>
      <Heading>Dashboard</Heading>
      <Intro>
        Manage content for the Strange Colour site. Use the sidebar to navigate
        between page editors or browse existing Are.na channels.
      </Intro>

      <StatsGrid>
        <StatCard>
          <StatValue>{loading ? "\u2014" : stats.total}</StatValue>
          <StatLabel>Total channels</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{loading ? "\u2014" : stats.current}</StatValue>
          <StatLabel>Current entries</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{loading ? "\u2014" : stats.projects}</StatValue>
          <StatLabel>Projects</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: "var(--color-brand-green)", fontSize: "0.92rem", fontWeight: FW_MEDIUM }}>
            {loading ? "\u2014" : "Connected"}
          </StatValue>
          <StatLabel>Are.na ({groupSlug})</StatLabel>
        </StatCard>
      </StatsGrid>

      <SectionHeading>Quick actions</SectionHeading>
      <QuickLinksGrid>
        <QuickLink as="a" href="/current/new">
          <QuickLinkLabel>Submit current entry</QuickLinkLabel>
          <QuickLinkDesc>Add a new item to the Current page</QuickLinkDesc>
        </QuickLink>
        <QuickLink as="a" href="/project/new">
          <QuickLinkLabel>Submit project</QuickLinkLabel>
          <QuickLinkDesc>Add to Past and Project List</QuickLinkDesc>
        </QuickLink>
        {groupSlug !== "\u2014" && (
          <QuickLink
            href={`https://www.are.na/${encodeURIComponent(groupSlug)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <QuickLinkLabel>Open Are.na &#8599;</QuickLinkLabel>
            <QuickLinkDesc>View group on Are.na</QuickLinkDesc>
          </QuickLink>
        )}
      </QuickLinksGrid>

      <SectionHeading>Recent activity</SectionHeading>
      {loading ? (
        <EmptyState>Loading channels…</EmptyState>
      ) : recentChannels.length === 0 ? (
        <EmptyState>No channels found.</EmptyState>
      ) : (
        <ActivityList>
          {recentChannels.map((ch) => {
            const url = buildAreNaChannelWebUrl(ch);
            const prefix = channelPrefix(ch.title);
            const display = channelDisplayName(ch.title);
            const time = formatRelativeTime(ch.updated_at ?? ch.created_at);
            return (
              <ActivityRow
                key={ch.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ActivityTitle>
                  {prefix && <ActivityPrefix>{prefix}</ActivityPrefix>}
                  {display}
                </ActivityTitle>
                <ActivityMeta>{time}</ActivityMeta>
              </ActivityRow>
            );
          })}
        </ActivityList>
      )}

      <SectionHeading>API Token</SectionHeading>
      <TokenCard>
        {editing ? (
          <TokenRow>
            <TokenInput
              type="password"
              placeholder="Paste new Are.na API token"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraft("");
                }
              }}
            />
            <TokenBtn
              onClick={() => {
                const trimmed = draft.trim();
                if (!trimmed) return;
                setArenaToken(trimmed);
                invalidateCache();
                setEditing(false);
                setDraft("");
                window.location.reload();
              }}
              disabled={!draft.trim()}
            >
              Save
            </TokenBtn>
            <TokenBtn onClick={() => { setEditing(false); setDraft(""); }}>
              Cancel
            </TokenBtn>
          </TokenRow>
        ) : (
          <TokenRow>
            <TokenMasked>{maskToken(getArenaToken())}</TokenMasked>
            <TokenBtn onClick={() => setEditing(true)}>Update</TokenBtn>
            <TokenBtnDanger
              onClick={() => {
                clearArenaToken();
                invalidateCache();
                window.location.reload();
              }}
            >
              Clear &amp; sign out
            </TokenBtnDanger>
          </TokenRow>
        )}
      </TokenCard>
    </Page>
  );
}
