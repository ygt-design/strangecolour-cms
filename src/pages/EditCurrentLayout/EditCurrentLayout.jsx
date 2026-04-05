import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  findChannelByTitle,
  fetchAllChannelContents,
  createTextBlock,
  updateBlock,
} from "../../arena";
import { GRID } from "../../grid";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, G } from "../../theme/cmsTokens";
import {
  parseLayoutConfig,
  serializeLayoutConfig,
  normalizeLegacyRows,
  clampPackedRow,
  rowToStarts,
  rowToLegacyShift,
  parsePattern,
} from "./layoutConfig";

// ─── Constants ───────────────────────────────────────────

const COLS = 12;
const ALIGN_OPTIONS = ["start", "center", "end"];
const ALIGN_LABELS = { start: "Top", center: "Middle", end: "Bottom" };

const DEFAULT_ROWS = [
  { offset: 4, spans: [4], align: "end" },
  { offset: 2, spans: [4, 4], align: "end" },
  { offset: 1, spans: [4, 4], align: "end" },
  { offset: 4, spans: [4], align: "end" },
  { offset: 2, spans: [4, 4], align: "end" },
  { offset: 2, spans: [4, 4], align: "end" },
  { offset: 1, spans: [4, 4], align: "end" },
  { offset: 5, spans: [4], align: "end" },
  { offset: 2, spans: [4, 4], align: "end" },
  { offset: 1, spans: [4, 4], align: "end" },
  { offset: 2, spans: [4, 4], align: "end" },
];

// ─── Styled components ──────────────────────────────────

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
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

const Heading = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: 700;
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

// ── Row card ──

const RowCard = styled.div`
  border: 1px solid ${G.borderLight};
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.5rem;
  transition: border-color 0.15s;

  &:hover { border-color: ${G.border}; }
`;

const RowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-family: ${FONT_STACK};
  font-size: 0.7rem;
  color: ${G.text};
`;

const RowIndex = styled.span`
  font-weight: ${FW_MEDIUM};
  min-width: 1.6rem;
`;

const SegmentGroup = styled.div`
  display: inline-flex;
  border: 1px solid ${G.border};
  border-radius: 4px;
  overflow: hidden;
`;

const SegmentBtn = styled.button`
  background: ${(p) => (p.$active ? G.ink : "transparent")};
  color: ${(p) => (p.$active ? G.bg : G.text)};
  border: none;
  padding: 0.15rem 0.45rem;
  font-family: ${FONT_STACK};
  font-size: 0.6rem;
  font-weight: ${FW_MEDIUM};
  cursor: pointer;
  transition: background 0.1s, color 0.1s;

  &:hover:not([disabled]) {
    background: ${(p) => (p.$active ? G.ink : G.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 1px;
    z-index: 1;
  }

  & + & { border-left: 1px solid ${G.border}; }
`;

const RemoveBtn = styled.button`
  background: ${G.surface};
  border: 1px solid ${G.border};
  border-radius: 4px;
  font-family: ${FONT_STACK};
  font-size: 0.65rem;
  font-weight: ${FW_MEDIUM};
  color: ${G.ink};
  cursor: pointer;
  padding: 0.2rem 0.45rem;
  line-height: 1;
  margin-left: auto;
  transition: background 0.1s, border-color 0.1s, color 0.1s;

  &:hover {
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
    color: ${G.ink};
  }
  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 2px;
  }
`;

const AddBlockBtn = styled.button`
  background: none;
  border: 1px solid ${G.border};
  border-radius: 3px;
  padding: 0.1rem 0.35rem;
  font-family: ${FONT_STACK};
  font-size: 0.6rem;
  font-weight: ${FW_MEDIUM};
  color: ${G.text};
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;

  &:hover:not([disabled]) {
    background: ${G.surfaceHover};
    border-color: ${G.lineHover};
  }
  &[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
    border-style: dashed;
  }
  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 2px;
  }
