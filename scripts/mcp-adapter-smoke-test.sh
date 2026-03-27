#!/usr/bin/env bash
set -euo pipefail

# Smoke test for WordPress MCP adapter in gateway mode.
# This test is safe by default: add-to-folder uses invalid input to avoid data mutation.
#
# Required environment variables:
#   MCP_BASE_URL   Example: https://example.com/wp-json/mcp/mcp-adapter-default-server
#   MCP_USER       Example: per
#   MCP_APP_PASS   Example: xxxx xxxx xxxx xxxx xxxx xxxx
#
# Optional environment variables:
#   VMFO_SEARCH_TERM          Default: ""
#   VMFO_TEST_ATTACHMENT_ID   Default: 101
#   VMFO_EXPECT_DIRECT_TOOLS  Default: 0 (set 1 if your server exposes vmfo/* as direct MCP tools)
#   VMFO_RUN_MUTATING_TESTS   Default: 0 (set 1 to run create-folder mutation test)
#   VMFO_CREATE_FOLDER_NAME   Default: "MCP Smoke Test <timestamp>"
#   VMFO_CREATE_PARENT_ID     Default: 0

fail() {
    echo "[FAIL] $1" >&2
    exit 1
}

pass() {
    echo "[PASS] $1"
}

require_var() {
    local name="$1"
    if [[ -z "${!name:-}" ]]; then
        fail "Missing required environment variable: $name"
    fi
}

require_var "MCP_BASE_URL"
require_var "MCP_USER"
require_var "MCP_APP_PASS"

VMFO_SEARCH_TERM="${VMFO_SEARCH_TERM:-}"
VMFO_TEST_ATTACHMENT_ID="${VMFO_TEST_ATTACHMENT_ID:-101}"
VMFO_EXPECT_DIRECT_TOOLS="${VMFO_EXPECT_DIRECT_TOOLS:-0}"
VMFO_RUN_MUTATING_TESTS="${VMFO_RUN_MUTATING_TESTS:-0}"
VMFO_CREATE_PARENT_ID="${VMFO_CREATE_PARENT_ID:-0}"
VMFO_CREATE_FOLDER_NAME="${VMFO_CREATE_FOLDER_NAME:-MCP Smoke Test $(date +%s)}"
AUTH="${MCP_USER}:${MCP_APP_PASS}"

INIT_HEADERS="$(mktemp)"
INIT_BODY="$(mktemp)"

cleanup() {
    rm -f "$INIT_HEADERS" "$INIT_BODY"
}
trap cleanup EXIT

# 1) initialize
curl -sS -D "$INIT_HEADERS" -o "$INIT_BODY" -X POST "$MCP_BASE_URL" \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"vmfo-smoke-test","version":"1.0.0"}}}'

if ! grep -q "HTTP/1.1 200" "$INIT_HEADERS"; then
    fail "initialize did not return HTTP 200"
fi
pass "initialize returned HTTP 200"

SESSION_ID="$(grep -i '^Mcp-Session-Id:' "$INIT_HEADERS" | tail -n 1 | sed -E 's/^Mcp-Session-Id:[[:space:]]*//I' | tr -d '\r')"
[[ -n "$SESSION_ID" ]] || fail "initialize did not return Mcp-Session-Id"
pass "initialize returned Mcp-Session-Id"

# 2) tools/list
TOOLS_LIST="$(curl -sS -X POST "$MCP_BASE_URL" \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')"

[[ "$TOOLS_LIST" == *"mcp-adapter-execute-ability"* ]] || fail "tools/list does not include mcp-adapter-execute-ability"
pass "tools/list includes mcp-adapter-execute-ability"

if [[ "$VMFO_EXPECT_DIRECT_TOOLS" == "1" ]]; then
    [[ "$TOOLS_LIST" == *"vmfo/list-folders"* ]] || fail "Expected direct vmfo/list-folders tool in tools/list"
    [[ "$TOOLS_LIST" == *"vmfo/create-folder"* ]] || fail "Expected direct vmfo/create-folder tool in tools/list"
    [[ "$TOOLS_LIST" == *"vmfo/add-to-folder"* ]] || fail "Expected direct vmfo/add-to-folder tool in tools/list"
    pass "tools/list includes direct vmfo tools"
else
    pass "gateway mode assumed (direct vmfo tools not required in tools/list)"
fi

# 3) list folders via gateway tool
LIST_PAYLOAD="{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"mcp-adapter-execute-ability\",\"arguments\":{\"ability_name\":\"vmfo/list-folders\",\"parameters\":{\"search\":\"${VMFO_SEARCH_TERM}\",\"hide_empty\":false}}}}"
LIST_CALL="$(curl -sS -X POST "$MCP_BASE_URL" \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d "$LIST_PAYLOAD")"

[[ "$LIST_CALL" == *"\"result\""* ]] || fail "vmfo/list-folders gateway call did not return result"
[[ "$LIST_CALL" == *"folders"* ]] || fail "vmfo/list-folders gateway call did not include folders data"
pass "vmfo/list-folders gateway call returned folders data"

# 4) add-to-folder via gateway tool (safe negative test)
ADD_PAYLOAD="{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"mcp-adapter-execute-ability\",\"arguments\":{\"ability_name\":\"vmfo/add-to-folder\",\"parameters\":{\"folder_id\":-1,\"attachment_ids\":[${VMFO_TEST_ATTACHMENT_ID}]}}}}"
ADD_CALL="$(curl -sS -X POST "$MCP_BASE_URL" \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -d "$ADD_PAYLOAD")"

[[ "$ADD_CALL" == *"\"result\""* ]] || fail "vmfo/add-to-folder gateway call did not return result envelope"
[[ "$ADD_CALL" == *"isError"* ]] || fail "vmfo/add-to-folder negative test did not return isError"
pass "vmfo/add-to-folder gateway path executed (safe negative validation)"

# 5) create-folder via gateway tool (optional mutating test)
if [[ "$VMFO_RUN_MUTATING_TESTS" == "1" ]]; then
    CREATE_PAYLOAD="{\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/call\",\"params\":{\"name\":\"mcp-adapter-execute-ability\",\"arguments\":{\"ability_name\":\"vmfo/create-folder\",\"parameters\":{\"name\":\"${VMFO_CREATE_FOLDER_NAME}\",\"parent_id\":${VMFO_CREATE_PARENT_ID}}}}}"
    CREATE_CALL="$(curl -sS -X POST "$MCP_BASE_URL" \
        -u "$AUTH" \
        -H "Content-Type: application/json" \
        -H "Mcp-Session-Id: $SESSION_ID" \
        -d "$CREATE_PAYLOAD")"

    [[ "$CREATE_CALL" == *"\"result\""* ]] || fail "vmfo/create-folder gateway call did not return result"
    [[ "$CREATE_CALL" == *"$VMFO_CREATE_FOLDER_NAME"* ]] || fail "vmfo/create-folder response does not include folder name"
    pass "vmfo/create-folder gateway path executed (mutating mode)"
else
    pass "mutating create-folder test skipped (set VMFO_RUN_MUTATING_TESTS=1 to enable)"
fi

echo
pass "MCP adapter smoke test completed"
