import manifest from '../manifest.json';

export const siteConfig = {
	name: manifest.name,
	description: manifest.description ?? `Documentation for ${manifest.name}`,
	url: manifest.url ?? 'https://example.github.io',
	author: manifest.author ?? '',
	keywords: [manifest.name, 'bevy', 'rust', 'game', 'crate'],
	links: {
		github: manifest.github ?? '',
		cratesIo: manifest.crates_io ?? ''
	}
};

export type SiteConfig = typeof siteConfig;