`;

// ── Grid preview ──

const GridRow = styled.div`
  display: grid;
  grid-template-columns: repeat(${COLS}, 1fr);
  gap: 3px;
  height: 72px;
  position: relative;
  align-items: ${(p) => p.$align ?? "end"};
`;

const ColSlot = styled.div`
  background: ${G.borderLight};
  border-radius: 3px;
  grid-row: 1;
  height: 100%;
`;

const Block = styled.div`
  grid-row: 1;
  grid-column: ${(p) => `${p.$start + 1} / span ${p.$span}`};
  background: var(--color-brand-green);
  border-radius: 4px;
  cursor: grab;
  position: relative;
  height: ${(p) => p.$height ?? "100%"};
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const BlockLabel = styled.span`
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${FONT_STACK};
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: #0a0a0a;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 4px;
  padding: 3px 7px;
  pointer-events: none;
  white-space: nowrap;
`;

const BlockRemove = styled.button`
  position: absolute;
  top: 3px;
  aspect-ratio: 1 / 1;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 2px;
  font-size: 0.55rem;
  line-height: 1;
  padding: 1px 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  z-index: 4;

  ${Block}:hover & {
    opacity: 1;
    pointer-events: auto;
  }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
    outline: 2px solid #fff;
    outline-offset: 1px;
  }
`;

const ResizeHandle = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 25px;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: ew-resize;
  z-index: 3;
  ${(p) => (p.$edge === "left" ? "left: -6px;" : "right: -6px;")}

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 22px;
    border-radius: 1px;
    background: #fff;
  }

  &:hover::before,
  &:focus-visible::before {
    background: #f0f0f0;
    border-color: rgba(0, 0, 0, 0.5);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 0, 0, 0.45);
    outline-offset: 2px;
  }
`;

// ── Bottom bar ──

const BottomBar = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1.5rem;
`;

const SmallBtn = styled.button`
  background: none;
  border: 1px solid ${G.border};
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
  font-family: ${FONT_STACK};
  font-size: 0.75rem;
  font-weight: ${FW_LIGHT};
  color: ${G.ink};
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
  &:hover { background: ${G.surfaceHover}; border-color: ${G.lineHover}; }
  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 2px;
  }
`;

const SaveBtn = styled.button`
  border: none;
  border-radius: 0;
  background: ${G.ink};
  color: ${G.bg};
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  cursor: pointer;
  transition: opacity 0.15s;
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  pointer-events: ${(p) => (p.$disabled ? "none" : "auto")};
  &:hover { opacity: 0.85; }
  &:focus-visible {
    outline: 3px solid ${G.bg};
    outline-offset: 2px;
    opacity: 1;
  }
`;

const Msg = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  padding: 0.75rem 0;
  font-size: 0.9rem;
  line-height: 1.45;
  border-bottom: 1px solid ${(p) => (p.$kind === "error" ? G.errorBorder : G.successBorder)};
  color: ${(p) => (p.$kind === "error" ? G.errorText : G.successText)};
`;

const Note = styled.p`
  font-family: ${FONT_STACK};
  font-size: 0.75rem;
  color: ${G.text};
  margin-top: 1rem;
  margin-bottom: 0;
