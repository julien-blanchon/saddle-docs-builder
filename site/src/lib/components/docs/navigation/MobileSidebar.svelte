<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onDestroy } from 'svelte';
	import DocsSidebar from './DocsSidebar.svelte';
	import { siteConfig } from '$lib/config/site';
	import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
	import Close from 'carbon-icons-svelte/lib/Close.svelte';

	let isOpen = $state(false);
	let isVisible = $state(false);
	const panelId = 'mobile-sidebar-panel';
	const closeButtonId = 'mobile-sidebar-close';

	function open() {
		if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
		isVisible = true;
		requestAnimationFrame(() => {
			isOpen = true;
		});
	}

	function close() {
		isOpen = false;
		if (typeof document !== 'undefined') document.body.style.overflow = '';
	}

	function toggle() {
		isOpen ? close() : open();
	}

	function handleSidebarTransitionEnd(event: TransitionEvent) {
		if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
		if (!isOpen) isVisible = false;
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (!isOpen) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	afterNavigate(() => close());
	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.style.overflow = '';
	});
</script>

<svelte:document onkeydown={handleDocumentKeydown} />

<div
	class="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-1.5 lg:hidden"
>
	<a href="{base}/" class="inline-flex items-center gap-1 px-2 py-2 text-sm tracking-tight text-foreground">
		<span class="font-medium tracking-tight text-foreground">{siteConfig.name}</span>
	</a>
	<button
		onclick={toggle}
		class="-mr-2 inline-flex size-10 items-center justify-center gap-2 rounded-sm text-sm whitespace-nowrap text-foreground transition-colors duration-150 ease-out hover:bg-background-muted lg:hidden"
		aria-label="Toggle menu"
	>
		<Menu size={20} />
	</button>
</div>

{#if isVisible}
	<div
		class="overlay fixed inset-0 z-50 bg-background-inset/80 backdrop-blur-sm lg:hidden"
		class:active={isOpen}
		onclick={close}
		role="presentation"
		aria-hidden="true"
	></div>

	<div
		id={panelId}
		class="sidebar fixed inset-y-0 right-0 z-50 w-3/4 max-w-sm overflow-hidden border-l border-border bg-background-inset text-foreground-muted lg:hidden"
		class:active={isOpen}
		ontransitionend={handleSidebarTransitionEnd}
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		tabindex="-1"
	>
		<div class="absolute top-0 right-0 flex justify-end p-4">
			<button id={closeButtonId} onclick={close} aria-label="Close menu">
				<Close size={32} class="size-6" />
			</button>
		</div>
		<DocsSidebar />
	</div>
{/if}

<style>
	.overlay {
		opacity: 0;
		pointer-events: none;
		transition: opacity 200ms ease-out;
	}
	.overlay.active {
		opacity: 1;
		pointer-events: auto;
	}
	.sidebar {
		transform: translateX(100%);
		transition: transform 200ms ease-out;
	}
	.sidebar.active {
		transform: translateX(0);
	}
</style>
