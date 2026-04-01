<script lang="ts">
	import CopyCodeAction from '$lib/components/docs/CopyCodeAction.svelte';

	const { data } = $props();
</script>

<article data-doc-content class="w-full max-w-4xl">
	{@html data.html}
</article>

<CopyCodeAction />
