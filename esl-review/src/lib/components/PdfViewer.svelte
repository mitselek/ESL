<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { calcFitScale, loadPdf, renderPage } from './pdf-viewer.js';

	let {
		url,
		height = '60vh',
		syncRatio = undefined,
		onScroll = undefined,
		active = undefined,
		onActivate = undefined,
	}: {
		url: string;
		height?: string;
		syncRatio?: number | undefined;
		onScroll?: ((ratio: number) => void) | undefined;
		active?: boolean | undefined;
		onActivate?: (() => void) | undefined;
	} = $props();

	let pdfjsLib: typeof import('pdfjs-dist') | null = $state(null);
	let pdfDoc: import('pdfjs-dist').PDFDocumentProxy | null = $state(null);
	let totalPages = $state(0);
	let scale = $state(1);
	let loading = $state(true);
	let errorMsg = $state('');
	let containerEl: HTMLDivElement | undefined = $state(undefined);
	let generation = 0;
	let nativeViewportWidth = $state(0); // unscaled page width from PDF
	let containerHeight = $state(0); // track container resize for syncRatio re-trigger

	// Track rendered pages to avoid re-rendering
	const renderedPages = new Set<number>();
	const renderingPages = new Set<number>();

	onMount(async () => {
		const pdfjs = await import('pdfjs-dist');
		pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
		pdfjsLib = pdfjs;
	});

	// Load PDF when pdfjsLib or url changes
	$effect(() => {
		if (!pdfjsLib || !url) return;
		const lib = pdfjsLib;
		const currentUrl = url;
		const gen = ++generation;

		loading = true;
		errorMsg = '';
		pdfDoc = null;
		totalPages = 0;
		pageWidth = 0;
		pageHeight = 0;
		renderedPages.clear();
		renderingPages.clear();

		const controller = new AbortController();

		loadPdf(lib, currentUrl, controller.signal)
			.then(async (doc) => {
				if (gen !== generation) {
					doc.destroy();
					return;
				}
				pdfDoc = doc;
				totalPages = doc.numPages;

				// Store native viewport width for resize recalculation
				const page1 = await doc.getPage(1);
				const vp = page1.getViewport({ scale: 1 });
				nativeViewportWidth = vp.width;

				if (containerEl) {
					scale = calcFitScale(vp.width, containerEl.clientWidth - 16);
				}

				loading = false;
			})
			.catch((err) => {
				if (gen !== generation) return;
				errorMsg = err?.message ?? 'PDF laadimine ebaõnnestus';
				loading = false;
			});

		return () => {
			controller.abort();
		};
	});

	// ResizeObserver — recalculate fit-width on container resize
	$effect(() => {
		if (!containerEl || !browser) return;
		const el = containerEl;

		const ro = new ResizeObserver(() => {
			containerHeight = el.clientHeight;
			if (nativeViewportWidth > 0) {
				const newScale = calcFitScale(nativeViewportWidth, el.clientWidth - 16);
				if (Math.abs(newScale - scale) > 0.01) {
					renderedPages.clear();
					renderingPages.clear();
					scale = newScale;
				}
			}
		});

		ro.observe(el);
		return () => ro.disconnect();
	});

	// Set up IntersectionObserver after pages are rendered
	$effect(() => {
		if (!containerEl || totalPages === 0 || !pdfDoc) return;
		const doc = pdfDoc;
		const currentScale = scale;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const pageNum = Number(entry.target.getAttribute('data-page'));
					if (entry.isIntersecting && !renderedPages.has(pageNum) && !renderingPages.has(pageNum)) {
						renderingPages.add(pageNum);
						const canvas = entry.target.querySelector('canvas');
						if (canvas) {
							renderPage(doc, pageNum, canvas, currentScale).then(() => {
								renderedPages.add(pageNum);
								renderingPages.delete(pageNum);
							});
						}
					}
				}
			},
			{
				root: containerEl,
				rootMargin: '200px 0px',
				threshold: [0, 0.25, 0.5],
			}
		);

		const wrappers = containerEl.querySelectorAll('[data-page]');
		wrappers.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});

	// Scroll handler — emit ratio
	let ignoreNextScroll = false;

	function handleScroll() {
		if (!containerEl || ignoreNextScroll) {
			ignoreNextScroll = false;
			return;
		}
		const maxScroll = containerEl.scrollHeight - containerEl.clientHeight;
		if (maxScroll <= 0) return;
		const ratio = containerEl.scrollTop / maxScroll;
		onScroll?.(ratio);
	}

	// React to syncRatio changes — set scrollTop proportionally
	// Re-triggers on: syncRatio change, new PDF loaded (pageHeight), container resize (containerHeight)
	$effect(() => {
		if (syncRatio == null || !containerEl || totalPages === 0 || pageHeight === 0) return;
		const r = syncRatio;
		const _ph = pageHeight; // track: re-trigger after new PDF dimensions are ready
		const _ch = containerHeight; // track: re-trigger when container resizes (review panel appears/disappears)
		// Double RAF: wait for DOM to fully stabilize after layout changes
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (!containerEl) return;
				const maxScroll = containerEl.scrollHeight - containerEl.clientHeight;
				if (maxScroll <= 0) return;
				const targetTop = r * maxScroll;
				if (Math.abs(containerEl.scrollTop - targetTop) > 2) {
					ignoreNextScroll = true;
					containerEl.scrollTop = targetTop;
				}
			});
		});
	});

	// Page dimensions (from first page, applied to all)
	let pageWidth = $state(0);
	let pageHeight = $state(0);

	$effect(() => {
		if (!pdfDoc || scale <= 0) return;
		const doc = pdfDoc;
		const s = scale;
		doc.getPage(1).then((page) => {
			const vp = page.getViewport({ scale: s });
			pageWidth = Math.floor(vp.width);
			pageHeight = Math.floor(vp.height);
		});
	});

	// Keyboard navigation — snap to page top/bottom
	let hovered = $state(false);

	const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);

	function navigateSnap(direction: 'ArrowDown' | 'ArrowUp') {
		if (!containerEl || totalPages === 0) return;

		const vh = containerEl.clientHeight;
		const scrollTop = containerEl.scrollTop;
		const maxScroll = containerEl.scrollHeight - vh;
		const threshold = 5;

		const wrappers = containerEl.querySelectorAll<HTMLElement>('[data-page]');
		const snaps: number[] = [];

		for (const el of wrappers) {
			snaps.push(el.offsetTop);
			const bottomSnap = el.offsetTop + el.offsetHeight - vh;
			if (bottomSnap > el.offsetTop + threshold) {
				snaps.push(bottomSnap);
			}
		}

		if (direction === 'ArrowDown') {
			const target = snaps.find((s) => s > scrollTop + threshold);
			if (target != null) {
				containerEl.scrollTo({ top: Math.min(target, maxScroll), behavior: 'smooth' });
			}
		} else {
			for (let i = snaps.length - 1; i >= 0; i--) {
				if (snaps[i] < scrollTop - threshold) {
					containerEl.scrollTo({ top: Math.max(snaps[i], 0), behavior: 'smooth' });
					break;
				}
			}
		}
	}

	function navigatePage(direction: 'PageDown' | 'PageUp') {
		if (!containerEl || totalPages === 0) return;

		const scrollTop = containerEl.scrollTop;
		const maxScroll = containerEl.scrollHeight - containerEl.clientHeight;
		const threshold = 5;

		// Find page wrapper whose top is nearest to current scrollTop
		const wrappers = containerEl.querySelectorAll<HTMLElement>('[data-page]');
		let currentIdx = 0;
		for (let i = 0; i < wrappers.length; i++) {
			if (wrappers[i].offsetTop <= scrollTop + threshold) currentIdx = i;
			else break;
		}

		const targetIdx = direction === 'PageDown'
			? Math.min(currentIdx + 1, wrappers.length - 1)
			: Math.max(currentIdx - 1, 0);

		const target = wrappers[targetIdx].offsetTop;
		if (Math.abs(target - scrollTop) < threshold && direction === 'PageDown' && targetIdx < wrappers.length - 1) {
			// Already at this page top — skip to next
			containerEl.scrollTo({ top: Math.min(wrappers[targetIdx + 1].offsetTop, maxScroll), behavior: 'smooth' });
		} else {
			containerEl.scrollTo({ top: Math.min(target, maxScroll), behavior: 'smooth' });
		}
	}

	function navigateEdge(edge: 'Home' | 'End') {
		if (!containerEl) return;
		const maxScroll = containerEl.scrollHeight - containerEl.clientHeight;
		containerEl.scrollTo({ top: edge === 'Home' ? 0 : maxScroll, behavior: 'smooth' });
	}

	function dispatchKey(key: string) {
		if (key === 'ArrowDown' || key === 'ArrowUp') navigateSnap(key);
		else if (key === 'PageDown' || key === 'PageUp') navigatePage(key);
		else if (key === 'Home' || key === 'End') navigateEdge(key);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!NAV_KEYS.has(e.key)) return;
		e.preventDefault();
		dispatchKey(e.key);
	}

	// Window-level keydown — when active prop is set, use it; otherwise fall back to hover
	const useWindowKeys = $derived(active !== undefined ? !!active : hovered);

	$effect(() => {
		if (!browser || !useWindowKeys) return;
		function onWindowKey(e: KeyboardEvent) {
			if (!NAV_KEYS.has(e.key)) return;
			e.preventDefault();
			dispatchKey(e.key);
		}
		window.addEventListener('keydown', onWindowKey);
		return () => window.removeEventListener('keydown', onWindowKey);
	});

	const pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
</script>

<div
	bind:this={containerEl}
	tabindex="0"
	class="pdf-container"
	style="height: {height};"
	onscroll={handleScroll}
	onkeydown={handleKeydown}
	onmouseenter={() => { hovered = true; onActivate?.(); }}
	onmouseleave={() => { hovered = false; }}
>
	{#if !browser || loading}
		<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #888; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
			Laen PDF-i&hellip;
		</div>
	{:else if errorMsg}
		<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #E76F51; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
			{errorMsg}
		</div>
	{:else}
		{#each pages as pageNum}
			<div
				data-page={pageNum}
				style="width: {pageWidth}px; height: {pageHeight}px; margin: 8px auto; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);"
			>
				<canvas></canvas>
			</div>
		{/each}
	{/if}
</div>

<style>
	.pdf-container {
		overflow-y: auto;
		border: 1px solid #E8DDD0;
		border-radius: 6px;
		background: #f5f0e8;
		position: relative;
		outline: none;
	}
	.pdf-container:focus-visible {
		border-color: #C9A96E;
	}
</style>
