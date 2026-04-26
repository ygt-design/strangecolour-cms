import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { buildAreNaChannelWebUrl, createProjectChannel } from "../../arena";
import { GRID } from "../../grid";
import { FONT_STACK, FW_LIGHT, FW_MEDIUM, G } from "../../theme/cmsTokens";

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const Card = styled.div`
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0 0 2.1rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};

  @media ${GRID.MEDIA_MOBILE} {
    padding: 0 0 1.25rem 0;
  }
`;

const Heading = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: 700;
  font-style: normal;
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
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};

  @media ${GRID.MEDIA_TABLET} {
    grid-template-columns: 1fr;
  }
`;

const FormFields = styled.div`
  grid-column: 1 / 6;
  display: grid;
  gap: 1.25rem;

  @media ${GRID.MEDIA_TABLET} {
    grid-column: 1 / -1;
  }
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

const RequiredMark = styled.span.attrs({
  title: "This section is required, please.",
})`
  color: var(--color-brand-green);
  margin-left: 0.25em;
  font-weight: ${FW_MEDIUM};
  cursor: help;
`;

const Input = styled.input`
  border: none;
  border-bottom: 1px solid ${G.line};
  border-radius: 0;
  padding: 0.72rem 0 0.65rem 0;
  font-size: 1rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  width: 100%;
  color: ${G.ink};
  background: transparent;
  transition: border-color 0.15s;

  &::placeholder {
    color: ${G.placeholder};
  }

  &:focus {
    outline: none;
    border-bottom-color: ${G.ink};
    box-shadow: none;
  }
`;

const Hint = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};
`;

const PreviewLabel = styled.span`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.75rem;
  color: ${G.text};

  strong {
    color: ${G.emphasis};
    font-weight: ${FW_LIGHT};
  }
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

  ${(props) =>
    props.$isDragging &&
    css`
      border-color: ${G.ink};
      border-style: solid;
      background: transparent;
    `}

  ${(props) =>
    props.$hasFile &&
    css`
      border-style: solid;
      border-color: ${G.line};
      background: transparent;
    `}

  &:focus-visible {
    outline: none;
    border-color: ${G.ink};
    border-style: solid;
    box-shadow: none;
  }

  &:hover {
    border-color: ${G.lineHover};
  }
`;

const DropLabel = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.85rem;
  color: ${G.text};
  line-height: 1.5;

  strong {
    font-weight: ${FW_LIGHT};
  }
`;

const DropAccent = styled.span`
  color: ${G.ink};
  font-weight: ${FW_LIGHT};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const SinglePreview = styled.div`
  margin-top: 0.75rem;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid ${G.line};
  max-width: 240px;
  position: relative;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const PreviewGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const PreviewThumb = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid ${G.line};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
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

  &:hover {
    background: ${G.surfaceHover};
  }
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
  opacity: ${(props) => (props.$disabled ? 0.45 : 1)};
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};

  &:hover {
    opacity: 0.85;
  }
`;

const Message = styled.div`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  border-radius: 0;
  padding: 0.75rem 0;
  font-size: 0.9rem;
  line-height: 1.45;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${(props) => (props.$kind === "error" ? G.errorBorder : G.successBorder)};
  color: ${(props) => (props.$kind === "error" ? G.errorText : G.successText)};
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
  color: #000000;
  margin: 0;
`;

const ChannelLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.7rem 1.15rem;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.9rem;
  line-height: 1.2;
  color: #000000;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 0;
  text-decoration: none;
  transition: background 0.15s, opacity 0.15s;

  &:hover {
    background: #f5f5f5;
  }
`;

function isImage(file) {
  return typeof file?.type === "string" && file.type.startsWith("image/");
}

function validate({
  name,
  thumbnailFile,
  imageFiles,
  client,
  size,
  scope,
  architect,
  year,
}) {
  if (!name.trim()) return "Project name is required.";
  if (!thumbnailFile) return "Project thumbnail is required.";
  if (!isImage(thumbnailFile)) return "Thumbnail must be an image file.";
  if (imageFiles.some((f) => !isImage(f)))
    return "All extra images must be image files.";
  if (!client.trim()) return "Client is required.";
  if (!size.trim()) return "Size is required.";
  if (!scope.trim()) return "Scope is required.";
  if (!architect.trim()) return "Architect is required.";
  if (!year.trim()) return "Year is required.";
  return null;
}

function useObjectUrl(file) {
  const objectUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  return objectUrl;
}

