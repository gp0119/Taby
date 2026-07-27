import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function validateChangelog(pkg, changelog) {
  const packageVersion = parseVersion(pkg.version, "package.json")
  const headingPattern = /^##[ \t]+(\d+\.\d+\.\d+)(?:[ \t]+-[ \t]+.+)?[ \t]*$/gm
  const heading = headingPattern.exec(changelog)

  if (!heading) {
    throw new Error("CHANGELOG.md does not contain a version heading.")
  }

  const changelogVersion = parseVersion(heading[1], "CHANGELOG.md")
  const remainingChangelog = changelog.slice(heading.index + heading[0].length)
  const nextHeading = /^##[ \t]+/m.exec(remainingChangelog)
  const latestEntry = remainingChangelog.slice(
    0,
    nextHeading?.index ?? remainingChangelog.length,
  )

  if (!/^[ \t]*-[ \t]+\S/m.test(latestEntry)) {
    throw new Error(
      `CHANGELOG.md entry ${heading[1]} must contain at least one list item.`,
    )
  }

  if (compareVersions(changelogVersion, packageVersion) <= 0) {
    const nextPatchVersion = [
      packageVersion[0],
      packageVersion[1],
      packageVersion[2] + 1,
    ].join(".")

    throw new Error(
      [
        `Latest CHANGELOG.md version (${heading[1]}) must be newer than package.json (${pkg.version}).`,
        "Add the next release notes before running release-it, for example:",
        `## ${nextPatchVersion} - YYYY-MM-DD`,
        "",
        "- Describe the change.",
      ].join("\n"),
    )
  }

  return {
    changelogVersion: heading[1],
    packageVersion: pkg.version,
  }
}

function parseVersion(value, source) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value)

  if (!match) {
    throw new Error(`${source} version must use the x.y.z format: ${value}`)
  }

  return match.slice(1).map(Number)
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index]
    }
  }

  return 0
}

function main() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
  )
  const changelog = fs.readFileSync(path.join(rootDir, "CHANGELOG.md"), "utf8")
  const result = validateChangelog(pkg, changelog)

  console.log(
    `Changelog check passed: ${result.changelogVersion} > ${result.packageVersion}`,
  )
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main()
  } catch (error) {
    console.error(`Changelog check failed:\n${error.message}`)
    process.exit(1)
  }
}
