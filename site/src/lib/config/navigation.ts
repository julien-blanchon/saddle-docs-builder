import type { DocItem } from '$lib/types/doc';
import manifest from '../manifest.json';

/**
 * Auto-generated navigation tree from manifest.json.
 * The build script populates manifest.json with docs and examples discovered from the crate.
 */
function buildNavigation(): DocItem[] {
	const nav: DocItem[] = [];
	const manifestWithExamples = manifest as {
		examples?: string[];
		availableExamples?: string[];
	};
	const demoNames: string[] =
		manifestWithExamples.availableExamples ?? manifestWithExamples.examples ?? [];

	// Home page (README)
	nav.push({
		slug: '',
		name: 'Overview'
	});

	// Documentation pages from docs/*.md
	if (manifest.docs && manifest.docs.length > 0) {
		const docItems: DocItem[] = manifest.docs.map((doc: string) => ({
			slug: `docs/${doc}`,
			name: doc
				.replace(/[-_]/g, ' ')
				.replace(/\b\w/g, (c: string) => c.toUpperCase())
		}));

		nav.push({
			slug: 'docs',
			name: 'Documentation',
			items: docItems
		});
	}

	// Demo pages from examples
	if (demoNames.length > 0) {
		const demoItems: DocItem[] = demoNames.map((example: string) => ({
			slug: `demo/${example}`,
			name: example
				.replace(/[-_]/g, ' ')
				.replace(/\b\w/g, (c: string) => c.toUpperCase())
		}));

		nav.push({
			slug: 'demo',
			name: 'Demos',
			items: demoItems
		});
	}

	return nav;
}

export const docsNavigation: DocItem[] = buildNavigation();
