<script lang="ts">
	import {
		DocsSidebar,
		MobileSidebar,
		ScrollArea,
		TableOfContents,
		DocShareActions,
		MobileDocShareActions,
		docsManifest,
		docsUiConfig,
		getDocHref,
		getAdjacentDocs,
		resolveTocSelector,
		resolveRepositoryDocUrl,
		siteConfig
	} from '$lib';
	import DocNavigation from '$lib/components/docs/navigation/DocNavigation.svelte';
	import { page } from '$app/state';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	const { children } = $props();

	const currentPath = $derived(page.url.pathname.replace(/\/+$/, '') || '/');
	const slug = $derived(currentPath.replace(/^\/docs\/?/, ''));

	const adjacent = $derived(getAdjacentDocs(`docs/${slug}`));

	const previousLink = $derived(
		adjacent.previous ? { title: adjacent.previous.name, href: getDocHref(adjacent.previous.slug) } : null
	);
	const nextLink = $derived(
		adjacent.next ? { title: adjacent.next.name, href: getDocHref(adjacent.next.slug) } : null
	);

	const currentDoc = $derived(docsManifest.find((d) => d.slug === `docs/${slug}`));
	const docTitle = $derived(page.data?.title || currentDoc?.name || 'Documentation');
	const docDescription = $derived(page.data?.description || '');
	const rawMarkdown = $derived(page.data?.rawMarkdown || null);

	// GitHub URL for "Open in GitHub" — points to the doc file in the crate's docs/ folder
	const githubUrl = $derived(
		siteConfig.links.github && slug
			? resolveRepositoryDocUrl(siteConfig.links.github, `/docs/${slug}.md`)
			: null
	);

	// Raw URL for AI assistant links
	const rawUrl = $derived(
		typeof window !== 'undefined' ? window.location.href : null
	);

	const showDocActions = $derived(docsUiConfig.docActions.enabled);
	const showToc = $derived(docsUiConfig.toc.enabled);
	const tocSelector = $derived(resolveTocSelector(slug));

	// Scroll position management
	const scrollContainerId = 'docs-content-container';
	const scrollPositions = new SvelteMap<string, number>();
	let hashFallbackTimer: ReturnType<typeof setTimeout> | null = null;

	function clearHashFallbackTimer() {
		if (hashFallbackTimer) {
			clearTimeout(hashFallbackTimer);
			hashFallbackTimer = null;
		}
	}

	function scrollToHash(hash: string) {
		if (!hash) return;
		const id = hash.substring(1);

		const scrollToElement = () => {
			const element = document.getElementById(id);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				return true;
			}
			return false;
		};

		clearHashFallbackTimer();
		tick().then(() => {
			if (!scrollToElement()) {
				hashFallbackTimer = setTimeout(scrollToElement, 100);
			}
		});
	}

	beforeNavigate(() => {
		const elem = document.getElementById(scrollContainerId);
		if (elem) {
			scrollPositions.set(page.url.pathname, elem.scrollTop);
		}
	});

	afterNavigate((nav) => {
		const elem = document.getElementById(scrollContainerId);
		if (elem && !page.url.hash) {
			if (nav.type === 'popstate') {
				const saved = scrollPositions.get(page.url.pathname);
				if (saved !== undefined) {
					elem.scrollTop = saved;
				}
			} else {
				elem.scrollTop = 0;
			}
		}

		if (page.url.hash) {
			scrollToHash(page.url.hash);
		}
	});

	onMount(() => {
		const handleHashChange = () => {
			scrollToHash(window.location.hash);
		};

		window.addEventListener('hashchange', handleHashChange);
		handleHashChange();

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
			clearHashFallbackTimer();
		};
	});
</script>

<svelte:head>
	<title>{docTitle} - {siteConfig.name}</title>
	{#if docDescription}
		<meta name="description" content={docDescription} />
	{/if}
</svelte:head>

<main class="relative h-dvh bg-background text-foreground">
	<MobileSidebar />

	<div
		class="flex h-full w-full min-w-0 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:pr-4 xl:grid-cols-[22rem_minmax(0,56rem)_18rem] xl:justify-center"
	>
		<div class="hidden lg:block">
			<DocsSidebar />
		</div>

		<div class="inset-shadow relative mx-auto h-full w-full max-w-4xl min-w-0 overflow-hidden border border-border bg-background-inset pt-12 lg:my-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-visible lg:rounded-xl lg:pt-0">
			<ScrollArea
				mode="vertical"
				id="docs-content-container"
				class="mx-auto h-full w-full lg:max-h-[calc(100dvh-2rem)]"
				viewportClass="rounded-lg overscroll-none flex flex-col gap-8 px-4 py-8 lg:px-8"
				viewportStyle="mask-image: linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent);"
			>
				<section class="min-w-0 flex-1 space-y-8">
					<div class="space-y-4">
						{#if currentDoc?.category}
							<p class="mb-2 text-sm font-medium tracking-normal text-foreground-muted/70 capitalize">
								{currentDoc.category}
							</p>
						{/if}
						<h1 class="scroll-m-20 text-3xl font-medium tracking-tight text-foreground">
							{docTitle}
						</h1>
						{#if docDescription}
							<p class="max-w-4xl text-base font-normal tracking-normal text-foreground-muted">
								{docDescription}
							</p>
						{/if}

						{#if showDocActions}
							<MobileDocShareActions {rawMarkdown} {rawUrl} {githubUrl} />
						{/if}
					</div>
					<hr class="text-border" />

					<div>
						{@render children()}
						<DocNavigation previous={previousLink} next={nextLink} />
					</div>
				</section>
			</ScrollArea>
		</div>

		<aside
			class="hidden xl:block xl:w-full xl:py-8 xl:pr-4 xl:pl-4"
			aria-label="Table of contents and document actions"
		>
			<div class="sticky top-8 flex h-full max-h-[calc(100dvh-4rem)] min-h-0 flex-col">
				{#if showToc}
					<div class="min-h-0 flex-1">
						<TableOfContents
							selector={tocSelector}
							title={docsUiConfig.toc.title}
							emptyLabel={docsUiConfig.toc.emptyLabel}
							minViewportWidth={docsUiConfig.toc.minViewportWidth}
						/>
					</div>
				{/if}
				{#if showDocActions}
					<DocShareActions {rawMarkdown} {rawUrl} {githubUrl} />
				{/if}
			</div>
		</aside>
	</div>
</main>
