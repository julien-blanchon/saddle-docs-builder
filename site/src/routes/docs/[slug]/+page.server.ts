import type { PageServerLoad, EntryGenerator } from './$types';
import { loadDoc } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import manifest from '$lib/manifest.json';

export const entries: EntryGenerator = () => {
	return (manifest.docs ?? []).map((slug: string) => ({ slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const { title, body } = await loadDoc(params.slug);
	const html = await renderMarkdown(body);
	return {
		html,
		title,
		description: `${title} documentation`,
		rawMarkdown: body,
		slug: params.slug
	};
};
