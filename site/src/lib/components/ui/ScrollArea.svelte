<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		id?: string;
		children?: Snippet;
		style?: string;
		viewportClass?: string;
		viewportStyle?: string;
		mode?: 'vertical' | 'horizontal' | 'both';
		thumbTabbable?: boolean;
	};

	let {
		class: className,
		id,
		children,
		style,
		viewportClass,
		viewportStyle,
		mode = 'vertical',
		thumbTabbable = true
	}: Props = $props();

	const viewportOverflowClass = $derived.by(() => {
		if (mode === 'horizontal') return 'overflow-x-auto overflow-y-hidden';
		if (mode === 'both') return 'overflow-auto';
		return 'overflow-x-hidden overflow-y-auto';
	});
</script>

<div class={cn('relative flex flex-col overflow-hidden', className)} {style}>
	<div
		{id}
		class={cn('scrollbar-hide min-h-0 w-full flex-1', viewportOverflowClass, viewportClass)}
		style={viewportStyle}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.scrollbar-hide {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
