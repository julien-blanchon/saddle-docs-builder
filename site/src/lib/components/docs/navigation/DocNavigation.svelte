<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { docsUiConfig } from '$lib/config/docs-ui';

	export type DocNavLink = {
		title: string;
		href: string;
	};

	const props = $props<{
		previous?: DocNavLink | null;
		next?: DocNavLink | null;
	}>();
	const previous = $derived(props.previous ?? null);
	const next = $derived(props.next ?? null);
</script>

{#if docsUiConfig.pagination.enabled && (previous || next)}
	<nav class="relative mt-16 border-t border-border pt-9" aria-label="Documentation pagination">
		<div class="grid gap-4 sm:grid-cols-2">
			{#if previous}
				<div class="group inset-shadow rounded-lg bg-background-inset p-1.5">
					<a
						href={previous.href}
						class="group card relative flex flex-col rounded-md bg-background px-4 py-3 transition-[background-color] duration-150 ease-out hover:bg-background-muted"
					>
						<span class="text-xs font-normal tracking-wide text-foreground-muted/70 uppercase">
							{docsUiConfig.pagination.previousLabel}
						</span>
						<span class="text-lg font-medium tracking-tight text-foreground">
							{previous.title}
						</span>
					</a>
				</div>
			{/if}

			{#if next}
				<div class={cn('group inset-shadow rounded-lg bg-background-inset p-1.5 sm:text-right', !previous && 'sm:col-start-2')}>
					<a
						href={next.href}
						class="group card relative flex flex-col rounded-md bg-background px-4 py-3 transition-[background-color] duration-150 ease-out hover:bg-background-muted"
					>
						<span class="text-xs font-normal tracking-wide text-foreground-muted/70 uppercase">
							{docsUiConfig.pagination.nextLabel}
						</span>
						<span class="text-lg font-medium tracking-tight text-foreground">
							{next.title}
						</span>
					</a>
				</div>
			{/if}
		</div>
	</nav>
{/if}
