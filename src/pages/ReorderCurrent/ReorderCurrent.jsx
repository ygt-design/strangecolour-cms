import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import {
  findChannelByTitle,
  getGroupChannels,
  fetchAllChannelContents,
  reorderChannelItems,
  deleteConnection,
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

// ─── Side panel pieces ──────────────────────────────────

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

// ─── Drag item ──────────────────────────────────────────

const DragItem = styled.div`
  display: grid;
  grid-template-columns: auto auto auto 1fr auto;
  align-items: center;
  gap: 0;
  border: 1px solid ${(p) => (p.$dragging ? "var(--color-brand-green)" : G.border)};
  border-radius: 6px;
  background: ${G.surface};
  margin-bottom: -1px;
  user-select: none;
  overflow: hidden;
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.22s ease,
              border-color 0.15s,
              opacity 0.15s;

  ${(p) => p.$dragging && css`
    opacity: 0.45;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 10;
    position: relative;
  `}

  ${(p) => p.$hidden && css`opacity: 0.35;`}

  &:first-child { border-radius: 6px 6px 0 0; }
  &:last-child { border-radius: 0 0 6px 6px; margin-bottom: 0; }
  &:only-child { border-radius: 6px; }
`;

const DragHandleZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  align-self: stretch;
  cursor: grab;
  color: ${G.text};
  font-size: 0.88rem;
  flex-shrink: 0;
  border-right: 1px solid ${G.border};
  transition: color 0.12s, background 0.12s;

  &:hover { color: ${G.ink}; background: ${G.surfaceHover}; }
  &:active { cursor: grabbing; }
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
  margin-right: 0.75rem;

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
  padding: 0.75rem 0;
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

const ItemSubtitle = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.78rem;
  color: ${G.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
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
  gap: 0.25rem;
  padding: 0 0.65rem;
  flex-shrink: 0;
`;

const ActionPill = styled.button`
  background: transparent;
  border: 1px solid ${G.border};
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  cursor: pointer;
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
  cursor: pointer;
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
  if (t.startsWith("//")) return t.slice(2).trim();
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

export default function ReorderCurrent() {
  const [items, setItems] = useState([]);
  const [channelId, setChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const removedIds = useRef(new Set());

  const dragIdx = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // ── Load entries + their details ──

  async function loadItems() {
    // Fetch "Page / Current" contents for ordering + connection IDs
    const pageChannel = await findChannelByTitle("Page / Current");
    const connMap = new Map();
    const pageSlash = [];
    const pageIds = new Set();
    if (pageChannel) {
      const pageContents = await fetchAllChannelContents(pageChannel.slug);
      for (const item of pageContents) {
        if (item.type === "Channel" && item.title?.startsWith("//")) {
          if (item.connection?.id) connMap.set(item.id, item.connection.id);
          pageSlash.push(item);
          pageIds.add(item.id);
        }
      }
    }

    // Fetch all // channels from the group so we don't miss any
    const allGroupChannels = await getGroupChannels();
    const unconnected = allGroupChannels.filter(
      (item) =>
        typeof item.title === "string" &&
        item.title.startsWith("//") &&
        !pageIds.has(item.id),
    );

    // Page order first, then unconnected appended at the end
    const slashChannels = [...pageSlash, ...unconnected];

    // Fetch details for each channel (thumbnail, subtitle, block count, updated_at)
    const detailed = await Promise.all(
      slashChannels.map(async (ch) => {
        let thumbnail = null;
        let subtitle = "";
        let blockCount = 0;

        try {
          const chContents = await fetchAllChannelContents(ch.slug ?? String(ch.id));
          blockCount = chContents.length;

          const thumbBlock = chContents.find((b) => b.title?.toLowerCase() === "thumbnail");
          thumbnail = getImageUrl(thumbBlock) ?? getImageUrl(chContents.find((b) => b.image));

          const subBlock = chContents.find((b) => b.title?.toLowerCase() === "subtitle");
          subtitle = subBlock?.content?.plain?.trim() ?? "";
        } catch {
          /* channel contents may fail — that's ok */
        }

        return {
          id: ch.id,
          slug: ch.slug,
          title: ch.title,
          connectionId: connMap.get(ch.id) ?? null,
          type: "Channel",
          thumbnail,
          subtitle,
          blockCount,
          updatedAt: ch.updated_at ?? ch.created_at,
          hidden: false,
        };
      }),
    );

    return detailed;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const channel = await findChannelByTitle("Page / Current");
      if (channel && !cancelled) {
        setChannelId(channel.id);
      }

      const detailed = await loadItems();
      const newestFirst = [...detailed].sort(
        (a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0),
      );

      if (!cancelled) {
        setItems(newestFirst);
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

  // ── Drag handlers (reflow items live on dragOver) ──

  const handleDragStart = useCallback((e, idx, id) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
    dragIdx.current = idx;
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;

    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragIdx.current = idx;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null;
    setDraggingId(null);
  }, []);

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

  // ── Visibility toggle ──

  function toggleHidden(id) {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, hidden: !item.hidden } : item,
    ));
  }

  // ── Bulk / quick actions ──

  function reverseOrder() {
    setItems((prev) => [...prev].reverse());
  }

  function sortAlphabetically() {
    setItems((prev) =>
      [...prev].sort((a, b) =>
        parseDisplayName(a.title).localeCompare(parseDisplayName(b.title)),
      ),
    );
  }

  function sortByNewest() {
    setItems((prev) =>
      [...prev].sort((a, b) =>
        new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0),
      ),
    );
  }

  function sortByOldest() {
    setItems((prev) =>
      [...prev].sort((a, b) =>
        new Date(a.updatedAt ?? 0) - new Date(b.updatedAt ?? 0),
      ),
    );
  }

  async function removeSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Remove ${selected.size} entr${selected.size === 1 ? "y" : "ies"} from Current? They won't be deleted from Are.na, just disconnected.`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatus({ kind: "", text: "" });

    try {
      for (const id of selected) {
        const item = items.find((i) => i.id === id);
        if (item?.connectionId) {
          await deleteConnection(item.connectionId);
        }
        removedIds.current.add(id);
      }
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      setStatus({ kind: "success", text: `${selected.size} entr${selected.size === 1 ? "y" : "ies"} removed from Current.` });
    } catch (err) {
      setStatus({ kind: "error", text: err?.message ?? "Failed to remove entries." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeSingle(item) {
    const confirmed = window.confirm(
      `Remove "${parseDisplayName(item.title)}" from Current? It won't be deleted from Are.na.`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatus({ kind: "", text: "" });
    try {
      if (item.connectionId) {
        await deleteConnection(item.connectionId);
      }
      removedIds.current.add(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelected((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
      setStatus({ kind: "success", text: `"${parseDisplayName(item.title)}" removed.` });
    } catch (err) {
      setStatus({ kind: "error", text: err?.message ?? "Failed to remove." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Save order ──

  async function handleSave() {
    setStatus({ kind: "", text: "" });

    if (!channelId) {
      setStatus({ kind: "error", text: "Cannot save — Page / Current channel not found. Reload and try again." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Only save visible (non-hidden) items
      const visible = items.filter((i) => !i.hidden);
      const hidden = items.filter((i) => i.hidden);

      // Disconnect hidden items that have a live connection
      for (const item of hidden) {
        if (item.connectionId) {
          await deleteConnection(item.connectionId);
        }
        removedIds.current.add(item.id);
      }

      // Reorder visible items
      if (visible.length > 0) {
        await reorderChannelItems(channelId, visible);
      }

      // Refetch, filtering out items that were explicitly removed this session
      const updated = await loadItems();
      setItems(updated.filter((i) => !removedIds.current.has(i.id)));
      setSelected(new Set());

      const removedCount = hidden.length;
      const msg = removedCount > 0
        ? `Order saved. ${removedCount} hidden entr${removedCount === 1 ? "y" : "ies"} removed.`
        : "Order saved. The Current page now reflects the new order.";
      setStatus({ kind: "success", text: msg });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err?.message ?? "Failed to save. Some connections may have changed — reload and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <Page><Card>
        <Heading>Reorder Current</Heading>
        <LoadingState>Loading entries…</LoadingState>
      </Card></Page>
    );
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;
  const hasHidden = items.some((i) => i.hidden);

  return (
    <Page>
      <Card>
        <HeaderWrap>
          <Heading>Reorder Current</Heading>
          <Intro>
            Drag entries to reorder, toggle visibility, or remove entries from the
            Current page.
          </Intro>
        </HeaderWrap>

        <FormLayout>
          <ListColumn>
            {items.map((item, idx) => {
              const arenaUrl = buildAreNaChannelWebUrl(item);
              const displayName = parseDisplayName(item.title);

              return (
                <DragItem
                  key={item.id}
                  draggable
                  $dragging={draggingId === item.id}
                  $hidden={item.hidden}
                  onDragStart={(e) => handleDragStart(e, idx, item.id)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <DragHandleZone>⠿</DragHandleZone>

                  <ItemCheckbox
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
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
                      {item.subtitle && (
                        <ItemSubtitle>
                          {item.subtitle.length > 50
                            ? item.subtitle.slice(0, 50) + "…"
                            : item.subtitle}
                        </ItemSubtitle>
                      )}
                    </ItemTitleRow>
                    <ItemMetaRow>
                      <span>{item.blockCount} block{item.blockCount === 1 ? "" : "s"}</span>
                      {item.updatedAt && (
                        <>
                          <MetaDot>·</MetaDot>
                          <span>{formatRelativeTime(item.updatedAt)}</span>
                        </>
                      )}
                      {item.hidden && (
                        <>
                          <MetaDot>·</MetaDot>
                          <span style={{ color: G.errorText }}>Hidden</span>
                        </>
                      )}
                    </ItemMetaRow>
                  </ItemContent>

                  <ItemActions>
                    <ActionPill
                      type="button"
                      onClick={() => toggleHidden(item.id)}
                    >
                      {item.hidden ? "Show" : "Hide"}
                    </ActionPill>
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
                      onClick={() => removeSingle(item)}
                    >
                      Remove
                    </ActionPillDanger>
                  </ItemActions>
                </DragItem>
              );
            })}
            {items.length === 0 && (
              <Hint>No // entries found in Page / Current.</Hint>
            )}
          </ListColumn>

          <SidePanel>
            <SidePanelCard>
              <SidePanelLabel>Save order</SidePanelLabel>
              <PrimaryButton
                type="button"
                $disabled={isSubmitting || items.length === 0}
                onClick={handleSave}
              >
                {isSubmitting ? "Saving…" : hasHidden ? "Save & remove hidden" : "Save order"}
              </PrimaryButton>
              <Hint>
                {hasHidden
                  ? "Hidden entries will be disconnected from Current on save."
                  : "Disconnects and reconnects entries to set the new order."}
              </Hint>
            </SidePanelCard>

            <SidePanelCard>
              <SidePanelLabel>Quick actions</SidePanelLabel>
              <ButtonRow>
                <SecondaryButton type="button" onClick={reverseOrder}>Reverse</SecondaryButton>
                <SecondaryButton type="button" onClick={sortAlphabetically}>A → Z</SecondaryButton>
              </ButtonRow>
              <ButtonRow>
                <SecondaryButton type="button" onClick={sortByNewest}>Newest</SecondaryButton>
                <SecondaryButton type="button" onClick={sortByOldest}>Oldest</SecondaryButton>
              </ButtonRow>
            </SidePanelCard>

            <SidePanelCard>
              <SidePanelLabel>Selection</SidePanelLabel>
              <ButtonRow>
                <SecondaryButton type="button" onClick={allSelected ? selectNone : selectAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </SecondaryButton>
              </ButtonRow>
              {someSelected && (
                <DangerButton type="button" disabled={isSubmitting} onClick={removeSelected}>
                  Remove {selected.size} selected
                </DangerButton>
              )}
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
