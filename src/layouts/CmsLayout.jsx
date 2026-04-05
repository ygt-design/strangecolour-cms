import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import styled from "styled-components";
import { getGroupChannels, getGroupSlug, buildAreNaChannelWebUrl } from "../arena";
import { Grid, GridCell, GRID } from "../grid";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, G } from "../theme/cmsTokens";
import LoadingOverlay from "../components/LoadingOverlay.jsx";

// ─── Dark-mode helper ───────────────────────────────────

const THEME_KEY = "cms-theme";

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) ?? "dark";
  } catch {
    return "light";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

// ─── Shell ───────────────────────────────────────────────

const Shell = styled.div`
  min-height: 100vh;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const LayoutGrid = styled(Grid)`
  align-items: start;
`;

// ─── Sidebar ─────────────────────────────────────────────

const SidebarInner = styled.nav`
  --grid-container-width: min(${GRID.MAX_WIDTH}px, 100vw);
  --grid-track-width: calc(
    (
      var(--grid-container-width) - ${GRID.PADDING * 2}px -
        ${GRID.GAP * (GRID.COLUMNS - 1)}px
    ) / ${GRID.COLUMNS}
  );
  --sidebar-width: calc(
    var(--grid-track-width) * 3 + ${GRID.GAP * (3 - 1)}px
  );

  position: fixed;
  top: 0;
  left: calc((100vw - var(--grid-container-width)) / 2 + ${GRID.PADDING}px);
  width: var(--sidebar-width);
  height: 100vh;
  overflow-y: auto;
  padding: 1.25rem 0 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  z-index: 2;

  @media ${GRID.MEDIA_TABLET} {
    position: static;
    width: auto;
    height: auto;
    padding: 1.25rem 0 1rem 0;
    border-bottom: 1px solid ${G.line};
    margin-bottom: 0.5rem;
  }
`;

const SidebarTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const SidebarBrandSquare = styled.span`
  flex-shrink: 0;
  width: 0.65rem;
  height: 0.65rem;
  background: var(--color-brand-green);
`;

const SidebarTitle = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${G.ink};
`;

const ThemeToggle = styled.button`
  background: none;
  border: 1px solid ${G.border};
  border-radius: 4px;
  padding: 0.25rem 0.4rem;
  cursor: pointer;
  font-size: 0.72rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  color: ${G.text};
  transition: border-color 0.15s, color 0.15s;
  line-height: 1;

  &:hover {
    color: ${G.ink};
    border-color: ${G.lineHover};
  }
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const SidebarSectionLabel = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${G.emphasis};
  margin-bottom: 0.15rem;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.45rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  font: inherit;
  text-align: left;
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s;
`;

const SidebarPrimaryLink = styled(NavLink)`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.94rem;
  color: ${G.ink};
  text-decoration: none;
  line-height: 1.35;
  transition: background 0.12s, border-color 0.12s, color 0.12s;

  &:hover {
    background: ${G.surfaceHover};
  }

  &.active {
    color: #000000;
    background: var(--color-brand-green);
    border-color: transparent;
  }

  &.active:hover {
    color: #000000;
    background: var(--color-brand-green);
    opacity: 0.9;
  }
`;

const sidebarLinkStyles = `
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.82rem;
  color: ${G.ink};
  text-decoration: none;
  padding: 0.25rem 0;
  transition: color 0.12s;
  line-height: 1.35;

  &:hover {
    color: ${G.emphasis};
  }
`;

const SidebarSubLink = styled(NavLink)`
  ${sidebarLinkStyles}
  display: block;
  width: 100%;
  font-size: 0.78rem;
  padding: 0.45rem 0.65rem;
  border-radius: 5px;
  border: 1px solid ${G.borderLight};
  background: ${G.bg};

  &.active {
    color: #000000;
    font-weight: ${FW_MEDIUM};
    border-color: transparent;
    background: var(--color-brand-green);
  }

  &.active:hover {
    color: #000000;
    background: var(--color-brand-green);
    opacity: 0.9;
  }

  &:hover {
    background: ${G.surfaceBright};
  }
`;

const SidebarExternalLink = styled.a`
  ${sidebarLinkStyles}
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  /* Room for long groups (e.g. → Project); scroll inside this box only */
  max-height: min(60vh, 32rem);
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: ${G.bg};
  border: 1px solid ${G.borderLight};
  border-radius: 6px;
  padding: 0.45rem;
`;

const ChannelLink = styled.a`
  display: block;
  flex-shrink: 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.78rem;
  color: ${G.ink};
  text-decoration: none;
  padding: 0.35rem 0.45rem;
  border-radius: 5px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.12s, background 0.12s;

  &:hover {
    background: ${G.surfaceBright};
  }
`;

const ChannelStatusText = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.72rem;
  color: ${G.text};
`;

const PageDropdownGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const PageDropdownContent = styled.div`
  padding-left: ${GRID.GAP}px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 0;

  &[hidden] {
    display: none;
  }
`;

const PageDropdownToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.45rem;
  margin: 0;
  padding: 0.5rem 0.65rem;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.12s;

  &:hover {
    background: ${G.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 2px;
  }
`;

const PageDropdownLabel = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.94rem;
  color: ${G.ink};
  line-height: 1.35;
`;

const PageDropdownChevron = styled.span`
  flex-shrink: 0;
  font-size: 0.9rem;
  line-height: 1;
  color: ${G.text};
`;

const ChannelGroupCount = styled.span`
  font-weight: ${FW_LIGHT};
  color: ${G.text};
  margin-left: 0.35rem;
`;

// ─── Main column ─────────────────────────────────────────

const MainContent = styled.div`
  min-height: 100vh;
  padding: 0;

  @media ${GRID.MEDIA_TABLET} {
    min-height: auto;
  }
`;

// ─── Component ───────────────────────────────────────────

const PAGE_FORM_LINKS = [
  {
    key: "current",
    label: "Current",
    subLinks: [
      { to: "/current/new", label: "Submit a new current entry" },
      { to: "/current/reorder", label: "Reorder entries" },
      { to: "/current/layout", label: "Grid layout" },
    ],
  },
  {
    key: "project",
    label: "Project",
    subLinks: [
      { to: "/project/new", label: "Submit a new project" },
      { to: "/project/manage", label: "Manage visibility" },
    ],
  },
  {
    key: "our-practice",
    label: "Our practice",
    subLinks: [
      { to: "/our-practice/edit", label: "Edit our practice page" },
    ],
  },
];

function sortChannelsByTitle(list) {
  return [...list].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

const CHANNEL_GROUP_ORDER = ["page", "slash", "arrow", "down", "other"];

const CHANNEL_GROUP_LABELS = {
  page: "Page",
  slash: "// Current",
  arrow: "\u2192 Project",
  down: "\u2193 Project list",
  other: "Other",
};

function channelGroupKeyForTitle(title) {
  const t = String(title ?? "").trim();
  if (t.startsWith("Page /")) return "page";
  if (t.startsWith("//")) return "slash";
  if (t.startsWith("\u2192")) return "arrow";
  if (t.startsWith("\u2193")) return "down";
  return "other";
}

function groupChannelsByConvention(sortedList) {
  const buckets = Object.fromEntries(CHANNEL_GROUP_ORDER.map((k) => [k, []]));
  for (const ch of sortedList) {
    const key = channelGroupKeyForTitle(ch.title);
    buckets[key].push(ch);
  }
  return CHANNEL_GROUP_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    label: CHANNEL_GROUP_LABELS[key],
    channels: buckets[key],
  }));
}

export default function CmsLayout() {
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState(null);
  const [pageDropdowns, setPageDropdowns] = useState({
    current: false,
    project: false,
    "our-practice": false,
  });
  const [channelGroupOpen, setChannelGroupOpen] = useState({});
  const [theme, setTheme] = useState(getStoredTheme);

  const sortedChannels = useMemo(() => sortChannelsByTitle(channels), [channels]);

  const channelGroups = useMemo(
    () => groupChannelsByConvention(sortedChannels),
    [sortedChannels],
  );

  const togglePageDropdown = (key) => {
    setPageDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChannelGroup = (key) => {
    setChannelGroupOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  // Apply stored theme on mount
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  const groupSlug = (() => {
    try {
      return getGroupSlug();
    } catch {
      return null;
    }
  })();

  const groupUrl = groupSlug
    ? `https://www.are.na/${encodeURIComponent(groupSlug)}`
    : null;

  useEffect(() => {
    let cancelled = false;

    getGroupChannels()
      .then((list) => {
        if (!cancelled) setChannels(list);
      })
      .catch((err) => {
        if (!cancelled) setChannelsError(err?.message ?? "Failed to load channels.");
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Shell>
      <LoadingOverlay isLoaded={!channelsLoading} />
      <LayoutGrid as="div">
        <GridCell $start={1} $span={3} $startTablet={1} $spanTablet={8} $spanMobile={4}>
          <SidebarInner aria-label="CMS navigation">
            <SidebarTitleRow>
              <SidebarBrand>
                <SidebarBrandSquare aria-hidden="true" />
                <SidebarTitle>Strange Colour CMS</SidebarTitle>
              </SidebarBrand>
              <ThemeToggle
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </ThemeToggle>
            </SidebarTitleRow>

            <SidebarPrimaryLink to="/" end>
              Dashboard
            </SidebarPrimaryLink>

            <SidebarSection>
              <SidebarSectionLabel>Pages</SidebarSectionLabel>
              {PAGE_FORM_LINKS.map((page) => {
                const isExpanded = Boolean(pageDropdowns[page.key]);
                const controlId = `cms-page-links-${page.key}`;
                const headingId = `cms-page-heading-${page.key}`;

                return (
                  <PageDropdownGroup key={page.key}>
                    <PageDropdownToggle
                      type="button"
                      id={headingId}
                      aria-expanded={isExpanded}
                      aria-controls={controlId}
                      onClick={() => togglePageDropdown(page.key)}
                    >
                      <PageDropdownLabel>{page.label}</PageDropdownLabel>
                      <PageDropdownChevron aria-hidden>
                        {isExpanded ? "\u2191" : "\u2193"}
                      </PageDropdownChevron>
                    </PageDropdownToggle>
                    <PageDropdownContent
                      id={controlId}
                      role="region"
                      aria-labelledby={headingId}
                      hidden={!isExpanded}
                    >
                      {page.subLinks.map((sub) => (
                        <SidebarSubLink key={sub.to} to={sub.to}>{sub.label}</SidebarSubLink>
                      ))}
                    </PageDropdownContent>
                  </PageDropdownGroup>
                );
              })}
            </SidebarSection>

            <SidebarSection>
              <SidebarSectionLabel>Are.na</SidebarSectionLabel>
              {groupUrl && (
                <SidebarExternalLink
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open group on Are.na &#8599;
                </SidebarExternalLink>
              )}
            </SidebarSection>

            <SidebarSection>
              <SidebarSectionLabel>Channels</SidebarSectionLabel>
              {channelsLoading && (
                <ChannelStatusText>Loading channels…</ChannelStatusText>
              )}
              {channelsError && (
                <ChannelStatusText style={{ color: G.errorText }}>
                  {channelsError}
                </ChannelStatusText>
              )}
              {!channelsLoading && !channelsError && channels.length === 0 && (
                <ChannelStatusText>No channels found.</ChannelStatusText>
              )}
              {!channelsLoading &&
                !channelsError &&
                channelGroups.map((group) => {
                  const isExpanded = Boolean(channelGroupOpen[group.key]);
                  const controlId = `cms-channel-group-${group.key}`;
                  const headingId = `cms-channel-heading-${group.key}`;

                  return (
                    <PageDropdownGroup key={group.key}>
                      <PageDropdownToggle
                        type="button"
                        id={headingId}
                        aria-expanded={isExpanded}
                        aria-controls={controlId}
                        onClick={() => toggleChannelGroup(group.key)}
                      >
                        <PageDropdownLabel>
                          {group.label}
                          <ChannelGroupCount>({group.channels.length})</ChannelGroupCount>
                        </PageDropdownLabel>
                        <PageDropdownChevron aria-hidden>
                          {isExpanded ? "\u2191" : "\u2193"}
                        </PageDropdownChevron>
                      </PageDropdownToggle>
                      <PageDropdownContent
                        id={controlId}
                        role="region"
                        aria-labelledby={headingId}
                        hidden={!isExpanded}
                      >
                        <ChannelList>
                          {group.channels.map((ch) => {
                            const url = buildAreNaChannelWebUrl(ch);
                            return (
                              <ChannelLink
                                key={ch.id}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={ch.title}
                              >
                                {ch.title}
                              </ChannelLink>
                            );
                          })}
                        </ChannelList>
                      </PageDropdownContent>
                    </PageDropdownGroup>
                  );
                })}
            </SidebarSection>
          </SidebarInner>
        </GridCell>

        <GridCell $start={5} $span={8} $startTablet={1} $spanTablet={8} $spanMobile={4}>
          <MainContent>
            <Outlet />
          </MainContent>
        </GridCell>
      </LayoutGrid>
    </Shell>
  );
}
