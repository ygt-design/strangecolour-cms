import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import {
  findChannelByTitle,
  fetchAllChannelContents,
  updateBlock,
  replaceImageBlock,
} from "../../arena";
import { GRID } from "../../grid";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, G } from "../../theme/cmsTokens";

// ─── Styled components ──────────────────────────────────

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const Card = styled.div`
  padding: 0 0 2.1rem 0;
  @media ${GRID.MEDIA_MOBILE} {
    padding: 0 0 1.25rem 0;
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

const FormLayout = styled.form`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: ${GRID.GAP}px;
  align-items: start;
  @media ${GRID.MEDIA_TABLET} {
    grid-template-columns: 1fr;
  }
`;

const FormFields = styled.div`
  grid-column: 1 / 6;
  display: grid;
  gap: 1.25rem;
  @media ${GRID.MEDIA_TABLET} { grid-column: 1 / -1; }
`;

const SidePanel = styled.div`
  grid-column: 7 / 9;
  position: sticky;
  top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  @media ${GRID.MEDIA_TABLET} {
    grid-column: 1 / -1;
    position: static;
  }
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

const FieldWrap = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-family: ${FONT_STACK};
  font-size: 0.8rem;
  font-weight: ${FW_MEDIUM};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${G.ink};
`;

const Hint = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};
`;

const EditorWrap = styled.div`
  border: 1px solid ${G.line};
  border-radius: 4px;
  background: ${G.bg};
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.35rem;
  border-bottom: 1px solid ${G.line};
  background: ${G.surface};
`;

const ToolBtn = styled.button`
  border: 1px solid ${G.border};
  background: transparent;
  color: ${G.ink};
  border-radius: 3px;
  font-family: ${FONT_STACK};
  font-size: 0.68rem;
  font-weight: ${FW_MEDIUM};
  min-width: 1.8rem;
  height: 1.7rem;
  padding: 0 0.45rem;
  cursor: pointer;
  &:hover { background: ${G.surfaceHover}; border-color: ${G.lineHover}; }
  &:focus-visible {
    outline: 2px solid ${G.ink};
    outline-offset: 1px;
  }
`;

const Editor = styled.div`
  min-height: 112px;
  padding: 0.72rem;
  color: ${G.ink};
  font-size: 1rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  line-height: 1.45;
  background: transparent;
  &:focus { outline: none; }

  &[data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: ${G.placeholder};
    pointer-events: none;
  }

  p { margin: 0 0 0.65em 0; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0.2em 0 0.7em 1.2em; }
  a { color: ${G.ink}; }
`;

const DropZone = styled.div`
  border: 1px dashed ${G.line};
  border-radius: 0;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
  background: transparent;
  user-select: none;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  ${(props) => props.$isDragging && css`
    border-color: ${G.ink};
    border-style: solid;
  `}
  ${(props) => props.$hasFile && css`
    border-style: solid;
    border-color: ${G.line};
  `}
  &:focus-visible { outline: none; border-color: ${G.ink}; border-style: solid; }
  &:hover { border-color: ${G.lineHover}; }
`;

const DropLabel = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.85rem;
  color: ${G.text};
  line-height: 1.5;
  strong { font-weight: ${FW_LIGHT}; }
`;

const DropAccent = styled.span`
  color: ${G.ink};
  font-weight: ${FW_LIGHT};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ImagePreview = styled.div`
  margin-top: 0.75rem;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid ${G.line};
  max-width: 320px;
  position: relative;
  img { width: 100%; height: auto; display: block; }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border-radius: 0;
  border: 1px solid ${G.line};
  background: ${G.surfaceBright};
  color: ${G.ink};
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  &:hover { background: ${G.surfaceHover}; }
`;

const SubmitButton = styled.button`
  border: none;
  border-radius: 0;
  background: ${G.ink};
  color: ${G.bg};
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_MEDIUM};
  width: fit-content;
  cursor: pointer;
  transition: opacity 0.15s;
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  pointer-events: ${(p) => (p.$disabled ? "none" : "auto")};
  &:hover { opacity: 0.85; }
`;

