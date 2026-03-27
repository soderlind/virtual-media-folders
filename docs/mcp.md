# MCP Integration Guide

This guide shows how to use MCP with Virtual Media Folders to:

1. Upload an image.
2. Find the best folder.
3. Create the folder when missing.
4. Add the image to the folder.

## Prerequisites

- WordPress with Virtual Media Folders active.
- WordPress MCP Adapter active (default server).
- A user with:
  - `upload_files` for listing folders and assigning media.
  - `manage_categories` for creating folders.
- An Application Password for that user.

Default MCP endpoint:

`https://example.com/wp-json/mcp/mcp-adapter-default-server`

## MCP Tools Exposed By This Plugin

Virtual Media Folders exposes these abilities as MCP-compatible tools through the adapter gateway:

- `vmfo/list-folders` (read-only)
- `vmfo/create-folder` (write)
- `vmfo/add-to-folder` (write)

All calls are made through the gateway tool `mcp-adapter-execute-ability`.

## Step 1: Upload The Image

Upload is not handled by `vmfo/*` abilities. Use the WordPress media endpoint first:

```bash
curl -X POST "https://example.com/wp-json/wp/v2/media" \
  -u "username:application-password" \
  -H "Content-Disposition: attachment; filename=beach-sunset.jpg" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/absolute/path/beach-sunset.jpg"
```

Take the returned media `id` (for example `1234`).

## Step 2: Discover Candidate Folder

Call `tools/call` through the gateway and resolve folder IDs by path:

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
  -u "username:application-password" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "mcp-adapter-execute-ability",
      "arguments": {
        "ability_name": "vmfo/list-folders",
        "parameters": {
          "search": "travel",
          "hide_empty": false
        }
      }
    }
  }'
```

Use `path` to disambiguate duplicate names, then select the folder `id`.

## Step 3: Create Folder If Missing

If no matching folder exists, create one:

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
  -u "username:application-password" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "mcp-adapter-execute-ability",
      "arguments": {
        "ability_name": "vmfo/create-folder",
        "parameters": {
          "name": "Travel",
          "parent_id": 0
        }
      }
    }
  }'
```

Response includes `id`, `name`, `parent_id`, `path`, and `count`.

## Step 4: Assign Uploaded Image To Folder

Use the folder `id` from step 2 or 3 and the media `id` from step 1:

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
  -u "username:application-password" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "mcp-adapter-execute-ability",
      "arguments": {
        "ability_name": "vmfo/add-to-folder",
        "parameters": {
          "folder_id": 2285,
          "attachment_ids": [1234]
        }
      }
    }
  }'
```

## One-Pass Agent Workflow

For each image:

1. Upload image and collect `attachment_id`.
2. Run `vmfo/list-folders` with topic keywords.
3. If folder missing, run `vmfo/create-folder`.
4. Run `vmfo/add-to-folder` with `attachment_ids`.

## Quick Client Configuration

Configuration formats change over time across clients. Use these as templates and replace values.

### Claude Desktop (MCP)

```json
{
  "mcpServers": {
    "vmfo": {
      "type": "http",
      "url": "https://example.com/wp-json/mcp/mcp-adapter-default-server",
      "headers": {
        "Authorization": "Basic <base64(username:application-password)>"
      }
    }
  }
}
```

### GitHub Copilot in VS Code

1. Open Command Palette.
2. Run `MCP: Add Server`.
3. Choose HTTP server.
4. Use endpoint `https://example.com/wp-json/mcp/mcp-adapter-default-server`.
5. Add Basic auth header for your Application Password user.

### Cursor

Add an MCP HTTP server entry in Cursor MCP settings:

```json
{
  "mcpServers": {
    "vmfo": {
      "url": "https://example.com/wp-json/mcp/mcp-adapter-default-server",
      "headers": {
        "Authorization": "Basic <base64(username:application-password)>"
      }
    }
  }
}
```

## Skill: Auto-Place Photos By Image Content

A reusable skill file is available at:

`.github/skills/add-photo-to-folder/SKILL.md`

It defines a deterministic flow that:

1. Extracts a topic from image content.
2. Finds matching folder paths.
3. Creates a folder if allowed and needed.
4. Assigns uploaded media IDs to the selected folder.

## Troubleshooting

- `401` or `403` on tools calls:
  - Verify Application Password and user capabilities.
  - `vmfo/create-folder` requires `manage_categories`.
- Tool not found:
  - Run `tools/list` first and confirm `mcp-adapter-execute-ability` exists.
- Folder mismatch:
  - Resolve by `path`, not only by `name`.
- Upload succeeded but assignment failed:
  - Confirm media ID is an attachment and folder ID exists.

## Optional Smoke Test

Run the included script:

```bash
MCP_BASE_URL="https://example.com/wp-json/mcp/mcp-adapter-default-server" \
MCP_USER="per" \
MCP_APP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx" \
./scripts/mcp-adapter-smoke-test.sh
```

Enable mutating create-folder test:

```bash
MCP_BASE_URL="https://example.com/wp-json/mcp/mcp-adapter-default-server" \
MCP_USER="per" \
MCP_APP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx" \
VMFO_RUN_MUTATING_TESTS=1 \
./scripts/mcp-adapter-smoke-test.sh
```
