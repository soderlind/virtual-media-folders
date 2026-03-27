---
name: add-photo-to-folder
description: "Use when uploading or organizing images in Virtual Media Folders using MCP. Triggers: add photo to folder, place image by content, classify image into folder, auto-folder image. Uses vmfo/list-folders, vmfo/create-folder, and vmfo/add-to-folder through mcp-adapter-execute-ability."
---

# Add Photo To Folder

## When to use

Use this skill to place images into VMFO folders based on image content or user intent.

## Required inputs

- `attachment_id` from WordPress media upload.
- Candidate topic label (for example: `Travel`, `Food`, `Team`).
- Optional `parent_id` for hierarchical folder creation.

## Procedure

1. List folders first:
   - Call `vmfo/list-folders` with `search` and inspect `path`.
2. Resolve target folder:
   - Prefer exact `path` match over raw `name`.
3. Create folder when missing:
   - Call `vmfo/create-folder` with `name` and `parent_id`.
   - If create fails with permissions, stop and return actionable error.
4. Assign image:
   - Call `vmfo/add-to-folder` with resolved `folder_id` and `attachment_ids`.
5. Return a compact result:
   - `attachment_id`, `folder_id`, `folder_path`, `created` (boolean), `status`.

## Tool calls

All calls go through MCP adapter gateway tool:

- `mcp-adapter-execute-ability` with:
  - `ability_name: vmfo/list-folders`
  - `ability_name: vmfo/create-folder`
  - `ability_name: vmfo/add-to-folder`

## Guardrails

- Never create duplicate folder names blindly; check parent/path first.
- Use `path` disambiguation when multiple folders share the same name.
- Stop on permission errors; do not retry with guessed IDs.
- Validate attachment IDs before assignment.

## Failure handling

- If list fails: return MCP/permission error.
- If create fails with `term_exists`: re-run list and resolve by path.
- If create fails with authorization: return that `manage_categories` is required.
- If add fails: return folder and attachment IDs used for easier debugging.
