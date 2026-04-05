import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import {
  findChannelByTitle,
  fetchAllChannelContents,
  deleteConnection,
  deleteChannel,
  connectChannelToChannels,
  buildAreNaChannelWebUrl,
} from "../../arena";
import { GRID } from "../../grid";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, FW_BOLD, G } from "../../theme/cmsTokens";

// ─── Layout ─────────────────────────────────────────────

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const Card = styled.div`
  padding: 0 0 2.1rem 0;
  @media ${GRID.MEDIA_MOBILE} { padding: 0 0 1.25rem 0; }
`;

const Heading = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: ${FW_BOLD};
  text-transform: uppercase;
  font-size: clamp(3rem, 3.5vw, 4rem);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const Intro = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  margin-bottom: 2rem;
  font-size: 0.92rem;
  color: ${G.text};
  line-height: 1.5;
`;

const HeaderWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: ${GRID.GAP}px;
  & > * { grid-column: 1 / 6; }
  @media ${GRID.MEDIA_TABLET} {
    grid-template-columns: 1fr;
    & > * { grid-column: 1 / -1; }
  }
`;

const FormLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: ${GRID.GAP}px;
  align-items: start;
  @media ${GRID.MEDIA_TABLET} { grid-template-columns: 1fr; }
`;

const ListColumn = styled.div`
  grid-column: 1 / 6;
  display: flex;
  flex-direction: column;
  gap: 0;
  @media ${GRID.MEDIA_TABLET} { grid-column: 1 / -1; }
`;

const SidePanel = styled.div`
  grid-column: 7 / 9;
  position: sticky;
  top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  @media ${GRID.MEDIA_TABLET} { grid-column: 1 / -1; position: static; }
`;

const SidePanelCard = styled.div`
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SidePanelLabel = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${G.emphasis};
`;

const Hint = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 0;
  background: ${G.ink};
  color: ${G.bg};
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  width: 100%;
  cursor: pointer;
  transition: opacity 0.15s;
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  pointer-events: ${(p) => (p.$disabled ? "none" : "auto")};
  &:hover { opacity: 0.85; }
`;

const SecondaryButton = styled.button`
  border: 1px solid ${G.border};
  border-radius: 0;
  background: transparent;
  color: ${G.ink};
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  width: 100%;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: ${G.surfaceHover}; border-color: ${G.lineHover}; }
  &:disabled { opacity: 0.4; pointer-events: none; }
`;

const DangerButton = styled(SecondaryButton)`
  color: ${G.errorText};
  border-color: ${G.errorBorder};
  &:hover { background: ${G.errorBorder}; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SuccessBanner = styled.div`
  padding: 0.75rem 1rem;
  background: var(--color-brand-green);
  border-radius: 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.88rem;
  color: #000000;
`;

const ErrorMessage = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  padding: 0.75rem 0;
  font-size: 0.9rem;
  line-height: 1.45;
  border-bottom: 1px solid ${G.errorBorder};
  color: ${G.errorText};
`;

const LoadingState = styled.div`
  padding: 2rem 0;
  font-size: 0.92rem;
  color: ${G.text};
`;

// ─── List item ──────────────────────────────────────────

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0;
  border: 1px solid ${G.border};
  border-radius: 6px;
  background: ${G.surface};
  margin-bottom: -1px;
  overflow: hidden;
  transition: background 0.15s;

  &:first-child { border-radius: 6px 6px 0 0; }
  &:last-child { border-radius: 0 0 6px 6px; margin-bottom: 0; }
  &:only-child { border-radius: 6px; }
`;

const ItemCheckbox = styled.input.attrs({ type: "checkbox" })`
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  margin: 0 0.65rem;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid ${G.border};
  border-radius: 0;
  background: ${G.surface};
  transition: background 0.12s, border-color 0.12s;

  &:checked {
    background: var(--color-brand-green);
    border-color: var(--color-brand-green);
    background-image: none;
    color: transparent;
  }

  &:focus-visible {
    outline: 2px solid var(--color-brand-green);
    outline-offset: 2px;
  }
`;

const ItemThumb = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 42px;
  border-radius: 4px;
  overflow: hidden;
  background: ${G.bg};
  border: 1px solid ${G.borderLight};
  margin: 0.6rem 0 0.6rem 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ItemThumbEmpty = styled(ItemThumb)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: ${G.placeholder};
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.75rem;
`;

const ItemTitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
`;

const ItemTitle = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 0.92rem;
  color: ${G.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.7rem;
  color: ${G.text};
`;

const MetaDot = styled.span`
  color: ${G.borderLight};
`;

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.75rem;
  flex-shrink: 0;
`;

const TogglePill = styled.button`
  background: ${(p) => (p.$active ? "var(--color-brand-green)" : "transparent")};
  border: 1px solid ${(p) => (p.$active ? "transparent" : G.border)};
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  font-size: 0.7rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  color: ${(p) => (p.$active ? "#000000" : G.text)};
  white-space: nowrap;
  transition: all 0.15s;
  line-height: 1.2;

  &:hover {
    ${(p) =>
      p.$active
        ? css`opacity: 0.85;`
        : css`
            color: ${G.ink};
            background: ${G.surfaceHover};
            border-color: ${G.lineHover};
          `}
  }
`;

const ActionPill = styled.button`
  background: transparent;
  border: 1px solid ${G.border};
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  font-size: 0.7rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  color: ${G.text};
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.12s, background 0.12s, border-color 0.12s;
  line-height: 1.2;

  &:hover {
    color: ${G.ink};
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
  }
`;

const ActionPillDanger = styled(ActionPill)`
  &:hover {
    color: ${G.errorText};
    background: ${G.errorBorder};
    border-color: ${G.errorBorder};
  }
`;

const ActionPillLink = styled.a`
  background: transparent;
  border: 1px solid ${G.border};
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  font-size: 0.7rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  color: ${G.text};
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.12s, background 0.12s, border-color 0.12s;
  line-height: 1.2;

  &:hover {
    color: ${G.ink};
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
  }
