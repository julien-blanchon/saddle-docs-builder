import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import manifest from '$lib/manifest.json';

function getCrateDir(): string {
	if (process.env.CRATE_DIR) {
		return resolve(process.env.CRATE_DIR);
	}
	if (manifest.crate_dir) {
		return resolve(manifest.crate_dir);
	}
	// Fallback: assume crate is two levels up from site/
	return resolve(process.cwd(), '../..');
}

export async function loadReadme(): Promise<string> {
	const crateDir = getCrateDir();
	const readmePath = join(crateDir, 'README.md');

	if (!existsSync(readmePath)) {
		return '*No README.md found.*';
	}

	let content = await readFile(readmePath, 'utf-8');
	// Strip the first H1 heading (crate name) — the layout already shows it
	content = content.replace(/^#\s+.+\n*/, '');
	return content;
}

export async function loadDoc(slug: string): Promise<{ title: string; body: string }> {
	const crateDir = getCrateDir();
	const docPath = join(crateDir, 'docs', `${slug}.md`);

	if (!existsSync(docPath)) {
		return { title: slug, body: `*Document "${slug}.md" not found.*` };
	}

	const content = await readFile(docPath, 'utf-8');

	// Extract title from first H1 heading, or derive from slug
	const h1Match = content.match(/^#\s+(.+)$/m);
	const title = h1Match
		? h1Match[1].trim()
		: slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	// Strip the first H1 from the body (we render it in the layout)
	const body = h1Match ? content.replace(/^#\s+.+\n*/, '') : content;

	return { title, body };
}
