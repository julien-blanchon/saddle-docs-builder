export { default as DocNavigation } from './components/docs/navigation/DocNavigation.svelte';
export { default as DocsSidebar } from './components/docs/navigation/DocsSidebar.svelte';
export { default as MobileSidebar } from './components/docs/navigation/MobileSidebar.svelte';
export { default as ScrollArea } from './components/ui/ScrollArea.svelte';
export { default as TableOfContents } from './components/docs/TableOfContents.svelte';
export { default as DocShareActions } from './components/docs/DocShareActions.svelte';
export { default as MobileDocShareActions } from './components/docs/MobileDocShareActions.svelte';
export { default as CommandPalette } from './components/docs/search/CommandPalette.svelte';
export { default as SearchTrigger } from './components/docs/search/SearchTrigger.svelte';

export { siteConfig, type SiteConfig } from './config/site';
export {
	docsUiConfig,
	type DocsUiConfig,
	resolveTocSelector,
	resolveDocAssistantUrls,
	resolveRepositoryDocUrl
} from './config/docs-ui';

export { docsManifest, getAdjacentDocs, getDocBySlug, getDocHref } from './docs/manifest';
