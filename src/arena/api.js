import {
  deleteArena,
  fetchArena,
  getGroupSlug,
  postArena,
  putArena,
  putExternal,
  invalidateCache,
} from "./client.js";

// ─── Eager group channels cache ─────────────────────────
// Start fetching the group channel list at module load time
// (during JS parse) so it's ready before any component mounts.
let _groupChannelsPromise = null;

function warmGroupChannels(slug = getGroupSlug()) {
  if (!_groupChannelsPromise) {
    _groupChannelsPromise = fetchAllGroupContents(slug, { type: "Channel" });
  }
  return _groupChannelsPromise;
}

function bumpReadCache() {
  invalidateCache();
  _groupChannelsPromise = null;
}

// ─── Group ───────────────────────────────────────────────

export async function getGroup(slug = getGroupSlug()) {
  return fetchArena(`/groups/${encodeURIComponent(slug)}`);
}

export async function getGroupContents(
  slug = getGroupSlug(),
  { page = 1, per = 24, type, sort } = {},
) {
  return fetchArena(`/groups/${encodeURIComponent(slug)}/contents`, {
    params: { page, per, type, sort },
  });
}

export async function fetchAllGroupContents(
  slug = getGroupSlug(),
  { type, sort } = {},
) {
  let page = 1;
  const per = 100;
  let all = [];

  while (true) {
    const res = await getGroupContents(slug, { page, per, type, sort });
    all = all.concat(res.data);
    if (!res.meta.has_more_pages) break;
    page++;
  }

  return all;
}

export async function getGroupChannels(slug = getGroupSlug()) {
  return warmGroupChannels(slug);
}

// ─── Channel (scoped to group) ───────────────────────────

export async function getChannel(idOrSlug) {
  return fetchArena(`/channels/${encodeURIComponent(idOrSlug)}`);
}

export async function getChannelContents(
  idOrSlug,
  { page = 1, per = 24, sort } = {},
) {
  return fetchArena(`/channels/${encodeURIComponent(idOrSlug)}/contents`, {
    params: { page, per, sort },
  });
}

export async function fetchAllChannelContents(idOrSlug, { sort } = {}) {
  let page = 1;
  const per = 100;
  let all = [];

  while (true) {
    const res = await getChannelContents(idOrSlug, { page, per, sort });
    all = all.concat(res.data);
    if (!res.meta.has_more_pages) break;
    page++;
  }

  return all;
}

// ─── Block ───────────────────────────────────────────────

export async function getBlock(id) {
  return fetchArena(`/blocks/${encodeURIComponent(id)}`);
}

// ─── Finders (group-scoped) ──────────────────────────────
// All finders start from the group so we never accidentally
// reach outside the project's Are.na group.

export async function findChannelByTitle(title, groupSlug = getGroupSlug()) {
  const channels = await getGroupChannels(groupSlug);
  return channels.find((ch) => ch.title?.toLowerCase() === title.toLowerCase());
}

export async function findChannelsByTitle(title, groupSlug = getGroupSlug()) {
  const channels = await getGroupChannels(groupSlug);
  return channels.filter(
    (ch) => ch.title?.toLowerCase() === title.toLowerCase(),
  );
}

export async function findBlockByTitle(
  title,
  channelTitle,
  groupSlug = getGroupSlug(),
) {
  const channel = await findChannelByTitle(channelTitle, groupSlug);
  if (!channel) return null;
  const items = await fetchAllChannelContents(channel.slug);
  return items.find(
    (item) =>
      item.base_type === "Block" &&
      item.title?.toLowerCase() === title.toLowerCase(),
  );
}

/** Find a block by title within a channel (by slug or id). Use when you already have the channel. */
export async function findBlockByTitleInChannel(channelSlugOrId, blockTitle) {
  const items = await fetchAllChannelContents(channelSlugOrId);
  return items.find(
    (item) =>
      item.type !== "Channel" &&
      item.title?.toLowerCase() === blockTitle.toLowerCase(),
  );
}

export async function findBlocksByType(
  type,
  channelTitle,
  groupSlug = getGroupSlug(),
) {
  const channel = await findChannelByTitle(channelTitle, groupSlug);
  if (!channel) return [];
  const items = await fetchAllChannelContents(channel.slug);
  return items.filter((item) => item.type === type);
}

