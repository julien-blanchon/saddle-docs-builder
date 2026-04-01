<script lang="ts">
	import {
		DocsSidebar,
		MobileSidebar,
		siteConfig
	} from '$lib';
	import { cn } from '$lib/utils/cn';
	import Maximize from 'carbon-icons-svelte/lib/Maximize.svelte';
	import Minimize from 'carbon-icons-svelte/lib/Minimize.svelte';

	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import WarningAlt from 'carbon-icons-svelte/lib/WarningAlt.svelte';

	const { data } = $props();
	const demoSrc = $derived(`/demos/${data.name}/index.html`);

	// Native canvas resolution — Bevy renders at this fixed size
	const NATIVE_W = 1440;
	const NATIVE_H = 900;

	let isFullscreen = $state(false);
	let demoAvailable = $state<boolean | null>(null);
	let currentCheck = 0;

	// Container measurement for scale-to-fit
	let containerEl = $state<HTMLDivElement | null>(null);
	let containerW = $state(0);
	let containerH = $state(0);

	const scale = $derived(
		containerW > 0 && containerH > 0
			? Math.min(containerW / NATIVE_W, containerH / NATIVE_H)
			: 1
	);
	const scaledW = $derived(NATIVE_W * scale);
	const scaledH = $derived(NATIVE_H * scale);

	async function checkDemo(src: string) {
		const thisCheck = ++currentCheck;
		demoAvailable = null;
		try {
			const res = await fetch(src, { method: 'HEAD' });
			if (thisCheck === currentCheck) demoAvailable = res.ok;
		} catch {
			if (thisCheck === currentCheck) demoAvailable = false;
		}
	}

	$effect(() => {
		checkDemo(`/demos/${data.name}/index.html`);
	});

	onMount(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerW = entry.contentRect.width;
				containerH = entry.contentRect.height;
			}
		});
		ro.observe(containerEl);
		return () => ro.disconnect();
	});

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
</script>

<svelte:head>
	<title>{data.title} Demo - {siteConfig.name}</title>
</svelte:head>

{#if isFullscreen}
	<div class="fixed inset-0 z-50 bg-black">
		<button
			onclick={toggleFullscreen}
			class="absolute top-4 right-4 z-60 flex size-10 items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
			aria-label="Exit fullscreen"
		>
			<Minimize size={20} />
		</button>
		<iframe
			src={demoSrc}
			title="{data.title} demo"
			class="h-full w-full border-0"
			allow="autoplay; fullscreen"
		></iframe>
	</div>
{:else}
	<main class="relative h-dvh bg-background text-foreground">
		<MobileSidebar />

		<div class="flex h-full w-full min-w-0 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:pr-4">
			<div class="hidden lg:block">
				<DocsSidebar />
			</div>

			<div class="inset-shadow relative mx-auto h-full w-full min-w-0 overflow-hidden border border-border bg-background-inset pt-12 lg:my-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-visible lg:rounded-xl lg:pt-0">
				<div class="flex h-full flex-col">
					<div class="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
						<div>
							<h1 class="text-lg font-medium tracking-tight text-foreground">
								{data.title}
							</h1>
							<p class="text-sm text-foreground-muted">Interactive WASM demo</p>
						</div>
						<button
							onclick={toggleFullscreen}
							class="inset-shadow flex size-8 items-center justify-center rounded-sm bg-background-inset text-foreground transition-colors hover:bg-background-muted"
							aria-label="Enter fullscreen"
						>
							<Maximize size={16} />
						</button>
					</div>

					<div
						class="flex flex-1 items-center justify-center overflow-hidden bg-black"
						bind:this={containerEl}
					>
						{#key data.name}
							{#if demoAvailable === null}
								<div class="flex h-full items-center justify-center text-white/40">
									<p class="text-sm">Loading demo...</p>
								</div>
							{:else if demoAvailable}
								<div
									class="relative overflow-hidden"
									style="width: {scaledW}px; height: {scaledH}px;"
								>
									<iframe
										src={demoSrc}
										title="{data.title} demo"
										class="absolute top-0 left-0 border-0"
										style="width: {NATIVE_W}px; height: {NATIVE_H}px; transform: scale({scale}); transform-origin: 0 0;"
										allow="autoplay; fullscreen"
									></iframe>
								</div>
							{:else}
								<div class="flex h-full flex-col items-center justify-center gap-4 text-white/60">
									<WarningAlt size={48} />
									<p class="text-lg font-medium">Demo not built yet</p>
									<p class="max-w-md text-center text-sm text-white/40">
										Run the build script with WASM enabled to compile this demo:<br />
										<code class="mt-2 inline-block rounded bg-white/10 px-3 py-1.5 font-mono text-xs text-white/70">
											bash build.sh --crate-dir &lt;path&gt;
										</code>
									</p>
								</div>
							{/if}
						{/key}
					</div>
				</div>
			</div>
		</div>
	</main>
{/if}
