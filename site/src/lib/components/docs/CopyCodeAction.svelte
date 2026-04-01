<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	function injectCopyButtons() {
		if (!browser) return;

		document.querySelectorAll('[data-doc-content] .code-block[data-code]').forEach((block) => {
			if (block.querySelector('.copy-btn')) return;

			const code = block.getAttribute('data-code')
				?.replace(/&amp;/g, '&')
				?.replace(/&quot;/g, '"')
				?.replace(/&lt;/g, '<')
				?.replace(/&gt;/g, '>') ?? '';

			const btn = document.createElement('button');
			btn.className = 'copy-btn';
			btn.setAttribute('aria-label', 'Copy code');
			btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z"/><path d="M4 18H2V4a2 2 0 0 1 2-2h14v2H4z"/></svg>`;

			btn.addEventListener('click', async () => {
				try {
					await navigator.clipboard.writeText(code);
					btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M13 24l-9-9 1.41-1.41L13 21.17 26.59 7.59 28 9 13 24z"/></svg>`;
					setTimeout(() => {
						btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z"/><path d="M4 18H2V4a2 2 0 0 1 2-2h14v2H4z"/></svg>`;
					}, 2000);
				} catch { /* clipboard not available */ }
			});

			block.style.position = 'relative';
			block.appendChild(btn);
		});
	}

	onMount(() => {
		// Inject on mount and after any navigation
		injectCopyButtons();
		const observer = new MutationObserver(injectCopyButtons);
		const target = document.querySelector('[data-doc-content]');
		if (target) observer.observe(target, { childList: true, subtree: true });
		return () => observer.disconnect();
	});
</script>
