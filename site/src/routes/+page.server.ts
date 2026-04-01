import { loadReadme } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';

export async function load() {
	const readme = await loadReadme();
	const html = await renderMarkdown(readme);
	return { html, rawMarkdown: readme };
}
