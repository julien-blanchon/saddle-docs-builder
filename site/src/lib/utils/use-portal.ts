import { tick } from 'svelte';

export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
	let targetEl: HTMLElement | null;

	async function update(newTarget: string | HTMLElement) {
		target = newTarget;
		if (typeof target === 'string') {
			targetEl = document.querySelector(target);
			if (targetEl === null) {
				await tick();
				targetEl = document.querySelector(target);
			}
			if (targetEl === null) {
				targetEl = document.body;
			}
		} else if (target instanceof HTMLElement) {
			targetEl = target;
		} else {
			throw new Error(`Unknown portal target type: ${target === null ? 'null' : typeof target}.`);
		}
		targetEl.appendChild(node);
	}

	function destroy() {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	update(target);

	return {
		update,
		destroy
	};
}