export async function getChannelContentsByTitle(
  channelTitle,
  groupSlug = getGroupSlug(),
) {
  const channel = await findChannelByTitle(channelTitle, groupSlug);
  if (!channel) return [];
  return fetchAllChannelContents(channel.slug);
}

// ─── Mutations (CMS write flow — Are.na v3 endpoints) ────

function normalizeSlashTitle(title) {
  const trimmed = String(title ?? "")
    .trim()
    .replace(/^\/+\s*/, "");
  if (!trimmed) {
    // Are.na needs a non-empty, unique channel title; CMS allows omitting a display title.
    return `// ${new Date().toISOString()}`;
  }
  return `// ${trimmed}`;
}

/**
 * POST /v3/channels
 * Creates a channel under the group (by numeric group_id).
 */
export async function createChannel(
  title,
  { groupSlug = getGroupSlug(), visibility = "closed" } = {},
) {
  const group = await getGroup(groupSlug);
  if (!group?.id)
    throw new Error(`Group "${groupSlug}" not found or has no id`);

  return postArena("/channels", {
    body: { title, visibility, group_id: group.id },
  });
}

/**
 * DELETE /v3/channels/{id}
 * Permanently deletes a channel and all its contents.
 */
export async function deleteChannel(idOrSlug) {
  return deleteArena(`/channels/${encodeURIComponent(idOrSlug)}`);
}

/**
 * POST /v3/blocks
 * Creates a Text block with value + title and connects it to the given channel.
 */
export async function createTextBlock(channelId, { title, content }) {
  if (!channelId) throw new Error("Channel id is required");
  if (!title?.trim()) throw new Error("Block title is required");
  if (!content?.trim()) throw new Error("Block content is required");

  const block = await postArena("/blocks", {
    body: {
      value: content.trim(),
      title: title.trim(),
      channel_ids: [channelId],
    },
  });

  return block;
}

/**
 * PUT /v3/blocks/{id}
 * Updates block metadata (e.g. title) after creation.
 */
export async function updateBlock(blockId, fields) {
  if (!blockId) throw new Error("Block id is required");
  if (!fields || typeof fields !== "object") {
    throw new Error("Update fields are required");
  }
  const result = await putArena(`/blocks/${encodeURIComponent(blockId)}`, {
    body: fields,
  });
  bumpReadCache();
  return result;
}

/**
 * DELETE /v3/connections/{connectionId}
 * Removes a connection between a connectable and a channel.
 */
export async function deleteConnection(connectionId) {
  if (!connectionId) throw new Error("Connection id is required");
  const result = await deleteArena(
    `/connections/${encodeURIComponent(connectionId)}`,
  );
  bumpReadCache();
  return result;
}

/**
 * Reorders items in a channel by disconnecting and reconnecting them.
 * `items` is an array of { id, connectionId, type } in desired display order
 * (first = highest position). Each item is disconnected then reconnected
 * in reverse so the final positions match the desired order.
 */
export async function reorderChannelItems(channelId, items) {
  if (!channelId) throw new Error("Channel id is required for reorder");
  // Disconnect items that have an existing connection
  for (const item of items) {
    if (item.connectionId) {
      await deleteConnection(item.connectionId);
    }
  }
  // Reconnect in reverse order so the last reconnected = highest position = first displayed
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    await postArena("/connections", {
      body: {
        connectable_id: item.id,
        connectable_type: item.type ?? "Channel",
        channel_ids: [channelId],
      },
    });
  }
  bumpReadCache();
}

/**
 * DELETE /v3/channels/{channelId}/blocks/{blockId}
 * Removes a block from a channel.
 */
export async function removeBlockFromChannel(channelId, blockId) {
  if (!channelId) throw new Error("Channel id is required");
  if (!blockId) throw new Error("Block id is required");
  const result = await deleteArena(
    `/channels/${encodeURIComponent(channelId)}/blocks/${encodeURIComponent(blockId)}`,
  );
  bumpReadCache();
  return result;
}

/**
 * Replaces an image block: removes the old one and uploads a new file
 * with the same title into the same channel.
 */
export async function replaceImageBlock(channelId, oldBlockId, file, title) {
  if (!channelId) throw new Error("Channel id is required");
  if (!oldBlockId) throw new Error("Original block id is required");
  await removeBlockFromChannel(channelId, oldBlockId);
  return uploadImageBlock(channelId, file, title);
}

