import { readFile, writeFile } from "node:fs/promises";

const SNAPSHOT_PATH = new URL("../app/hexdata-snapshot.ts", import.meta.url);
const CHANGELOG_PATH = new URL("../CHANGELOG.md", import.meta.url);

const source = await readFile(SNAPSHOT_PATH, "utf8");
const readConst = (name) => {
  const marker = `export const ${name} = `;
  const start = source.indexOf(marker) + marker.length;
  const end = source.indexOf(" as const;", start);
  if (start < marker.length || end < 0) throw new Error(`无法读取 ${name}`);
  return JSON.parse(source.slice(start, end));
};

const meta = readConst("hexdataSnapshot");
const heroes = readConst("cnStatsByKey");
const heroPools = readConst("heroAugmentStatsByKey");
const augments = readConst("augmentCatalogSnapshot");
const bullet = `- ${meta.date}：同步 Hexdata ${meta.patch} 快照（英雄 ${Object.keys(heroes).length}、英雄强化池 ${Object.keys(heroPools).length}、强化 ${augments.length}）。`;

let changelog = await readFile(CHANGELOG_PATH, "utf8");
if (!changelog.includes(bullet)) {
  const marker = "本项目遵循语义化版本。\n";
  const unreleased = "\n## [未发布]\n\n### 数据\n\n";
  if (changelog.includes("## [未发布]")) {
    const start = changelog.indexOf("## [未发布]");
    const next = changelog.indexOf("\n## [", start + 1);
    const end = next < 0 ? changelog.length : next;
    let section = changelog.slice(start, end).trimEnd();
    const dataHeading = "### 数据\n\n";
    if (section.includes(dataHeading)) {
      section = section.replace(dataHeading, `${dataHeading}${bullet}\n`);
    } else {
      section = `${section}\n\n${dataHeading}${bullet}`;
    }
    changelog = `${changelog.slice(0, start)}${section}\n${changelog.slice(end)}`;
  } else {
    changelog = changelog.replace(marker, `${marker}${unreleased}${bullet}\n`);
  }
  await writeFile(CHANGELOG_PATH, changelog);
}

console.log(bullet);
