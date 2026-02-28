<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { calcFitScale, loadPdf, renderPage } from './pdf-viewer.js';

	let {
		url,
		height = '60vh',
		syncToPage = undefined,
		onPageChange = undefined,
	}: {
		url: string;
		height?: string;
		syncToPage?: number | undefined;
		onPageChange?: ((page: number) => void) | undefined;
	} = $props();

	let pdfjsLib: typeof import('pdfjs-dist') | null = $state(null);
	let pdfDoc: import('pdfjs-dist').PDFDocumentProxy | null = $state(null);
	let totalPages = $state(0);
	let currentPage = $state(1);
	let scale = $state(1);
	let loading = $state(true);
	let errorMsg = $state('');
	let containerEl: HTMLDivElement | undefined = $state(undefined);
	let generation = 0;

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
		currentPage = 1;
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

				// Calculate fit-width scale from first page
				const page1 = await doc.getPage(1);
				const vp = page1.getViewport({ scale: 1 });
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

				// Update current page (topmost visible)
				updateCurrentPage();
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

	function updateCurrentPage() {
		if (!containerEl) return;
		const wrappers = containerEl.querySelectorAll('[data-page]');
		const containerRect = containerEl.getBoundingClientRect();
		const containerMid = containerRect.top + containerRect.height / 2;

		let best = 1;
		for (const wrapper of wrappers) {
			const rect = wrapper.getBoundingClientRect();
			if (rect.top <= containerMid && rect.bottom > containerRect.top) {
				best = Number(wrapper.getAttribute('data-page'));
			}
		}

		if (best !== currentPage) {
			currentPage = best;
			onPageChange?.(best);
		}
	}

	// React to syncToPage changes
	$effect(() => {
		if (syncToPage == null || syncToPage === currentPage || !containerEl) return;
		const target = containerEl.querySelector(`[data-page="${syncToPage}"]`);
		if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
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

	const pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));
</script>

{#if !browser}
	<div
		style="height: {height}; border: 1px solid #E8DDD0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #f5f0e8; color: #888; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;"
	>
		Laen PDF-i&hellip;
	</div>
{:else if loading}
	<div
		style="height: {height}; border: 1px solid #E8DDD0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #f5f0e8; color: #888; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;"
	>
		Laen PDF-i&hellip;
	</div>
{:else if errorMsg}
	<div
		style="height: {height}; border: 1px solid #E8DDD0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #f5f0e8; color: #E76F51; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;"
	>
		{errorMsg}
	</div>
{:else}
	<div
		bind:this={containerEl}
		style="height: {height}; overflow-y: auto; border: 1px solid #E8DDD0; border-radius: 6px; background: #f5f0e8;"
		onscroll={updateCurrentPage}
	>
		{#each pages as pageNum}
			<div
				data-page={pageNum}
				style="width: {pageWidth}px; height: {pageHeight}px; margin: 8px auto; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);"
			>
				<canvas></canvas>
			</div>
		{/each}
	</div>
{/if}
