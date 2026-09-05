import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const sources = [
  {
    name: "ARAMGG",
    script: new URL("./sync-aramgg.mjs", import.meta.url),
    outputs: [new URL("../app/aramgg-snapshot.ts", import.meta.url)],
  },
  {
    name: "CN pools / official items",
    script: new URL("./sync-cn-pools.mjs", import.meta.url),
    outputs: [
      new URL("../app/hexdata-snapshot.ts", import.meta.url),
      new URL("../app/item-snapshot.ts", import.meta.url),
    ],
  },
];

const runScript = (script) => new Promise((resolve) => {
  const child = spawn(process.execPath, [script.pathname], { stdio: "inherit" });
  child.once("error", () => resolve(false));
  child.once("exit", (code) => resolve(code === 0));
});

const results = [];
for (const source of sources) {
  const baselines = await Promise.all(source.outputs.map((output) => readFile(output)));
  const ok = await runScript(source.script);
  if (!ok) {
    await Promise.all(source.outputs.map((output, index) => writeFile(output, baselines[index])));
    console.warn(`::warning::${source.name} 同步失败，已恢复该数据源的可靠快照`);
  }
  results.push({ name: source.name, ok });
}

const failed = results.filter((result) => !result.ok).map((result) => result.name);
const succeeded = results.filter((result) => result.ok).map((result) => result.name);
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT,
    `degraded=${failed.length > 0}\nfailed_sources=${failed.join(",")}\nsucceeded_sources=${succeeded.join(",")}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## 数据源同步\n\n成功：${succeeded.join("、") || "无"}  \n延迟：${failed.join("、") || "无"}\n`);
}
if (succeeded.length === 0) {
  throw new Error("所有数据源均同步失败，停止发布");
}

