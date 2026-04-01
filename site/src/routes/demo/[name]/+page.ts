import type { PageLoad, EntryGenerator } from './$types';
import manifest from '$lib/manifest.json';

export const entries: EntryGenerator = () => {
	return (manifest.examples ?? []).map((name: string) => ({ name }));
};

export const load: PageLoad = ({ params }) => {
	return {
		name: params.name,
		title: params.name
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (c: string) => c.toUpperCase())
	};
};