`;

// ─── DraggableRow ────────────────────────────────────────

function DraggableRow({ index, row, onChange, onRemove, canRemove }) {
  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const starts = rowToStarts(row);
  const totalSpan = row.spans.reduce((a, b) => a + b, 0);

  function handleBlockDrag(blockIdx, e) {
    e.preventDefault();
    const rect = gridRef.current.getBoundingClientRect();
    const colW = rect.width / COLS;
    const snap = row;
    const origOffset = snap.offset;
    let appliedOffset = origOffset;

    const onMove = (ev) => {
      const dx = ev.clientX - e.clientX;
      const colDelta = Math.round(dx / colW);
      const next = origOffset + colDelta;
      if (next !== appliedOffset) {
        appliedOffset = next;
        onChange(index, clampPackedRow({ ...snap, offset: next }));
      }
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    dragRef.current = true;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleEdgeDrag(blockIdx, edge, e) {
    e.preventDefault();
    e.stopPropagation();
    const rect = gridRef.current.getBoundingClientRect();
    const colW = rect.width / COLS;
    const snap = { offset: row.offset, spans: [...row.spans] };
    let applied = 0;

    const onMove = (ev) => {
      const dx = ev.clientX - e.clientX;
      const colDelta = Math.round(dx / colW);
      if (colDelta === applied) return;
      applied = colDelta;

      const newSpans = [...snap.spans];
      let newOffset = snap.offset;

      if (edge === "left") {
        if (blockIdx === 0) {
          // First block left edge: adjust offset and span[0]
          const maxShrink = snap.spans[0] - 1;
          const maxGrow = snap.offset;
          const delta = Math.max(-maxGrow, Math.min(maxShrink, colDelta));
          newOffset = snap.offset + delta;
          newSpans[0] = snap.spans[0] - delta;
        } else {
          // Interior left edge: shared boundary between blockIdx-1 and blockIdx
          const maxShrink = snap.spans[blockIdx - 1] - 1;
          const maxGrow = snap.spans[blockIdx] - 1;
          const delta = Math.max(-maxShrink, Math.min(maxGrow, colDelta));
          newSpans[blockIdx - 1] = snap.spans[blockIdx - 1] + delta;
          newSpans[blockIdx] = snap.spans[blockIdx] - delta;
        }
      } else {
        // Right edge
        if (blockIdx < snap.spans.length - 1) {
          // Interior right edge: shared boundary between blockIdx and blockIdx+1
          const maxGrow = snap.spans[blockIdx + 1] - 1;
          const maxShrink = snap.spans[blockIdx] - 1;
          const delta = Math.max(-maxShrink, Math.min(maxGrow, colDelta));
          newSpans[blockIdx] = snap.spans[blockIdx] + delta;
          newSpans[blockIdx + 1] = snap.spans[blockIdx + 1] - delta;
        } else {
          // Last block right edge: grow/shrink into free space
          const free = COLS - snap.offset - snap.spans.reduce((a, b) => a + b, 0);
          const maxGrow = free;
          const maxShrink = snap.spans[blockIdx] - 1;
          const delta = Math.max(-maxShrink, Math.min(maxGrow, colDelta));
          newSpans[blockIdx] = snap.spans[blockIdx] + delta;
        }
      }

      onChange(index, clampPackedRow({ offset: newOffset, spans: newSpans, align: row.align }));
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    dragRef.current = true;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleAddBlock() {
    const free = COLS - row.offset - totalSpan;
    if (free >= 1) {
      onChange(index, clampPackedRow({
        ...row,
        spans: [...row.spans, Math.min(free, 4)],
      }));
    } else {
      // Steal from the widest block
      const widestIdx = row.spans.indexOf(Math.max(...row.spans));
      if (row.spans[widestIdx] <= 1) return;
      const newSpans = [...row.spans];
      newSpans[widestIdx] -= 1;
      newSpans.push(1);
      onChange(index, clampPackedRow({ ...row, spans: newSpans }));
    }
  }

  function handleRemoveBlock(blockIdx) {
    if (row.spans.length <= 1) return;
    const newSpans = row.spans.filter((_, i) => i !== blockIdx);
    onChange(index, clampPackedRow({ ...row, spans: newSpans }));
  }

  function handleAlignChange(align) {
    onChange(index, { ...row, align });
  }

  const heightMap = {
    start: (_, total) => total === 1 ? "65%" : "55%",
    center: () => "100%",
    end: (i, total) => total === 1 ? "65%" : (i === 0 ? "55%" : "100%"),
  };

  return (
    <RowCard>
      <RowHeader>
        <RowIndex>Row {index + 1}</RowIndex>
        <SegmentGroup>
          {ALIGN_OPTIONS.map((a) => (
            <SegmentBtn
              key={a}
              type="button"
              $active={row.align === a}
              onClick={() => handleAlignChange(a)}
            >
              {ALIGN_LABELS[a]}
            </SegmentBtn>
          ))}
        </SegmentGroup>
        <AddBlockBtn
          type="button"
          onClick={handleAddBlock}
          disabled={row.spans.length >= COLS}
        >
          + Block
        </AddBlockBtn>
        {canRemove && (
          <RemoveBtn type="button" onClick={() => onRemove(index)} title="Remove row">
            Remove
          </RemoveBtn>
        )}
      </RowHeader>

      <GridRow ref={gridRef} $align={row.align}>
        {Array.from({ length: COLS }, (_, c) => (
          <ColSlot key={c} />
        ))}
        {row.spans.map((span, bi) => {
          const start = starts[bi];
          const fn = heightMap[row.align] ?? heightMap.end;
          const height = fn(bi, row.spans.length);
          return (
            <Block
              key={bi}
              $start={start}
              $span={span}
              $height={height}
              title="Drag to slide this row horizontally along the grid"
              onMouseDown={(e) => handleBlockDrag(bi, e)}
            >
              <ResizeHandle
                type="button"
                $edge="left"
                aria-label={
                  bi === 0
                    ? "Resize: move row start or shrink first block"
                    : "Resize: adjust column boundary on the left"
                }
                onMouseDown={(e) => handleEdgeDrag(bi, "left", e)}
              />
              <ResizeHandle
                type="button"
                $edge="right"
                aria-label={
                  bi === row.spans.length - 1
                    ? "Resize: adjust width of last block"
                    : "Resize: adjust column boundary on the right"
                }
                onMouseDown={(e) => handleEdgeDrag(bi, "right", e)}
              />
              <BlockLabel>{span} col</BlockLabel>
              {row.spans.length > 1 && (
                <BlockRemove
                  type="button"
                  aria-label={`Remove block ${bi + 1} from this row`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBlock(bi);
                  }}
                >
                  ×
                </BlockRemove>
              )}
            </Block>
          );
        })}
      </GridRow>
    </RowCard>
  );
}

// ─── Main component ──────────────────────────────────────

export default function EditCurrentLayout() {
  const [channelId, setChannelId] = useState(null);
  const [rowBlockId, setRowBlockId] = useState(null);
  const [shiftBlockId, setShiftBlockId] = useState(null);
  const [layoutBlockId, setLayoutBlockId] = useState(null);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // ── Load ──

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const channel = await findChannelByTitle("Page / Current");
      if (!channel || cancelled) return;
      setChannelId(channel.id);

      const contents = await fetchAllChannelContents(channel.id);

      const findBlock = (title) =>
        contents.find((b) => b.title?.toLowerCase() === title.toLowerCase()) ?? null;
      const getBlockText = (b) =>
        (b?.content?.plain ?? b?.content ?? "").toString().trim();

      const layoutBlock = findBlock("Current Grid Layout");
      const rowBlock = findBlock("Row Pattern");
      const shiftBlock = findBlock("Shift Pattern");

      if (layoutBlock) setLayoutBlockId(layoutBlock.id);
      if (rowBlock) setRowBlockId(rowBlock.id);
      if (shiftBlock) setShiftBlockId(shiftBlock.id);

      let loadedRows = null;

      if (layoutBlock) {
        const config = parseLayoutConfig(getBlockText(layoutBlock));
        if (config) loadedRows = config.rows;
      }

      if (!loadedRows) {
        let rowArr = DEFAULT_ROWS.map((r) => r.spans.length);
        let shiftArr = DEFAULT_ROWS.map((r) => rowToLegacyShift(r));

        if (rowBlock) {
          const parsed = parsePattern(getBlockText(rowBlock));
          if (parsed) rowArr = parsed;
        }
        if (shiftBlock) {
          const parsed = parsePattern(getBlockText(shiftBlock));
          if (parsed) shiftArr = parsed;
        }
        loadedRows = normalizeLegacyRows(rowArr, shiftArr);
      }

      if (!cancelled) {
        setRows(loadedRows);
        setLoading(false);
      }
    }

    load().catch((err) => {
      console.error("EditCurrentLayout: load failed", err);
      if (!cancelled) {
        setMessage({ kind: "error", text: "Failed to load." });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Handlers ──

  const handleRowChange = useCallback((i, updated) => {
    setRows((prev) => prev.map((r, j) => (j === i ? updated : r)));
  }, []);

  const handleRemove = useCallback((i) => {
    setRows((prev) => prev.filter((_, j) => j !== i));
  }, []);

  const handleAdd = useCallback(() => {
    setRows((prev) => [...prev, { offset: 2, spans: [4, 4], align: "end" }]);
  }, []);

  const handleSave = useCallback(async () => {
    setMessage(null);
    setSaving(true);

    try {
      const jsonStr = serializeLayoutConfig(rows);
      if (layoutBlockId) {
        await updateBlock(layoutBlockId, { content: jsonStr });
      } else if (channelId) {
        const block = await createTextBlock(channelId, {
          title: "Current Grid Layout",
          content: jsonStr,
        });
        setLayoutBlockId(block.id);
      }

      // Legacy backwards compatibility
      const rowStr = rows.map((r) => r.spans.length).join(", ");
      const shiftStr = rows.map((r) => rowToLegacyShift(r)).join(", ");

      if (rowBlockId) {
        await updateBlock(rowBlockId, { content: rowStr });
      } else if (channelId) {
        const block = await createTextBlock(channelId, { title: "Row Pattern", content: rowStr });
        setRowBlockId(block.id);
      }

      if (shiftBlockId) {
        await updateBlock(shiftBlockId, { content: shiftStr });
      } else if (channelId) {
        const block = await createTextBlock(channelId, { title: "Shift Pattern", content: shiftStr });
        setShiftBlockId(block.id);
      }

      setMessage({ kind: "success", text: "Saved." });
    } catch (err) {
      console.error("EditCurrentLayout: save failed", err);
      setMessage({ kind: "error", text: err?.message ?? "Save failed." });
    } finally {
      setSaving(false);
    }
  }, [rows, layoutBlockId, rowBlockId, shiftBlockId, channelId]);

  if (loading) return <Page>Loading…</Page>;

  return (
    <Page>
      <HeaderWrap>
        <Heading>Grid Layout</Heading>
        <Intro>
          Drag blocks to slide the whole group. Drag the edges between blocks to
          resize column widths. Use "+ Block" to add more blocks per row, or hover
          and click × to remove one. The alignment control sets how images align
          vertically (top, middle, or bottom edges). This pattern repeats for all
          images on the page.
        </Intro>
      </HeaderWrap>

      {rows.map((row, i) => (
        <DraggableRow
          key={i}
          index={i}
          row={row}
          onChange={handleRowChange}
          onRemove={handleRemove}
          canRemove={rows.length > 1}
        />
      ))}

      <Note>
        {rows.length} row{rows.length !== 1 ? "s" : ""} in pattern — repeats from
        the beginning when the page has more images.
      </Note>

      <BottomBar>
        <SmallBtn type="button" onClick={handleAdd}>+ Add row</SmallBtn>
        <SaveBtn type="button" onClick={handleSave} $disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </SaveBtn>
      </BottomBar>

      {message && (
        <div style={{ marginTop: "0.75rem" }}>
          <Msg $kind={message.kind}>{message.text}</Msg>
        </div>
      )}
    </Page>
  );
}
