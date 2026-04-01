/// <reference types="@sveltejs/kit" />

declare module '*.svg?raw' {
	const content: string;
	export default content;
}

declare module '*.svx' {
	import type { SvelteComponent } from 'svelte';
	const component: typeof SvelteComponent;
	export default component;
	export const metadata: Record<string, string>;
}
