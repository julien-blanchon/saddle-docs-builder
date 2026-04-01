<script lang="ts">
	import './layout.css';
	import { siteConfig, docsUiConfig } from '$lib';
	import CommandPalette from '$lib/components/docs/search/CommandPalette.svelte';

	const { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#ffffff" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<title>{siteConfig.name}</title>
	<meta name="description" content={siteConfig.description} />
</svelte:head>

{@render children()}

{#if docsUiConfig.search.enabled}
	<CommandPalette />
{/if}