`;

// ─── Helpers ────────────────────────────────────────────

function parseDisplayName(title) {
  const t = String(title ?? "").trim();
  if (t.startsWith("\u2192")) return t.slice(1).trim();
  return t;
}

function getImageUrl(block) {
  const img = block?.image;
  return img?.small?.src ?? img?.src ?? img?.thumb?.url ?? null;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Component ──────────────────────────────────────────

export default function ManageProjects() {
  const [items, setItems] = useState([]);
  const [pastChannelId, setPastChannelId] = useState(null);
  const [projectListChannelId, setProjectListChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const originalRef = useRef({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [pastCh, plCh] = await Promise.all([
        findChannelByTitle("Page / Past"),
        findChannelByTitle("Page / Project List"),
      ]);

      if (!pastCh || !plCh) {
        if (!cancelled) setStatus({ kind: "error", text: "Could not find parent channels." });
        setLoading(false);
        return;
      }

      const [pastContents, plContents] = await Promise.all([
        fetchAllChannelContents(pastCh.slug),
        fetchAllChannelContents(plCh.slug),
      ]);

      const pastMap = {};
      for (const item of pastContents) {
        if (item.type === "Channel" && item.title?.startsWith("\u2192")) {
          pastMap[item.id] = item.connection?.id;
        }
      }

      const plMap = {};
      for (const item of plContents) {
        if (item.type === "Channel" && item.title?.startsWith("\u2192")) {
          plMap[item.id] = item.connection?.id;
        }
      }

      const allIds = new Set([...Object.keys(pastMap), ...Object.keys(plMap)]);
      const allChannels = [...pastContents, ...plContents]
        .filter((item) => item.type === "Channel" && item.title?.startsWith("\u2192"));

      const channelById = {};
      for (const ch of allChannels) {
        channelById[ch.id] = ch;
      }

      const detailed = await Promise.all(
        [...allIds].map(async (id) => {
          const ch = channelById[id];
          if (!ch) return null;

          let thumbnail = null;
          try {
            const contents = await fetchAllChannelContents(ch.slug ?? String(ch.id));
            const imgBlock = contents.find((b) => b.title?.toLowerCase() === "image")
              ?? contents.find((b) => b.image);
            thumbnail = getImageUrl(imgBlock);
          } catch { /* ok */ }

          return {
            id: Number(id),
            slug: ch.slug,
            title: ch.title,
            thumbnail,
            updatedAt: ch.updated_at ?? ch.created_at,
            inPast: Boolean(pastMap[id]),
            inProjectList: Boolean(plMap[id]),
            pastConnectionId: pastMap[id] ?? null,
            plConnectionId: plMap[id] ?? null,
          };
        }),
      );

      const filtered = detailed.filter(Boolean).sort((a, b) =>
        parseDisplayName(a.title).localeCompare(parseDisplayName(b.title)),
      );

      if (!cancelled) {
        setPastChannelId(pastCh.id);
        setProjectListChannelId(plCh.id);
        setItems(filtered);
        const orig = {};
        for (const item of filtered) {
          orig[item.id] = { inPast: item.inPast, inProjectList: item.inProjectList };
        }
        originalRef.current = orig;
        setLoading(false);
      }
    }

    load().catch((err) => {
      if (!cancelled) {
        setStatus({ kind: "error", text: err?.message ?? "Failed to load." });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Visibility toggles ──

  function togglePast(id) {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, inPast: !item.inPast } : item,
    ));
  }

  function toggleProjectList(id) {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, inProjectList: !item.inProjectList } : item,
    ));
  }

  const hasChanges = items.some((item) => {
    const orig = originalRef.current[item.id];
    return orig && (orig.inPast !== item.inPast || orig.inProjectList !== item.inProjectList);
  });

  // ── Selection ──

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(items.map((i) => i.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  // ── Save visibility ──

  async function handleSave() {
    setStatus({ kind: "", text: "" });
    setIsSubmitting(true);

    let changeCount = 0;

    try {
      for (const item of items) {
        const orig = originalRef.current[item.id];
        if (!orig) continue;

        if (orig.inPast && !item.inPast && item.pastConnectionId) {
          await deleteConnection(item.pastConnectionId);
          changeCount++;
        } else if (!orig.inPast && item.inPast) {
          await connectChannelToChannels(item.id, [pastChannelId]);
          changeCount++;
        }

        if (orig.inProjectList && !item.inProjectList && item.plConnectionId) {
          await deleteConnection(item.plConnectionId);
          changeCount++;
        } else if (!orig.inProjectList && item.inProjectList) {
          await connectChannelToChannels(item.id, [projectListChannelId]);
          changeCount++;
        }
      }

      // Refetch fresh connection IDs
      const [pastContents, plContents] = await Promise.all([
        fetchAllChannelContents((await findChannelByTitle("Page / Past")).slug),
        fetchAllChannelContents((await findChannelByTitle("Page / Project List")).slug),
      ]);

      const pastMap = {};
      for (const item of pastContents) {
        if (item.type === "Channel") pastMap[item.id] = item.connection?.id;
      }
      const plMap = {};
      for (const item of plContents) {
        if (item.type === "Channel") plMap[item.id] = item.connection?.id;
      }

      setItems((prev) => prev.map((item) => ({
        ...item,
        pastConnectionId: pastMap[item.id] ?? null,
        plConnectionId: plMap[item.id] ?? null,
      })));

      const newOrig = {};
      for (const item of items) {
        newOrig[item.id] = { inPast: item.inPast, inProjectList: item.inProjectList };
      }
      originalRef.current = newOrig;

      setStatus({
        kind: "success",
        text: `${changeCount} change${changeCount === 1 ? "" : "s"} saved.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err?.message ?? "Failed to save. Some changes may have applied — reload and check.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete single ──

  async function deleteSingle(item) {
    const name = parseDisplayName(item.title);
    const confirmed = window.confirm(
      `Permanently delete "${name}"? This removes the channel and all its blocks from Are.na. This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatus({ kind: "", text: "" });

    try {
      await deleteChannel(item.slug ?? item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelected((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
      delete originalRef.current[item.id];
      setStatus({ kind: "success", text: `"${name}" deleted.` });
    } catch (err) {
      setStatus({ kind: "error", text: err?.message ?? "Failed to delete." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Bulk delete ──

  async function deleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Permanently delete ${selected.size} project${selected.size === 1 ? "" : "s"}? This removes the channels and all their blocks from Are.na. This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatus({ kind: "", text: "" });

    let deleted = 0;
    try {
      for (const id of selected) {
        const item = items.find((i) => i.id === id);
        if (item) {
          await deleteChannel(item.slug ?? item.id);
          deleted++;
        }
      }
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      for (const id of selected) {
        delete originalRef.current[id];
      }
      setSelected(new Set());
      setStatus({ kind: "success", text: `${deleted} project${deleted === 1 ? "" : "s"} deleted.` });
    } catch (err) {
      setStatus({ kind: "error", text: err?.message ?? "Some deletions failed. Reload to check." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <Page><Card>
        <Heading>Manage Projects</Heading>
        <LoadingState>Loading projects…</LoadingState>
      </Card></Page>
    );
  }

  return (
    <Page>
      <Card>
        <HeaderWrap>
          <Heading>Manage Projects</Heading>
          <Intro>
            Control which projects appear on the Past page, the Project List
            page, or both. Select projects to delete them permanently.
          </Intro>
        </HeaderWrap>

        <FormLayout>
          <ListColumn>
            {items.map((item) => {
              const arenaUrl = buildAreNaChannelWebUrl(item);
              const displayName = parseDisplayName(item.title);
              const bothHidden = !item.inPast && !item.inProjectList;

              return (
                <ItemRow key={item.id}>
                  <ItemCheckbox
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />

                  {item.thumbnail ? (
                    <ItemThumb>
                      <img src={item.thumbnail} alt="" />
                    </ItemThumb>
                  ) : (
                    <ItemThumbEmpty>No img</ItemThumbEmpty>
                  )}

                  <ItemContent>
                    <ItemTitleRow>
                      <ItemTitle>{displayName}</ItemTitle>
                    </ItemTitleRow>
                    <ItemMetaRow>
                      {item.updatedAt && (
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                      )}
                      {bothHidden && (
                        <>
                          <MetaDot>·</MetaDot>
                          <span style={{ color: G.errorText }}>Hidden from both</span>
                        </>
                      )}
                    </ItemMetaRow>
                  </ItemContent>

                  <ItemActions>
                    <TogglePill
                      type="button"
                      $active={item.inPast}
                      onClick={() => togglePast(item.id)}
                      title={item.inPast ? "Hide from Past" : "Show on Past"}
                    >
                      Past
                    </TogglePill>
                    <TogglePill
                      type="button"
                      $active={item.inProjectList}
                      onClick={() => toggleProjectList(item.id)}
                      title={item.inProjectList ? "Hide from Project List" : "Show on Project List"}
                    >
                      Project List
                    </TogglePill>
                    {arenaUrl && (
                      <ActionPillLink
                        href={arenaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Edit ↗
                      </ActionPillLink>
                    )}
                    <ActionPillDanger
                      type="button"
                      onClick={() => deleteSingle(item)}
                    >
                      Delete
                    </ActionPillDanger>
                  </ItemActions>
                </ItemRow>
              );
            })}
            {items.length === 0 && (
              <Hint>No → project channels found.</Hint>
            )}
          </ListColumn>

          <SidePanel>
            <SidePanelCard>
              <SidePanelLabel>Save visibility</SidePanelLabel>
              <PrimaryButton
                type="button"
                $disabled={isSubmitting || !hasChanges}
                onClick={handleSave}
              >
                {isSubmitting ? "Saving…" : hasChanges ? "Save changes" : "No changes"}
              </PrimaryButton>
              <Hint>
                Connects or disconnects projects from Page / Past and
                Page / Project List. Changes go live immediately.
              </Hint>
            </SidePanelCard>

            <SidePanelCard>
              <SidePanelLabel>Selection</SidePanelLabel>
              <ButtonRow>
                <SecondaryButton type="button" onClick={allSelected ? selectNone : selectAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </SecondaryButton>
              </ButtonRow>
              {someSelected && (
                <DangerButton type="button" disabled={isSubmitting} onClick={deleteSelected}>
                  Delete {selected.size} selected
                </DangerButton>
              )}
              <Hint>
                Deleting a project permanently removes the channel and all
                its blocks from Are.na. This cannot be undone.
              </Hint>
            </SidePanelCard>

            {status.kind === "success" && (
              <SuccessBanner>{status.text}</SuccessBanner>
            )}
            {status.kind === "error" && (
              <ErrorMessage>{status.text}</ErrorMessage>
            )}
          </SidePanel>
        </FormLayout>
      </Card>
    </Page>
  );
}
