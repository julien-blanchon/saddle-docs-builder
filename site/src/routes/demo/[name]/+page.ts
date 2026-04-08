import type { PageLoad, EntryGenerator } from './$types';
import manifest from '$lib/manifest.json';

export const entries: EntryGenerator = () => {
	const manifestWithExamples = manifest as {
		examples?: string[];
		availableExamples?: string[];
	};

	return (manifestWithExamples.availableExamples ?? manifestWithExamples.examples ?? []).map(
		(name: string) => ({ name })
	);
};

export const load: PageLoad = ({ params }) => {
	return {
		name: params.name,
		title: params.name
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (c: string) => c.toUpperCase())
	};
};
