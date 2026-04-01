<script lang="ts">
	import {
		DocsSidebar,
		MobileSidebar,
		ScrollArea,
		TableOfContents,
		DocShareActions,
		MobileDocShareActions,
		docsUiConfig,
		getDocHref,
		getAdjacentDocs,
		resolveTocSelector,
		siteConfig
	} from '$lib';
	import DocNavigation from '$lib/components/docs/navigation/DocNavigation.svelte';
	import CopyCodeAction from '$lib/components/docs/CopyCodeAction.svelte';

	const { data } = $props();

	const { next } = getAdjacentDocs('');
	const nextLink = next ? { title: next.name, href: getDocHref(next.slug) } : null;

	const rawMarkdown = $derived(data.rawMarkdown || null);
	const rawUrl = $derived(
		typeof window !== 'undefined' ? window.location.href : null
	);
	const githubUrl = $derived(
		siteConfig.links.github ? `${siteConfig.links.github}/blob/main/README.md` : null
	);

	const showDocActions = $derived(docsUiConfig.docActions.enabled);
	const showToc = $derived(docsUiConfig.toc.enabled);
	const tocSelector = $derived(resolveTocSelector());
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
</svelte:head>

<main class="relative h-dvh bg-background text-foreground">
	<MobileSidebar />

	<div class="flex h-full w-full min-w-0 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:pr-4 xl:grid-cols-[22rem_minmax(0,56rem)_18rem] xl:justify-center">
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
						<h1 class="scroll-m-20 text-3xl font-medium tracking-tight text-foreground">
							{siteConfig.name}
						</h1>
						<p class="max-w-4xl text-base font-normal tracking-normal text-foreground-muted">
							{siteConfig.description}
						</p>

						{#if showDocActions}
							<MobileDocShareActions {rawMarkdown} {rawUrl} {githubUrl} />
						{/if}
					</div>
					<hr class="text-border" />

					<article data-doc-content class="w-full max-w-4xl">
						{@html data.html}
					</article>

					<DocNavigation previous={null} next={nextLink} />
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

<CopyCodeAction />
