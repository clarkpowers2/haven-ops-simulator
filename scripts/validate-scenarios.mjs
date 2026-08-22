import { readdir, readFile } from "node:fs/promises";

const directory = new URL("../scenarios/library/", import.meta.url);
const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));

for (const file of files) {
  const scenario = JSON.parse(await readFile(new URL(file, directory), "utf8"));
  if (scenario.id !== file.replace(/\.json$/, "")) {
    throw new Error(`${file}: scenario id does not match filename`);
  }
  if (!scenario.trigger?.message || !scenario.expected?.department) {
    throw new Error(`${file}: missing required scenario fields`);
  }
}

console.log(`Validated ${files.length} scenario files.`);
