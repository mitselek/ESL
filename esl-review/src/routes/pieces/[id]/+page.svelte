<script lang="ts">
	import type { ReviewEntry } from '$lib/server/api/review-get';

	let { data } = $props();
	const piece = $derived(data.piece);
	const user = $derived(data.user);
	const users = $derived(data.users ?? []);

	const isTypesetter = $derived(user && piece.typesetter?.id === user.id);
	const isReviewer = $derived(user && piece.reviewer?.id === user.id);

	const STATUS_COLORS: Record<string, string> = {
		'teos': '#ADB5BD', 'lähtefail': '#ADB5BD',
		'küljenduses': '#E9C46A', 'korrektuuris': '#E9C46A',
		'kontrollitud': '#E76F51', 'paranduses': '#E76F51',
		'kinnitatud': '#52B788', 'publitseeritud': '#2D6A4F',
	};

	const VERDICTS = ['õige', 'viga', 'ettepanek'] as const;
	type Verdict = typeof VERDICTS[number] | null;

	// Review entries: key = param_id:voice_part_id (null → 'whole')
	type EntryState = { verdict: Verdict; remarks: string };
	let entries = $state<Record<string, EntryState>>({});
	const initialReviewId: string | null = data.activeReview?.id ?? null;
	let activeReviewId = $state<string | null>(initialReviewId);

	// Laadi olemasolevad entry-d
	$effect(() => {
		if (!data.activeReview) return;
		const map: Record<string, EntryState> = {};
		for (const e of data.activeReview.entries) {
			const key = `${e.param_id}:${e.voice_part_id ?? 'whole'}`;
			const remarks = Array.isArray(e.remarks)
				? (e.remarks as { text: string }[]).map(r => r.text).join('\n')
				: '';
			map[key] = { verdict: e.verdict as Verdict, remarks };
		}
		entries = map;
	});

	const perVoiceParams = $derived(
		piece.piece_params.filter(p => p.scope === 'per_voice' && p.is_active)
			.sort((a, b) => a.sort_order - b.sort_order)
	);
	const wholePieceParams = $derived(
		piece.piece_params.filter(p => p.scope === 'whole_piece' && p.is_active)
			.sort((a, b) => a.sort_order - b.sort_order)
	);

	function getEntry(paramId: string, voicePartId: string | null): EntryState {
		const key = `${paramId}:${voicePartId ?? 'whole'}`;
		return entries[key] ?? { verdict: null, remarks: '' };
	}

	function setVerdict(paramId: string, voicePartId: string | null, v: Verdict) {
		const key = `${paramId}:${voicePartId ?? 'whole'}`;
		entries[key] = { ...getEntry(paramId, voicePartId), verdict: v };
		autosave();
	}

	function setRemarks(paramId: string, voicePartId: string | null, text: string) {
		const key = `${paramId}:${voicePartId ?? 'whole'}`;
		entries[key] = { ...getEntry(paramId, voicePartId), remarks: text };
	}

	let saveTimer: ReturnType<typeof setTimeout>;
	function autosave() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(saveEntries, 800);
	}

	async function saveEntries() {
		if (!activeReviewId) return;
		const body = Object.entries(entries).map(([key, val]) => {
			const [param_id, vpPart] = key.split(':');
			return {
				param_id,
				voice_part_id: vpPart === 'whole' ? null : vpPart,
				remarks: val.remarks ? [{ text: val.remarks }] : null,
				verdict: val.verdict,
			};
		});
		await fetch(`/api/reviews/${activeReviewId}/entries`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ entries: body }),
		});
	}

	// Toimingud
	let selectedReviewer = $state('');
	let statusMsg = $state('');
	let uploading = $state(false);

	// --- Upload helper ---
	async function uploadFile(file: File): Promise<string | null> {
		uploading = true;
		statusMsg = '';
		try {
			const form = new FormData();
			form.append('file', file);
			const res = await fetch('/api/upload', { method: 'POST', body: form });
			if (!res.ok) {
				statusMsg = (await res.json()).error ?? 'Upload ebaõnnestus';
				return null;
			}
			const { url } = await res.json();
			return url as string;
		} finally {
			uploading = false;
		}
	}

	// --- 1. Lisa lähtefail (teos status) ---
	let sourceFile: File | null = $state(null);

	function onSourceFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		sourceFile = input.files?.[0] ?? null;
	}

	async function uploadSourcePdf() {
		if (!sourceFile) return;
		const url = await uploadFile(sourceFile);
		if (!url) return;
		const res = await fetch(`/api/pieces/${piece.id}/source-pdf`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ source_pdf_url: url }),
		});
		if (res.ok) window.location.reload();
		else statusMsg = (await res.json()).error;
	}

	// --- 2. Määra korrektor (küljenduses) ---
	let draftFile: File | null = $state(null);
	let pageflowMatched = $state(false);

	function onDraftFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		draftFile = input.files?.[0] ?? null;
	}

	async function assignReviewer() {
		if (!selectedReviewer) { statusMsg = 'Vali korrektor'; return; }
		if (!draftFile) { statusMsg = 'Lisa küljenduse PDF'; return; }

		const url = await uploadFile(draftFile);
		if (!url) return;

		const res = await fetch(`/api/pieces/${piece.id}/assign-reviewer`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				reviewer_id: selectedReviewer,
				pdf_url: url,
				pageflow_matched: pageflowMatched,
			}),
		});
		if (res.ok) window.location.reload();
		else statusMsg = (await res.json()).error;
	}

	async function startReview() {
		const res = await fetch('/api/reviews', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ piece_id: piece.id }),
		});
		if (res.ok) { activeReviewId = (await res.json()).id; window.location.reload(); }
		else statusMsg = (await res.json()).error;
	}

	async function completeReview() {
		if (!activeReviewId) return;
		await saveEntries();
		const res = await fetch(`/api/reviews/${activeReviewId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'completed' }),
		});
		if (res.ok) window.location.reload();
		else statusMsg = (await res.json()).error;
	}

	async function claim() {
		const res = await fetch(`/api/pieces/${piece.id}/claim`, { method: 'PUT' });
		if (res.ok) window.location.reload();
		else statusMsg = (await res.json()).error;
	}

	// --- 3. Dual split-view (korrektuuris) ---
	const hasDualPdf = $derived(!!piece.pdf_url && !!piece.source_pdf_url && !!activeReviewId);
	let swapped = $state(false);
	const leftUrl = $derived(swapped ? piece.source_pdf_url : piece.pdf_url);
	const rightUrl = $derived(swapped ? piece.pdf_url : piece.source_pdf_url);

	let scrollLinked = $state(data.piece.pageflow_matched === 1);
	let leftIframe: HTMLIFrameElement | undefined = $state(undefined);
	let rightIframe: HTMLIFrameElement | undefined = $state(undefined);
	let scrolling = false;

	function syncScroll(source: HTMLIFrameElement | undefined, target: HTMLIFrameElement | undefined) {
		if (!scrollLinked || scrolling || !source || !target) return;
		try {
			const srcDoc = source.contentWindow?.document?.documentElement;
			const tgtDoc = target.contentWindow?.document?.documentElement;
			if (!srcDoc || !tgtDoc) return;

			scrolling = true;
			const ratio = srcDoc.scrollTop / (srcDoc.scrollHeight - srcDoc.clientHeight || 1);
			tgtDoc.scrollTop = ratio * (tgtDoc.scrollHeight - tgtDoc.clientHeight);
			requestAnimationFrame(() => { scrolling = false; });
		} catch {
			// Cross-origin — disable scroll link
			scrollLinked = false;
		}
	}

	function attachScrollListeners() {
		try {
			leftIframe?.contentWindow?.document?.addEventListener('scroll', () => syncScroll(leftIframe, rightIframe));
			rightIframe?.contentWindow?.document?.addEventListener('scroll', () => syncScroll(rightIframe, leftIframe));
		} catch {
			// Cross-origin — cannot attach
			scrollLinked = false;
		}
	}

	// Mobile tabs for dual view
	let mobileTab: 'draft' | 'source' = $state('draft');
</script>

<div class="mb-4">
	<a href="/" style="color: #C9A96E; font-size: 0.875rem;">&larr; Tagasi</a>
</div>

<!-- Pealkiri ja staatus -->
<div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
	<div>
		<h1 style="font-size: 1.75rem; font-weight: 600;">{piece.title}</h1>
		{#if piece.composer}
			<p style="color: #888; font-size: 1rem;">{piece.composer}</p>
		{/if}
		<div class="flex gap-4 mt-2 text-sm flex-wrap">
			{#if piece.typesetter}
				<span>Graafik: <strong>{piece.typesetter.name ?? piece.typesetter.email}</strong></span>
			{/if}
			{#if piece.reviewer}
				<span>Korrektor: <strong>{piece.reviewer.name ?? piece.reviewer.email}</strong></span>
			{/if}
		</div>
	</div>
	<span style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; padding: 4px 10px; border-radius: 4px; background: {STATUS_COLORS[piece.status] ?? '#ccc'}; color: white; white-space: nowrap;">
		{piece.status}
	</span>
</div>

{#if statusMsg}
	<p style="color: #E76F51; margin-bottom: 1rem; font-size: 0.875rem;">{statusMsg}</p>
{/if}

<!-- Toimingud -->
<div class="flex gap-3 mb-6 flex-wrap items-end">
	{#if user && !piece.typesetter && ['teos', 'lähtefail'].includes(piece.status)}
		<button onclick={claim} style="background: #C9A96E; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			V&otilde;ta k&uuml;ljendada
		</button>
	{/if}

	<!-- 1. Lisa lähtefail — teos staatuses -->
	{#if user && piece.status === 'teos'}
		<div style="display: flex; flex-direction: column; gap: 6px;">
			<span style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">
				Lisa l&auml;htefail
			</span>
			<div class="flex gap-2 items-center">
				<input type="file" accept=".pdf" onchange={onSourceFileChange}
					style="font-size: 0.8rem; max-width: 220px;" />
				<button onclick={uploadSourcePdf} disabled={!sourceFile || uploading}
					style="background: #2C2416; color: white; border: none; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: 0.85rem; opacity: {!sourceFile || uploading ? 0.5 : 1};">
					{uploading ? 'Laen...' : 'Lae \u00fcles'}
				</button>
			</div>
		</div>
	{/if}

	<!-- 2. Määra korrektor — küljenduses staatuses -->
	{#if isTypesetter && piece.status === 'küljenduses' && users.length > 0}
		<div style="display: flex; flex-direction: column; gap: 6px;">
			<span style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">
				M&auml;&auml;ra korrektor
			</span>
			<div class="flex gap-2 items-center flex-wrap">
				<select bind:value={selectedReviewer} style="border: 1px solid #E8DDD0; border-radius: 6px; padding: 6px 10px; background: white;">
					<option value="">Vali korrektor&hellip;</option>
					{#each users as u}
						<option value={u.id}>{u.name ?? u.email}</option>
					{/each}
				</select>
				<input type="file" accept=".pdf" onchange={onDraftFileChange}
					style="font-size: 0.8rem; max-width: 220px;" />
				<label class="flex items-center gap-1" style="font-size: 0.8rem; cursor: pointer; white-space: nowrap;">
					<input type="checkbox" bind:checked={pageflowMatched} />
					1:1 pageflow
				</label>
				<button onclick={assignReviewer} disabled={uploading}
					style="background: #2C2416; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; opacity: {uploading ? 0.5 : 1};">
					{uploading ? 'Laen...' : 'M\u00e4\u00e4ra korrektor'}
				</button>
			</div>
		</div>
	{/if}

	{#if isReviewer && piece.status === 'korrektuuris' && !activeReviewId}
		<button onclick={startReview} style="background: #E9C46A; color: #2C2416; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Alusta &uuml;lelugemist
		</button>
	{/if}
</div>

<!-- Split-vaade -->
{#if hasDualPdf}
	<!-- DUAL SPLIT-VIEW: korrektuuris + mõlemad PDF-id olemas -->

	<!-- Mobile tab selector (<640px) -->
	<div class="dual-mobile-tabs">
		<button
			onclick={() => { mobileTab = 'draft'; }}
			style="flex: 1; padding: 8px; border: none; border-radius: 6px 0 0 6px; cursor: pointer; font-size: 0.85rem; background: {mobileTab === 'draft' ? '#2C2416' : '#E8DDD0'}; color: {mobileTab === 'draft' ? 'white' : '#2C2416'};">
			K&uuml;ljendus
		</button>
		<button
			onclick={() => { mobileTab = 'source'; }}
			style="flex: 1; padding: 8px; border: none; border-radius: 0 6px 6px 0; cursor: pointer; font-size: 0.85rem; background: {mobileTab === 'source' ? '#2C2416' : '#E8DDD0'}; color: {mobileTab === 'source' ? 'white' : '#2C2416'};">
			Allikas
		</button>
	</div>

	<!-- Desktop dual PDF row -->
	<div class="dual-pdf-row">
		<div class="dual-pdf-left" style="flex: 1; min-width: 0;">
			<div style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
				{swapped ? 'Algnoot' : 'K\u00fcljendus'}
			</div>
			<iframe
				bind:this={leftIframe}
				src={leftUrl}
				onload={attachScrollListeners}
				style="width: 100%; height: 60vh; border: 1px solid #E8DDD0; border-radius: 6px;"
				title={swapped ? 'Algnoot' : 'Küljendus'}
			></iframe>
		</div>

		<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 4px; align-self: center;">
			<button onclick={() => { swapped = !swapped; }}
				title="Vaheta pooled"
				style="background: #E8DDD0; border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">
				&#x21C4;
			</button>
		</div>

		<div class="dual-pdf-right" style="flex: 1; min-width: 0;">
			<div style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
				{swapped ? 'K\u00fcljendus' : 'Algnoot'}
			</div>
			<iframe
				bind:this={rightIframe}
				src={rightUrl}
				onload={attachScrollListeners}
				style="width: 100%; height: 60vh; border: 1px solid #E8DDD0; border-radius: 6px;"
				title={swapped ? 'Küljendus' : 'Algnoot'}
			></iframe>
		</div>
	</div>

	<!-- Mobile: single PDF view based on tab -->
	<div class="dual-mobile-view">
		{#if mobileTab === 'draft'}
			<iframe
				src={piece.pdf_url}
				style="width: 100%; height: 60vh; border: 1px solid #E8DDD0; border-radius: 6px;"
				title="Küljendus"
			></iframe>
		{:else}
			<iframe
				src={piece.source_pdf_url}
				style="width: 100%; height: 60vh; border: 1px solid #E8DDD0; border-radius: 6px;"
				title="Algnoot"
			></iframe>
		{/if}
	</div>

	<!-- Review form — full width below PDFs -->
	{#if activeReviewId}
		<div style="margin-top: 1rem; max-height: 60vh; overflow-y: auto;">
			{@render reviewForm()}
		</div>
	{/if}

{:else}
	<!-- SINGLE PDF + REVIEW (original layout) -->
	<div class="flex gap-6" style="align-items: flex-start; flex-wrap: wrap;">

		<!-- Vasak: PDF -->
		<div style="flex: 1; min-width: 300px;">
			{#if piece.pdf_url}
				<iframe
					src={piece.pdf_url}
					style="width: 100%; height: 70vh; border: 1px solid #E8DDD0; border-radius: 6px;"
					title="PDF"
				></iframe>
			{:else}
				<div style="border: 2px dashed #E8DDD0; border-radius: 6px; height: 200px; display: flex; align-items: center; justify-content: center; color: #aaa;">
					PDF puudub
				</div>
			{/if}
		</div>

		<!-- Parem: Review vorm -->
		{#if activeReviewId}
			<div style="flex: 1; min-width: 320px; max-height: 70vh; overflow-y: auto;">
				{@render reviewForm()}
			</div>
		{/if}
	</div>
{/if}

<!-- Review form snippet (shared by both layouts) -->
{#snippet reviewForm()}
	<!-- Whole-piece parameetrid -->
	{#if wholePieceParams.length > 0}
		<h3 style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">
			&Uuml;ldised
		</h3>
		{#each wholePieceParams as param}
			{@const entry = getEntry(param.id, null)}
			<div style="border: 1px solid #E8DDD0; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
				<div style="font-size: 0.875rem; margin-bottom: 6px;">{param.param_name}</div>
				<div class="flex gap-1 flex-wrap">
					{#each VERDICTS as v}
						<button
							onclick={() => setVerdict(param.id, null, entry.verdict === v ? null : v)}
							style="padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; cursor: pointer; border: 1px solid #E8DDD0; background: {entry.verdict === v ? '#2C2416' : 'white'}; color: {entry.verdict === v ? 'white' : '#2C2416'};"
						>{v}</button>
					{/each}
				</div>
				{#if entry.verdict === 'viga' || entry.verdict === 'ettepanek'}
					<textarea
						value={entry.remarks}
						oninput={e => { setRemarks(param.id, null, (e.target as HTMLTextAreaElement).value); autosave(); }}
						style="width: 100%; margin-top: 6px; padding: 4px 6px; border: 1px solid #E8DDD0; border-radius: 4px; font-size: 0.8rem; resize: vertical;"
						rows="2"
						placeholder="M&auml;rkused&hellip;"
					></textarea>
				{/if}
			</div>
		{/each}
	{/if}

	<!-- Per-voice parameetrid -->
	{#if perVoiceParams.length > 0 && piece.voice_parts.length > 0}
		<h3 style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin: 1rem 0 0.75rem;">
			H&auml;&auml;ler&uuml;hmade kaupa
		</h3>
		{#each perVoiceParams as param}
			<div style="border: 1px solid #E8DDD0; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
				<div style="font-size: 0.875rem; margin-bottom: 6px;">{param.param_name}</div>
				{#each piece.voice_parts as vp}
					{@const entry = getEntry(param.id, vp.id)}
					<div class="flex items-center gap-2 mb-2 flex-wrap">
						<span style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #888; min-width: 40px;">{vp.name}</span>
						<div class="flex gap-1">
							{#each VERDICTS as v}
								<button
									onclick={() => setVerdict(param.id, vp.id, entry.verdict === v ? null : v)}
									style="padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-family: 'JetBrains Mono', monospace; cursor: pointer; border: 1px solid #E8DDD0; background: {entry.verdict === v ? '#2C2416' : 'white'}; color: {entry.verdict === v ? 'white' : '#2C2416'};"
								>{v}</button>
							{/each}
						</div>
						{#if entry.verdict === 'viga' || entry.verdict === 'ettepanek'}
							<input
								type="text"
								value={entry.remarks}
								oninput={e => { setRemarks(param.id, vp.id, (e.target as HTMLInputElement).value); autosave(); }}
								style="flex: 1; min-width: 100px; padding: 2px 6px; border: 1px solid #E8DDD0; border-radius: 4px; font-size: 0.75rem;"
								placeholder="M&auml;rkused&hellip;"
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	{/if}

	<!-- Lõpeta -->
	<button
		onclick={completeReview}
		style="width: 100%; background: #52B788; color: white; border: none; border-radius: 6px; padding: 10px; cursor: pointer; font-size: 1rem; margin-top: 0.5rem;"
	>
		L&otilde;peta &uuml;lelugemine
	</button>
{/snippet}

<style>
	/* Desktop: show dual row, hide mobile tabs/view */
	.dual-pdf-row {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		margin-left: calc(50% - 50vw);
		width: 100vw;
		padding: 0 1rem;
		box-sizing: border-box;
	}
	.dual-mobile-tabs { display: none; }
	.dual-mobile-view { display: none; }

	/* Mobile (<640px): hide dual row, show tabs + single view */
	@media (max-width: 639px) {
		.dual-pdf-row { display: none; }
		.dual-mobile-tabs { display: flex; margin-bottom: 8px; }
		.dual-mobile-view { display: block; }
	}
</style>
