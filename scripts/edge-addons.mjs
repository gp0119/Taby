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

const requiredEnv = ["EDGE_CLIENT_ID", "EDGE_API_KEY", "EDGE_PRODUCT_ID"]
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  fail(`Missing required .env values: ${missingEnv.join(", ")}`)
}

const apiRoot =
  process.env.EDGE_API_ENDPOINT ||
  "https://api.addons.microsoftedge.microsoft.com"
const zipFile = path.resolve(
  rootDir,
  args.zip || process.env.ZIP_FILE || `release/${pkg.version}.zip`,
)

if (!fs.existsSync(zipFile)) {
  fail(
    `Zip file not found: ${zipFile}\nRun "pnpm run build" first, or pass --zip=path/to/file.zip.`,
  )
}

const productPath = `/v1/products/${process.env.EDGE_PRODUCT_ID}/submissions`
const notes =
  args.notes ||
  process.env.EDGE_PUBLISH_NOTES ||
  `Automated release ${pkg.version}`

try {
  console.log(`Using zip: ${path.relative(rootDir, zipFile)}`)
  console.log(`Using Edge product: ${process.env.EDGE_PRODUCT_ID}`)

  const uploadOperationUrl = await uploadPackage(zipFile)
  const uploadStatus = await waitForOperation("Upload", uploadOperationUrl)

  if (isFailureStatus(uploadStatus.status)) {
    fail(`Upload failed. Status: ${uploadStatus.status}`)
  }

  const publishOperationUrl = await publishSubmission()
  const publishStatus = await waitForOperation("Publish", publishOperationUrl)

  if (isFailureStatus(publishStatus.status)) {
    fail(`Publish failed. Status: ${publishStatus.status}`)
  }
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
    help: false,
    notes: "",
    zip: "",
  }

  for (const arg of argv) {
    if (arg === "--") {
      continue
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true
    } else if (arg.startsWith("--notes=")) {
      parsed.notes = arg.slice("--notes=".length)
    } else if (arg.startsWith("--zip=")) {
      parsed.zip = arg.slice("--zip=".length)
    } else {
      fail(`Unknown argument: ${arg}`)
    }
  }

  return parsed
}

async function uploadPackage(filePath) {
  const response = await fetchRaw(`${apiRoot}${productPath}/draft/package`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/zip",
    },
    body: fs.readFileSync(filePath),
  })

  if (response.status !== 202) {
    throwHttpError(response, "Upload request failed")
  }

  const operationUrl = getOperationUrl(response, `${productPath}/draft/package`)

  console.log(`Upload accepted: ${operationUrl}`)
  return operationUrl
}

async function publishSubmission() {
  const response = await fetchRaw(`${apiRoot}${productPath}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  })

  if (response.status !== 202) {
    throwHttpError(response, "Publish request failed")
  }

  const operationUrl = getOperationUrl(response, productPath)

  console.log(`Publish accepted: ${operationUrl}`)
  return operationUrl
}

async function waitForOperation(label, operationUrl) {
  let latestStatus = null

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    await sleep(5000)

    const response = await fetchRaw(operationUrl, {
      headers: authHeaders(),
    })

    if (response.status !== 202 && response.status !== 200) {
      throwHttpError(response, `${label} status request failed`)
    }

    latestStatus = response.data || {}
    const status = latestStatus.status

    if (!status) {
      fail(`${label} status response did not include a status field.`)
    }

    console.log(`${label} status ${attempt}/20: ${status}`)

    if (!isInProgressStatus(status)) {
      console.log(`${label} response:`)
      console.log(JSON.stringify(latestStatus, null, 2))
      return latestStatus
    }
  }

  fail(`${label} timed out waiting for operation to finish.`)
}

function authHeaders() {
  return {
    Authorization: `ApiKey ${process.env.EDGE_API_KEY}`,
    "X-ClientID": process.env.EDGE_CLIENT_ID,
  }
}

function getOperationUrl(response, operationBasePath) {
  const location = response.headers.get("location")

  if (!location) {
    fail("Edge API response did not include a Location header.")
  }

  if (location.startsWith("http://") || location.startsWith("https://")) {
    return location
  }

  if (location.startsWith("/")) {
    return `${apiRoot}${location}`
  }

  return `${apiRoot}${operationBasePath}/operations/${location}`
}

async function fetchRaw(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()

  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  return {
    data,
    headers: response.headers,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    text,
  }
}

function throwHttpError(response, fallback) {
  const message =
    response.data?.message ||
    response.data?.error_description ||
    response.data?.error ||
    response.text ||
    fallback

  throw new Error(`${response.status} ${response.statusText}: ${message}`)
}

function isFailureStatus(status = "") {
  const normalized = status.toLowerCase()

  return (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("invalid")
  )
}

function isInProgressStatus(status = "") {
  return status.toLowerCase() === "inprogress"
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function printHelp() {
  console.log(`
Usage:
  pnpm run edge:upload
  node scripts/edge-addons.mjs --zip=release/${pkg.version}.zip

Required .env values:
  EDGE_CLIENT_ID
  EDGE_API_KEY
  EDGE_PRODUCT_ID

Optional .env values:
  ZIP_FILE
  EDGE_PUBLISH_NOTES
  EDGE_API_ENDPOINT

Options:
  --notes=text         Notes for certification.
  --zip=path           Upload a specific zip file.
`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
