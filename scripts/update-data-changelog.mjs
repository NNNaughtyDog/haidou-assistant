import { readFile, writeFile } from "node:fs/promises";

const readConst = (source, name) => {
  const marker = `export const ${name} = `;
  const start = source.indexOf(marker) + marker.length;
  const end = source.indexOf(" as const;", start);
  if (start < marker.length || end < 0) throw new Error(`无法读取 ${name}`);
  return JSON.parse(source.slice(start, end));
};

const [hexSource, itemSource] = await Promise.all([
  readFile(new URL("../app/hexdata-snapshot.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/item-snapshot.ts", import.meta.url), "utf8"),
]);
const meta = readConst(hexSource, "hexdataSnapshot");
const items = readConst(itemSource, "itemCatalogSnapshot");
const itemPools = readConst(itemSource, "heroItemPoolByKey");
const bullet = `- ${meta.date}：同步 ${meta.patch} 数据快照，并刷新当前模式成装 ${items.length} 件、英雄装备池 ${Object.keys(itemPools).length} 位。`;
const changelogPath = new URL("../CHANGELOG.md", import.meta.url);
let changelog = await readFile(changelogPath, "utf8");
if (!changelog.includes(bullet)) {
  const heading = "## [未发布]\n\n### 数据\n\n";
  if (changelog.includes(heading)) changelog = changelog.replace(heading, `${heading}${bullet}\n`);
  else changelog = changelog.replace("本项目遵循语义化版本。\n", `本项目遵循语义化版本。\n\n${heading}${bullet}\n`);
  await writeFile(changelogPath, changelog);
}
console.log(bullet);
