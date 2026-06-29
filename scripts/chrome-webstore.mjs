#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(rootDir, ".env")
const pkg = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
)

loadDotEnv(envPath)

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  printHelp()
  process.exit(0)
}

const requiredEnv = [
  "CLIENT_ID",
  "CLIENT_SECRET",
  "REFRESH_TOKEN",
  "PUBLISHER_ID",
  "EXTENSION_ID",
]

const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  fail(`Missing required .env values: ${missingEnv.join(", ")}`)
}

const zipFile = path.resolve(
  rootDir,
  args.zip || process.env.ZIP_FILE || `release/${pkg.version}.zip`,
)

if (!fs.existsSync(zipFile)) {
  fail(
    `Zip file not found: ${zipFile}\nRun "pnpm run build" first, or pass --zip=path/to/file.zip.`,
  )
}

const itemName = `publishers/${process.env.PUBLISHER_ID}/items/${process.env.EXTENSION_ID}`

try {
  console.log(`Using zip: ${path.relative(rootDir, zipFile)}`)

  const token = await getAccessToken()
  const upload = await uploadZip(token, zipFile)

  console.log("Upload response:")
  console.log(JSON.stringify(upload, null, 2))

  const uploadState = upload.uploadState

  if (uploadState === "IN_PROGRESS" || uploadState === "UPLOAD_IN_PROGRESS") {
    const status = await waitForUpload(token)
    console.log("Final upload status:")
    console.log(JSON.stringify(status, null, 2))

    if (status.lastAsyncUploadState !== "SUCCEEDED") {
      fail(
        `Upload did not finish successfully. State: ${status.lastAsyncUploadState}`,
      )
    }
  } else if (uploadState && uploadState !== "SUCCEEDED") {
    fail(`Upload failed. State: ${uploadState}`)
  }

  const publish = await publishItem(token)

  console.log("Publish response:")
  console.log(JSON.stringify(publish, null, 2))
} catch (error) {
  fail(error.message)
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed
    const separatorIndex = normalized.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = normalized.slice(0, separatorIndex).trim()
    const value = unquote(normalized.slice(separatorIndex + 1).trim())

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function parseArgs(argv) {
  const parsed = {
    blockOnWarnings: false,
    help: false,
    skipReview: false,
    staged: false,
    zip: "",
  }

  for (const arg of argv) {
    if (arg === "--") {
      continue
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true
    } else if (arg === "--staged") {
      parsed.staged = true
    } else if (arg === "--skip-review") {
      parsed.skipReview = true
    } else if (arg === "--block-on-warnings") {
      parsed.blockOnWarnings = true
    } else if (arg.startsWith("--zip=")) {
      parsed.zip = arg.slice("--zip=".length)
    } else {
      fail(`Unknown argument: ${arg}`)
    }
  }

  return parsed
}

async function getAccessToken() {
  const response = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: process.env.REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  })

  if (!response.access_token) {
    fail("Token response did not include access_token.")
  }

  return response.access_token
}

async function uploadZip(token, filePath) {
  return fetchJson(
    `https://chromewebstore.googleapis.com/upload/v2/${itemName}:upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/zip",
      },
      body: fs.readFileSync(filePath),
    },
  )
}

async function waitForUpload(token) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    await sleep(3000)

    const status = await fetchStatus(token)
    const state = status.lastAsyncUploadState

    console.log(`Upload processing state ${attempt}/20: ${state}`)

    if (state === "SUCCEEDED" || state === "FAILED" || state === "NOT_FOUND") {
      return status
    }
  }

  fail("Timed out waiting for upload processing.")
}

async function fetchStatus(token) {
  return fetchJson(
    `https://chromewebstore.googleapis.com/v2/${itemName}:fetchStatus`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
}

async function publishItem(token) {
  return fetchJson(
    `https://chromewebstore.googleapis.com/v2/${itemName}:publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publishType: args.staged ? "STAGED_PUBLISH" : "DEFAULT_PUBLISH",
        skipReview: args.skipReview,
        blockOnWarnings: args.blockOnWarnings,
      }),
    },
  )
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const message = data.error?.message || text || response.statusText
    const description = data.error_description || data.error?.status

    if (data.error === "unauthorized_client") {
      throw new Error(
        `${response.status} ${response.statusText}: ${message}${description ? ` (${description})` : ""}\n` +
          "OAuth credentials are not a matching set. Regenerate REFRESH_TOKEN in OAuth Playground with the CLIENT_ID and CLIENT_SECRET from this .env file.",
      )
    }

    throw new Error(`${response.status} ${response.statusText}: ${message}`)
  }

  return data
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function printHelp() {
  console.log(`
Usage:
  pnpm run chrome:upload
  node scripts/chrome-webstore.mjs --zip=release/${pkg.version}.zip

Required .env values:
  CLIENT_ID
  CLIENT_SECRET
  REFRESH_TOKEN
  PUBLISHER_ID
  EXTENSION_ID

Optional .env values:
  ZIP_FILE

Options:
  --staged             Submit for review, then stage instead of immediate publish after approval.
  --skip-review        Ask Chrome Web Store to skip review if the item qualifies.
  --block-on-warnings  Fail publish if validation returns warnings.
  --zip=path           Upload a specific zip file.
`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