const Message = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  padding: 0.75rem 0;
  font-size: 0.9rem;
  line-height: 1.45;
  border-bottom: 1px solid ${(p) => (p.$kind === "error" ? G.errorBorder : G.successBorder)};
  color: ${(p) => (p.$kind === "error" ? G.errorText : G.successText)};
`;

const SuccessBanner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem 1.15rem;
  background: var(--color-brand-green);
  border: none;
  border-radius: 0;
`;

const SuccessBannerText = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.95rem;
  line-height: 1.45;
  color: #000;
  margin: 0;
`;

const LoadingState = styled.div`
  padding: 2rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.92rem;
  color: ${G.text};
`;

// ─── Helpers ────────────────────────────────────────────

function isImage(file) {
  return typeof file?.type === "string" && file.type.startsWith("image/");
}

function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function useDragState() {
  const [isDragging, setIsDragging] = useState(false);
  const counter = useRef(0);
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    counter.current += 1;
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => {
    counter.current -= 1;
    if (counter.current <= 0) {
      counter.current = 0;
      setIsDragging(false);
    }
  }, []);
  const onDragOver = useCallback((e) => { e.preventDefault(); }, []);
  const reset = useCallback(() => {
    counter.current = 0;
    setIsDragging(false);
  }, []);
  return { isDragging, onDragEnter, onDragLeave, onDragOver, reset };
}

function extractImageFiles(dt) {
  return Array.from(dt.files).filter(isImage);
}

function getImageUrl(block) {
  const img = block?.image;
  return img?.src ?? img?.display?.url ?? img?.original?.url ?? null;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainToHtml(text) {
  const value = String(text ?? "").replace(/\r\n?/g, "\n").trim();
  if (!value) return "";
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${paragraph.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");
}

function normalizeEditorHtml(html) {
  const value = String(html ?? "").replace(/\u00a0/g, " ").trim();
  if (!value) return "";
  const stripped = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
  return stripped ? value : "";
}

function readBlockHtml(block) {
  if (!block || block.type !== "Text") return "";
  const plain = (block.content?.plain ?? "").trim();
  if (!plain && block.content?.html) return normalizeEditorHtml(block.content.html);
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(plain);
  return normalizeEditorHtml(looksHtml ? plain : plainToHtml(plain));
}

function runEditorCommand(editorRef, command, value, onChange) {
  const editor = editorRef.current;
  if (!editor) return;
  editor.focus();
  document.execCommand(command, false, value);
  onChange(normalizeEditorHtml(editor.innerHTML));
}

// ─── Rich text editor ───────────────────────────────────

function RichTextField({ field, value, onChange }) {
  const editorRef = useRef(null);
  const inputId = `op-${field.key}`;

  useEffect(() => {
    const editor = editorRef.current;
    const normalized = normalizeEditorHtml(value);
    if (editor && normalizeEditorHtml(editor.innerHTML) !== normalized) {
      editor.innerHTML = normalized;
    }
  }, [value]);

  const commit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(normalizeEditorHtml(editor.innerHTML));
  }, [onChange]);

  function addLink() {
    const raw = window.prompt("Enter URL");
    const href = raw?.trim();
    if (!href) return;
    runEditorCommand(editorRef, "createLink", href, onChange);
  }

  return (
    <FieldWrap>
      <Label htmlFor={inputId}>{field.label}</Label>
      <EditorWrap>
        <Toolbar>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "bold", null, onChange)}>B</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "italic", null, onChange)}>I</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "underline", null, onChange)}>U</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "insertUnorderedList", null, onChange)}>UL</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "insertOrderedList", null, onChange)}>OL</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>Link</ToolBtn>
          <ToolBtn type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runEditorCommand(editorRef, "insertParagraph", null, onChange)}>P</ToolBtn>
        </Toolbar>
        <Editor
          id={inputId}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={field.placeholder}
          onInput={commit}
          onBlur={commit}
        />
      </EditorWrap>
    </FieldWrap>
  );
}

// ─── Image field sub-component ──────────────────────────

function ImageField({ label, id, currentUrl, file, onFileChange, onClear }) {
  const drag = useDragState();
  const inputRef = useRef(null);
  const previewUrl = useObjectUrl(file);
  const displayUrl = previewUrl ?? currentUrl;

  function handleChange(e) {
    const next = Array.from(e.target.files ?? []).find(isImage) ?? null;
    onFileChange(next);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    drag.reset();
    const files = extractImageFiles(e.dataTransfer);
    if (files.length > 0) onFileChange(files[0]);
  }

  function handlePaste(e) {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      onFileChange(files[0]);
    }
  }

  function handleClear() {
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <FieldWrap>
      <Label htmlFor={id}>{label}</Label>
      <HiddenInput id={id} ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
      <DropZone
        $isDragging={drag.isDragging}
        $hasFile={!!file}
        onDragEnter={drag.onDragEnter}
        onDragLeave={drag.onDragLeave}
        onDragOver={drag.onDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {file ? (
          <DropLabel>
            <strong>{file.name}</strong> - <DropAccent as="label" htmlFor={id}>replace</DropAccent> or paste to replace
          </DropLabel>
        ) : (
          <DropLabel>
            Drag, <DropAccent as="label" htmlFor={id}>browse</DropAccent>, or paste to replace current image
          </DropLabel>
        )}
      </DropZone>
      {displayUrl && (
        <ImagePreview>
          <img src={displayUrl} alt={label} />
          {file && (
            <RemoveButton type="button" onClick={handleClear} title="Revert to current">
              &times;
            </RemoveButton>
          )}
        </ImagePreview>
      )}
      {!file && currentUrl && <Hint>Showing current image from Are.na</Hint>}
    </FieldWrap>
  );
}

const TEXT_FIELDS = [
  { key: "Lead", label: "Lead", placeholder: "Short intro text" },
  { key: "Body", label: "Body", placeholder: "Main body text" },
  { key: "Scope", label: "Scope", placeholder: "Services list" },
  { key: "Contact", label: "Contact", placeholder: "Phone, email, address" },
  { key: "Collaborators", label: "Collaborators", placeholder: "List of collaborators" },
  {
    key: "Donations",
    label: "Donations",
    placeholder: "Right column: one paragraph or list item per initiative (same pattern as Collaborators)",
  },
];

// ─── Component ──────────────────────────────────────────

export default function EditOurPractice() {
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState(null);
  const [blocks, setBlocks] = useState({});
  const [htmls, setHtmls] = useState({});
  const [originalHtmls, setOriginalHtmls] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [bgImageFile, setBgImageFile] = useState(null);
  const [imageCurrentUrl, setImageCurrentUrl] = useState(null);
  const [bgImageCurrentUrl, setBgImageCurrentUrl] = useState(null);
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const channel = await findChannelByTitle("Page / Our Practice");
      if (!channel) {
        if (!cancelled) {
          setStatus({ kind: "error", text: "Could not find 'Page / Our Practice' channel." });
          setLoading(false);
        }
        return;
      }

      const contents = await fetchAllChannelContents(channel.slug);
      if (cancelled) return;

      setChannelId(channel.id);
      const blockMap = {};
      const htmlMap = {};

      for (const block of contents) {
        const title = block.title;
        if (!title) continue;
        blockMap[title] = block;
        if (block.type === "Text") {
          htmlMap[title] = readBlockHtml(block);
        }
      }

      setBlocks(blockMap);
      setHtmls(htmlMap);
      setOriginalHtmls(htmlMap);
      setImageCurrentUrl(getImageUrl(blockMap.Image));
      setBgImageCurrentUrl(getImageUrl(blockMap["bg-Image"]));
      setLoading(false);
    }

    load().catch((err) => {
      if (!cancelled) {
        setStatus({ kind: "error", text: err?.message ?? "Failed to load content." });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  function handleHtmlChange(key, value) {
    setHtmls((prev) => ({ ...prev, [key]: normalizeEditorHtml(value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ kind: "", text: "" });

    if (!channelId) {
      setStatus({ kind: "error", text: "Cannot save: missing Page / Our Practice channel id." });
      return;
    }

    setIsSubmitting(true);
    try {
      const changedHtml = {};

      for (const field of TEXT_FIELDS) {
        const block = blocks[field.key];
        if (!block) continue;
        const current = normalizeEditorHtml(htmls[field.key] ?? "");
        const original = normalizeEditorHtml(originalHtmls[field.key] ?? "");
        if (current !== original) {
          await updateBlock(block.id, { content: current });
          changedHtml[field.key] = current;
        }
      }

      if (imageFile) {
        if (!blocks.Image) throw new Error('Missing "Image" block in Page / Our Practice.');
        const newBlock = await replaceImageBlock(channelId, blocks.Image.id, imageFile, "Image");
        setBlocks((prev) => ({ ...prev, Image: newBlock }));
        setImageCurrentUrl(getImageUrl(newBlock));
        setImageFile(null);
      }

      if (bgImageFile) {
        if (!blocks["bg-Image"]) throw new Error('Missing "bg-Image" block in Page / Our Practice.');
        const newBlock = await replaceImageBlock(channelId, blocks["bg-Image"].id, bgImageFile, "bg-Image");
        setBlocks((prev) => ({ ...prev, "bg-Image": newBlock }));
        setBgImageCurrentUrl(getImageUrl(newBlock));
        setBgImageFile(null);
      }

      if (Object.keys(changedHtml).length > 0) {
        setOriginalHtmls((prev) => ({ ...prev, ...changedHtml }));
      }

      setStatus({ kind: "success", text: "Our Practice page has been updated." });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err?.message ?? "Something went wrong. Some changes may have saved - check Are.na.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Page>
        <Card>
          <Heading>Edit Our Practice</Heading>
          <LoadingState>Loading content from Are.na...</LoadingState>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <HeaderWrap>
          <Heading>Edit Our Practice</Heading>
          <Intro>
            Edit and format the content blocks for the Our Practice page. Changes are
            saved directly to the existing blocks on Are.na. Add a Text block on &quot;Page /
            Our Practice&quot; titled <strong>Donations</strong> for the initiatives list.
            If a field is empty here, that block is missing on Are.na — the site uses
            built-in fallback copy where applicable.
          </Intro>
        </HeaderWrap>

        <FormLayout onSubmit={handleSubmit}>
          <FormFields>
            {TEXT_FIELDS.map((field) => (
              <Fragment key={field.key}>
                {field.key === "Donations" && !blocks[field.key] && (
                  <Hint>
                    No Are.na Text block titled &quot;{field.key}&quot; on &quot;Page / Our Practice&quot;.
                    Add one with that exact title so saves apply here.
                  </Hint>
                )}
                <RichTextField
                  field={field}
                  value={htmls[field.key] ?? ""}
                  onChange={(value) => handleHtmlChange(field.key, value)}
                />
              </Fragment>
            ))}

            <ImageField
              label="Image"
              id="op-image"
              currentUrl={imageCurrentUrl}
              file={imageFile}
              onFileChange={setImageFile}
              onClear={() => setImageFile(null)}
            />

            <ImageField
              label="Background Image (GIF)"
              id="op-bg-image"
              currentUrl={bgImageCurrentUrl}
              file={bgImageFile}
              onFileChange={setBgImageFile}
              onClear={() => setBgImageFile(null)}
            />
          </FormFields>

          <SidePanel>
            <SidePanelCard>
              <SidePanelLabel>Publish</SidePanelLabel>
              <SubmitButton type="submit" $disabled={isSubmitting} style={{ width: "100%" }}>
                {isSubmitting ? "Saving..." : "Save & publish"}
              </SubmitButton>
              <Hint>Changes go live on the site immediately.</Hint>
            </SidePanelCard>

            {status.text && status.kind === "success" ? (
              <SuccessBanner>
                <SuccessBannerText>{status.text}</SuccessBannerText>
              </SuccessBanner>
            ) : status.text ? (
              <Message $kind={status.kind}>{status.text}</Message>
            ) : null}
          </SidePanel>
        </FormLayout>
      </Card>
    </Page>
  );
}