// Are.na / S3 stores files by filename, so names containing spaces or other
// non-URL-safe characters produce invalid URIs when we later hand the S3 URL
// back to Are.na to create the block (resulting in `bad URI(is not URI?)`).
// Normalise to a conservative, web-safe filename before presigning.
function sanitizeUploadFilename(name) {
  const fallback = "upload";
  if (typeof name !== "string" || !name.trim()) return fallback;

  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot + 1) : "";

  const cleanBase =
    base
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || fallback;

  const cleanExt = ext.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

// Encode each path segment of an S3 key so the assembled URL is a valid URI
// even if a legacy/unexpected key still contains spaces or other reserved chars.
function encodeS3Key(key) {
  return String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * POST /v3/uploads/presign  →  S3 PUT  →  POST /v3/blocks
 * Uploads a local File through Are.na's presigned-S3 flow,
 * then creates a block pointing at the uploaded file.
 */
export async function uploadImageBlock(channelId, file, title) {
  if (!channelId) throw new Error("Channel id is required");
  if (!file) throw new Error("Image file is required");
  if (!title?.trim()) throw new Error("Image block title is required");

  const safeFilename = sanitizeUploadFilename(file.name);

  const presign = await postArena("/uploads/presign", {
    body: {
      files: [{ filename: safeFilename, content_type: file.type }],
    },
  });

  const entry = presign?.files?.[0];
  if (!entry?.upload_url || !entry?.key) {
    throw new Error("Presign response missing upload_url or key");
  }

  await putExternal(entry.upload_url, file, entry.content_type);

  const s3Url = `https://s3.amazonaws.com/arena_images-temp/${encodeS3Key(entry.key)}`;

  const block = await postArena("/blocks", {
    body: {
      value: s3Url,
      title: title.trim(),
      channel_ids: [channelId],
    },
  });

  bumpReadCache();
  return block;
}

/**
 * POST /v3/blocks
 * Creates an image block from a remote URL (skips the presign/S3 flow).
 */
export async function createImageBlockFromUrl(channelId, url, title) {
  if (!channelId) throw new Error("Channel id is required");
  if (!url?.trim()) throw new Error("Image URL is required");
  if (!title?.trim()) throw new Error("Image block title is required");

  const block = await postArena("/blocks", {
    body: {
      value: url.trim(),
      title: title.trim(),
      channel_ids: [channelId],
    },
  });
  bumpReadCache();
  return block;
}

/**
 * POST /v3/connections
 * Connects a channel (connectable) into one or more parent channels.
 */
export async function connectChannelToChannels(
  childChannelId,
  parentChannelIds,
) {
  if (!childChannelId) throw new Error("Child channel id is required");
  if (!parentChannelIds?.length)
    throw new Error("At least one parent channel id is required");

  return postArena("/connections", {
    body: {
      connectable_id: childChannelId,
      connectable_type: "Channel",
      channel_ids: parentChannelIds,
    },
  });
}

/**
 * Full orchestration: create a // channel, add Subtitle + Thumbnail +
 * optional images, and connect the channel into Page / Current.
 */
export async function createSlashChannelForCurrent({
  title,
  subtitle,
  thumbnailFile,
  imageFiles = [],
  groupSlug = getGroupSlug(),
  pageCurrentTitle = "Page / Current",
} = {}) {
  if (!thumbnailFile) throw new Error("Thumbnail is required");

  const normalizedTitle = normalizeSlashTitle(title);

  const channel = await createChannel(normalizedTitle, { groupSlug });
  const channelId = channel?.id;
  if (!channelId) throw new Error("Created channel is missing an id");

  const sub = String(subtitle ?? "").trim();
  if (sub) {
    await createTextBlock(channelId, {
      title: "Subtitle",
      content: sub,
    });
  }

  await uploadImageBlock(channelId, thumbnailFile, "Thumbnail");

  for (let i = 0; i < imageFiles.length; i += 1) {
    const file = imageFiles[i];
    if (!file) continue;
    await uploadImageBlock(channelId, file, `Image ${i + 1}`);
  }

  const pageCurrentChannel = await findChannelByTitle(
    pageCurrentTitle,
    groupSlug,
  );
  if (!pageCurrentChannel) {
    throw new Error(
      `Could not find channel "${pageCurrentTitle}" in group "${groupSlug}"`,
    );
  }

  await connectChannelToChannels(channelId, [pageCurrentChannel.id]);

  bumpReadCache();

  return { channel, pageCurrentChannel, normalizedTitle };
}

function normalizeProjectTitle(name) {
  let trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Project name is required");
  trimmed = trimmed.replace(/^→\s*/, "").trim();
  if (!trimmed) throw new Error("Project name is required");
  return `→ ${trimmed}`;
}

/**
 * Full orchestration for a unified project entry:
 * create a → channel, add Image + Client / Size / Scope / Architect / Year
 * blocks, then connect into both Page / Past and Page / Project List.
 */
export async function createProjectChannel({
  name,
  thumbnailFile,
  imageFiles = [],
  imageFile,
  client,
  size,
  scope,
  architect,
  year,
  groupSlug = getGroupSlug(),
  pagePastTitle = "Page / Past",
  pageProjectListTitle = "Page / Project List",
} = {}) {
  if (!name?.trim()) throw new Error("Project name is required");

  const primaryThumbnail = thumbnailFile ?? imageFile;
  if (!primaryThumbnail) throw new Error("Project thumbnail is required");

  const extraImages = Array.isArray(imageFiles)
    ? imageFiles.filter(Boolean)
    : [];

  const clientT = String(client ?? "").trim();
  const sizeT = String(size ?? "").trim();
  const scopeT = String(scope ?? "").trim();
  const archT = String(architect ?? "").trim();
  const yearT = String(year ?? "").trim();

  if (!clientT) throw new Error("Client is required");
  if (!sizeT) throw new Error("Size is required");
  if (!scopeT) throw new Error("Scope is required");
  if (!archT) throw new Error("Architect is required");
  if (!yearT) throw new Error("Year is required");

  const normalizedTitle = normalizeProjectTitle(name);

  const channel = await createChannel(normalizedTitle, { groupSlug });
  const channelId = channel?.id;
  if (!channelId) throw new Error("Created channel is missing an id");

  await uploadImageBlock(channelId, primaryThumbnail, "Thumbnail");

  for (let i = 0; i < extraImages.length; i += 1) {
    const file = extraImages[i];
    if (!file) continue;
    await uploadImageBlock(channelId, file, `Image ${i + 1}`);
  }

  await createTextBlock(channelId, { title: "Client", content: clientT });
  await createTextBlock(channelId, { title: "Size", content: sizeT });
  await createTextBlock(channelId, { title: "Scope", content: scopeT });
  await createTextBlock(channelId, { title: "Architect", content: archT });
  await createTextBlock(channelId, { title: "Year", content: yearT });

  const pagePastChannel = await findChannelByTitle(pagePastTitle, groupSlug);
  if (!pagePastChannel) {
    throw new Error(
      `Could not find channel "${pagePastTitle}" in group "${groupSlug}"`,
    );
  }

  const pageProjectListChannel = await findChannelByTitle(
    pageProjectListTitle,
    groupSlug,
  );
  if (!pageProjectListChannel) {
    throw new Error(
      `Could not find channel "${pageProjectListTitle}" in group "${groupSlug}"`,
    );
  }

  await connectChannelToChannels(channelId, [
    pagePastChannel.id,
    pageProjectListChannel.id,
  ]);

  bumpReadCache();

  return { channel, pagePastChannel, pageProjectListChannel, normalizedTitle };
}

/**
 * Public Are.na URL for a channel under a group profile
 * (e.g. https://www.are.na/strange-colour-web/my-channel-slug).
 */
export function buildAreNaChannelWebUrl(channel, groupSlug = getGroupSlug()) {
  const chSlug = channel?.slug;
  if (!chSlug || !groupSlug) return null;
  return `https://www.are.na/${encodeURIComponent(groupSlug)}/${encodeURIComponent(chSlug)}`;
}

// ─── Prefetch ────────────────────────────────────────────
// Kick off the group channels fetch at module load so the
// sidebar and dashboard data is ready before any component mounts.

export function prefetchAll() {
  warmGroupChannels();
}

// Start immediately at module load time
prefetchAll();
