import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateFeed, parseStoryBlocks } from "./generate-site-feed.mjs";

test("attaches multiple citations to their story without changing its prose", () => {
  const stories = parseStoryBlocks([
    "📈 **First story** — Analysis with **emphasis**.",
    "Sources: [News](https://example.com/a) · [SEC](https://example.com/b) · [News](https://example.com/a)",
    "🤖 **Second story** — Another analysis.",
    "Sources: [News](https://example.com/c)",
  ]);
  assert.equal(stories.length, 2);
  assert.equal(stories[0].body, "Analysis with **emphasis**.");
  assert.deepEqual(stories[0].sources, [
    { label: "News", url: "https://example.com/a" },
    { label: "SEC", url: "https://example.com/b" },
  ]);
  assert.deepEqual(stories[1].sources, [{ label: "News", url: "https://example.com/c" }]);
});

test("legacy stories and uncited notes retain their behavior", () => {
  assert.deepEqual(parseStoryBlocks([
    "📈 **Legacy** — Still readable.",
    "*Thin day: no other stories.*",
  ]), [{ icon: "📈", title: "Legacy", body: "Still readable." }]);
});

test("rejects orphaned, duplicate, malformed, and unsafe source paragraphs", () => {
  const story = "🤖 **Story** — Analysis.";
  const citation = "Sources: [News](https://example.com/a)";
  for (const blocks of [
    [citation],
    [story, "*An unrelated note.*", citation],
    [story, citation, citation],
    [story, "Sources:"],
    [story, "Sources: [Unsafe](javascript:alert(1))"],
    [story, "Sources: [Broken](https://)"],
  ]) assert.throws(() => parseStoryBlocks(blocks));
});

test("generates the feed with story citations, closing and bibliography intact", async () => {
  const root = await mkdtemp(join(tmpdir(), "morning-download-feed-"));
  try {
    const month = join(root, "briefs", "2026-10");
    await mkdir(month, { recursive: true });
    const file = join(month, "2026-10-21.md");
    const markdown = `# Morning Download — October 21, 2026

## Section 1: World & Market Briefing

📈 **Markets** — World analysis.

Sources: [News](https://example.com/a)

## Section 2: AI & Agentic Systems Briefing

🤖 **AI** — AI analysis.

Sources: [Lab](https://example.com/b)

## Closing

**Sleeper Story:** A synthesis.

**One-Liner:** The day.

---

## Sources

- [Article — News](https://example.com/a)
- [Research — Lab](https://example.com/b)
`;
    await writeFile(file, markdown);
    const outputPath = join(root, "preview", "briefs.json");
    const briefs = await generateFeed({ root, outputPath });
    assert.equal(briefs[0].world.length, 1);
    assert.equal(briefs[0].ai.length, 1);
    assert.equal(briefs[0].world[0].sources[0].label, "News");
    assert.equal(briefs[0].ai[0].sources[0].label, "Lab");
    assert.deepEqual(briefs[0].closing, { sleeper: "A synthesis.", oneLiner: "The day." });
    assert.equal(briefs[0].sources.length, 2);
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), briefs);

    await writeFile(file, markdown.replace("## Section 1: World & Market Briefing", "## Special Report: Markets").replace("## Section 2: AI & Agentic Systems Briefing", ""));
    const special = await generateFeed({ root, outputPath });
    assert.equal(special[0].world.length, 0);
    assert.equal(special[0].ai.length, 2);
    assert.equal(special[0].ai[1].sources[0].label, "Lab");

    await writeFile(file, markdown.replace("- [Research — Lab](https://example.com/b)", ""));
    await assert.rejects(generateFeed({ root, outputPath }), /missing from ## Sources/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects citations separated from a story by a divider or heading", async () => {
  const root = await mkdtemp(join(tmpdir(), "morning-download-boundaries-"));
  try {
    const month = join(root, "briefs", "2026-10");
    await mkdir(month, { recursive: true });
    for (const heading of ["## Section 1: World & Market Briefing", "## Special Report: Markets"]) {
      for (const boundary of ["---", "### Context", "### **Context** — Background."]) {
        await writeFile(join(month, "2026-10-21.md"), `${heading}

📈 **Markets** — World analysis.

${boundary}

Sources: [News](https://example.com/a)

## Closing

## Sources

- [News](https://example.com/a)
`);
        await assert.rejects(generateFeed({ root }), /Sources must immediately follow a story/);
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
