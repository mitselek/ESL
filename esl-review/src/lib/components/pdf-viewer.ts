import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Calculate fit-width scale for a PDF page viewport.
 */
export function calcFitScale(viewportWidth: number, containerWidth: number): number {
	if (viewportWidth <= 0) return 1;
	return containerWidth / viewportWidth;
}

/**
 * Load a PDF document. Must only be called in the browser.
 */
export async function loadPdf(
	pdfjsLib: typeof import('pdfjs-dist'),
	url: string,
	signal?: AbortSignal
): Promise<PDFDocumentProxy> {
	const loadingTask = pdfjsLib.getDocument(url);

	if (signal) {
		signal.addEventListener('abort', () => loadingTask.destroy(), { once: true });
	}

	return loadingTask.promise;
}

/**
 * Render a single page onto a canvas at the given scale.
 */
export async function renderPage(
	pdfDoc: PDFDocumentProxy,
	pageNum: number,
	canvas: HTMLCanvasElement,
	scale: number
): Promise<void> {
	const page = await pdfDoc.getPage(pageNum);
	const viewport = page.getViewport({ scale });

	const dpr = window.devicePixelRatio || 1;
	canvas.width = Math.floor(viewport.width * dpr);
	canvas.height = Math.floor(viewport.height * dpr);
	canvas.style.width = `${Math.floor(viewport.width)}px`;
	canvas.style.height = `${Math.floor(viewport.height)}px`;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(dpr, dpr);
	await page.render({ canvasContext: ctx, viewport }).promise;
}