function useObjectUrls(files) {
  const objectUrls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  useEffect(
    () => () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [objectUrls],
  );

  return objectUrls;
}

function uniqueFileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
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

  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const reset = useCallback(() => {
    counter.current = 0;
    setIsDragging(false);
  }, []);

  return { isDragging, onDragEnter, onDragLeave, onDragOver, reset };
}

function extractImageFiles(dataTransfer) {
  return Array.from(dataTransfer.files).filter(isImage);
}

export default function CreateProjectChannel() {
  const [name, setName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [client, setClient] = useState("");
  const [size, setSize] = useState("");
  const [scope, setScope] = useState("");
  const [architect, setArchitect] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [successChannelUrl, setSuccessChannelUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const thumbnailInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const thumbnailDrag = useDragState();
  const imagesDrag = useDragState();
  const thumbnailPreviewUrl = useObjectUrl(thumbnailFile);
  const imagePreviewUrls = useObjectUrls(imageFiles);

  const previewTitle = useMemo(() => {
    const cleaned = name.trim().replace(/^→\s*/, "");
    return cleaned ? `→ ${cleaned}` : "";
  }, [name]);

  const handleThumbnailChange = useCallback((event) => {
    const next = Array.from(event.target.files ?? []).find(isImage) ?? null;
    setThumbnailFile(next);
    event.target.value = "";
  }, []);

  const appendImages = useCallback((nextFiles) => {
    const cleaned = nextFiles.filter(isImage);
    if (!cleaned.length) return;
    setImageFiles((prev) => {
      const seen = new Set(prev.map(uniqueFileKey));
      const merged = [...prev];
      cleaned.forEach((file) => {
        const key = uniqueFileKey(file);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(file);
      });
      return merged;
    });
  }, []);

  const handleImagesChange = useCallback(
    (event) => {
      appendImages(Array.from(event.target.files ?? []));
      event.target.value = "";
    },
    [appendImages],
  );

  function handleThumbnailDrop(e) {
    e.preventDefault();
    thumbnailDrag.reset();
    const files = extractImageFiles(e.dataTransfer);
    if (files.length > 0) setThumbnailFile(files[0]);
  }

  function handleThumbnailPaste(e) {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      setThumbnailFile(files[0]);
    }
  }

  function handleImagesDrop(e) {
    e.preventDefault();
    imagesDrag.reset();
    appendImages(extractImageFiles(e.dataTransfer));
  }

  function removeImage(index) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearThumbnail() {
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ kind: "", text: "" });
    setSuccessChannelUrl(null);

    const error = validate({
      name,
      thumbnailFile,
      imageFiles,
      client,
      size,
      scope,
      architect,
      year,
    });
    if (error) {
      setStatus({ kind: "error", text: error });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProjectChannel({
        name,
        thumbnailFile,
        imageFiles,
        client,
        size,
        scope,
        architect,
        year,
      });

      setStatus({
        kind: "success",
        text: `"${result.normalizedTitle}" has been submitted — added to Page / Past and Page / Project List.`,
      });
      setSuccessChannelUrl(buildAreNaChannelWebUrl(result.channel));
      setName("");
      setThumbnailFile(null);
      setImageFiles([]);
      setClient("");
      setSize("");
      setScope("");
      setArchitect("");
      setYear("");
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      if (imagesInputRef.current) imagesInputRef.current.value = "";
    } catch (err) {
      setSuccessChannelUrl(null);
      setStatus({
        kind: "error",
        text:
          err?.message ??
          "Something went wrong. Some steps may have completed -- check Are.na before retrying.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <Card>
        <HeaderWrap>
          <Heading>Submit a New Project</Heading>
          <Intro>
            Fill out the details below to publish a new project. A channel
            titled <strong>→ ...</strong> will be created with all the
            relevant blocks and connected to both{" "}
            <strong>Page / Past</strong> and <strong>Page / Project List</strong>.
          </Intro>
        </HeaderWrap>

        <FormLayout onSubmit={handleSubmit}>
          <FormFields>
          <FieldWrap>
            <Label htmlFor="proj-name">
              Project Name
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-name"
              name="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Riverside studio"'
              required
            />
            {previewTitle && (
              <PreviewLabel>
                Channel title on Are.na: <strong>{previewTitle}</strong>
              </PreviewLabel>
            )}
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-thumbnail-file">
              Thumbnail
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <HiddenInput
              id="proj-thumbnail-file"
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            <DropZone
              $isDragging={thumbnailDrag.isDragging}
              $hasFile={!!thumbnailFile}
              onDragEnter={thumbnailDrag.onDragEnter}
              onDragLeave={thumbnailDrag.onDragLeave}
              onDragOver={thumbnailDrag.onDragOver}
              onDrop={handleThumbnailDrop}
              onPaste={handleThumbnailPaste}
              tabIndex={0}
            >
              {thumbnailFile ? (
                <DropLabel>
                  <strong>{thumbnailFile.name}</strong> —{" "}
                  <DropAccent as="label" htmlFor="proj-thumbnail-file">replace</DropAccent>
                  {" "}or paste to replace
                </DropLabel>
              ) : (
                <DropLabel>
                  Drag, <DropAccent as="label" htmlFor="proj-thumbnail-file">browse</DropAccent>,
                  or paste a thumbnail image
                </DropLabel>
              )}
            </DropZone>
            <Hint>
              The thumbnail is shown as the primary image on Past and as the
              hover preview on Project List.
            </Hint>

            {thumbnailPreviewUrl && (
              <SinglePreview>
                <img src={thumbnailPreviewUrl} alt="Project thumbnail preview" />
                <RemoveButton
                  type="button"
                  onClick={clearThumbnail}
                  title="Remove thumbnail"
                >
                  &times;
                </RemoveButton>
              </SinglePreview>
            )}
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-gallery-images">Additional Images</Label>
            <HiddenInput
              id="proj-gallery-images"
              ref={imagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
            />
            <DropZone
              as="label"
              htmlFor="proj-gallery-images"
              $isDragging={imagesDrag.isDragging}
              $hasFile={imageFiles.length > 0}
              onDragEnter={imagesDrag.onDragEnter}
              onDragLeave={imagesDrag.onDragLeave}
              onDragOver={imagesDrag.onDragOver}
              onDrop={handleImagesDrop}
            >
              <DropLabel>
                {imageFiles.length > 0 ? (
                  `${imageFiles.length} extra image${imageFiles.length === 1 ? "" : "s"} for this project — click or drop to add more`
                ) : (
                  <>
                    Optional gallery images for this project. Drag here or{" "}
                    <DropAccent>browse</DropAccent>
                  </>
                )}
              </DropLabel>
            </DropZone>
            <Hint>
              Optional. Extra images appear after the thumbnail when the project
              is shown on Past.
            </Hint>

            {imagePreviewUrls.length > 0 && (
              <PreviewGrid>
                {imagePreviewUrls.map((url, i) => (
                  <PreviewThumb key={`${imageFiles[i]?.name}-${i}`}>
                    <img src={url} alt={`Project image ${i + 1}`} />
                    <RemoveButton
                      type="button"
                      onClick={() => removeImage(i)}
                      title="Remove image"
                    >
                      &times;
                    </RemoveButton>
                  </PreviewThumb>
                ))}
              </PreviewGrid>
            )}
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-client">
              Client
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-client"
              name="proj-client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder='e.g. "Brooklyn, NY"'
              required
            />
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-size">
              Size
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-size"
              name="proj-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder='e.g. "2,400 sq ft"'
              required
            />
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-scope">
              Scope
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-scope"
              name="proj-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder='e.g. "Interior renovation"'
              required
            />
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-architect">
              Architect
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-architect"
              name="proj-architect"
              value={architect}
              onChange={(e) => setArchitect(e.target.value)}
              placeholder='e.g. "Strange Colour"'
              required
            />
          </FieldWrap>

          <FieldWrap>
            <Label htmlFor="proj-year">
              Year
              <RequiredMark aria-hidden="true">*</RequiredMark>
            </Label>
            <Input
              id="proj-year"
              name="proj-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder='e.g. "2024"'
              required
            />
            <Hint>
              Each field is saved as a separate block; the site reads them by
              block title.
            </Hint>
          </FieldWrap>
          </FormFields>

          <SidePanel>
            <SidePanelCard>
              <SidePanelLabel>Publish</SidePanelLabel>
              <SubmitButton type="submit" $disabled={isSubmitting} style={{ width: "100%" }}>
                {isSubmitting ? "Submitting..." : "Submit project"}
              </SubmitButton>
            </SidePanelCard>

            {status.text && status.kind === "success" ? (
              <SuccessBanner>
                <SuccessBannerText>{status.text}</SuccessBannerText>
                {successChannelUrl ? (
                  <ChannelLinkButton
                    href={successChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open channel on Are.na
                  </ChannelLinkButton>
                ) : null}
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
