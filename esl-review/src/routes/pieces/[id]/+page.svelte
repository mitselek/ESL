<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { ReviewEntry } from '$lib/server/api/review-get';
	import PdfViewer from '$lib/components/PdfViewer.svelte';

	let { data } = $props();
	const piece = $derived(data.piece);
	const user = $derived(data.user);
	const users = $derived(data.users ?? []);

	const isTypesetter = $derived(!!(user && piece.typesetter?.id === user.id));
	const isReviewer = $derived(!!(user && piece.reviewer?.id === user.id));
	const isBothRoles = $derived(isTypesetter && isReviewer);

	// Aktiivne roll — kui mõlemad, saab vahetada
	let activeRole = $state<'typesetter' | 'reviewer'>(
		data.piece.typesetter?.id === data.user?.id ? 'typesetter' : 'reviewer'
	);
	const actingAsTypesetter = $derived(isTypesetter && (!isBothRoles || activeRole === 'typesetter'));
	const actingAsReviewer = $derived(isReviewer && (!isBothRoles || activeRole === 'reviewer'));

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
	let dragover = $state(false);

	function getPdfFromDrop(e: DragEvent): File | null {
		e.preventDefault();
		dragover = false;
		const file = e.dataTransfer?.files?.[0];
		if (!file || file.type !== 'application/pdf') {
			statusMsg = 'Ainult PDF failid';
			return null;
		}
		return file;
	}

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

	// --- 2. Määra korrektor (küljenduses) ---
	let draftFile: File | null = $state(null);
	let pageflowMatched = $state(false);

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

	async function setStatus(status: string) {
		const res = await fetch(`/api/pieces/${piece.id}/status`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status }),
		});
		if (res.ok) window.location.reload();
		else statusMsg = (await res.json()).error;
	}

	const latestCompletedReview = $derived(
		(data.completedReviews ?? []).length > 0
			? (data.completedReviews ?? [])[(data.completedReviews ?? []).length - 1]
			: null
	);
	const hasProblems = $derived(
		(latestCompletedReview?.entries ?? data.activeReview?.entries ?? []).some((e: ReviewEntry) => e.verdict === 'viga' || e.verdict === 'ettepanek')
	);

	// --- 3. Dual split-view (korrektuuris / paranduses) ---
	const hasDualPdf = $derived(
		!!piece.pdf_url && !!piece.source_pdf_url &&
		(!!activeReviewId || ['kontrollitud', 'paranduses'].includes(piece.status))
	);
	let swapped = $state(false);

	// Redaktsioonide vahetamine — vaikimisi viimane
	const redactions = $derived(piece.redactions ?? []);
	const completedReviews = $derived(data.completedReviews ?? []);
	let selectedRedactionIdx = $state(-1); // -1 = viimane
	const selectedRedaction = $derived(
		redactions.length > 0
			? redactions[selectedRedactionIdx < 0 ? redactions.length - 1 : selectedRedactionIdx]
			: null
	);
	const activeRedactionUrl = $derived(selectedRedaction?.url ?? piece.pdf_url);
	const isLatestRedaction = $derived(
		!selectedRedaction || selectedRedaction === redactions[redactions.length - 1]
	);

	// Review seotud valitud redaktsiooniga
	const selectedRedactionReview = $derived(
		selectedRedaction
			? completedReviews.find((r: { redaction_id: string | null }) => r.redaction_id === selectedRedaction.id) ?? null
			: null
	);

	const leftUrl = $derived(swapped ? piece.source_pdf_url : activeRedactionUrl);
	const rightUrl = $derived(swapped ? activeRedactionUrl : piece.source_pdf_url);

	let scrollLinked = $state(data.piece.pageflow_matched === 1);
	let leftRatio = $state(0);
	let rightRatio = $state(0);
	let syncing = $state(false);

	function onLeftScroll(ratio: number) {
		leftRatio = ratio;
		if (scrollLinked && !syncing) {
			syncing = true;
			rightRatio = ratio;
			requestAnimationFrame(() => { syncing = false; });
		}
	}

	function onRightScroll(ratio: number) {
		rightRatio = ratio;
		if (scrollLinked && !syncing) {
			syncing = true;
			leftRatio = ratio;
			requestAnimationFrame(() => { syncing = false; });
		}
	}

	// --- Voice parts ---
	let newVoicePartName = $state('');
	let vpLoading = $state(false);
	let vpInput: HTMLInputElement | undefined = $state(undefined);

	async function addVoicePart() {
		const name = newVoicePartName.trim();
		if (!name) return;
		vpLoading = true;
		const res = await fetch(`/api/pieces/${piece.id}/voice-parts`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name }),
		});
		vpLoading = false;
		if (res.ok) {
			newVoicePartName = '';
			await invalidateAll();
			vpInput?.focus();
		}
		else statusMsg = (await res.json()).error;
	}

	async function deleteVoicePart(vpId: string, vpName: string) {
		if (!confirm(`Kustuta "${vpName}"?`)) return;
		const res = await fetch(`/api/pieces/${piece.id}/voice-parts/${vpId}`, { method: 'DELETE' });
		if (res.ok) await invalidateAll();
		else statusMsg = (await res.json()).error;
	}

	// Expanded view — hides header, maximises PDF area
	let expanded = $state(false);

	// Does split-view have review content below?
	const showsReviewBelowSplit = $derived(
		hasDualPdf && !expanded && (
			(!isLatestRedaction && !!selectedRedactionReview) ||
			(!!activeReviewId && actingAsReviewer && isLatestRedaction) ||
			(isLatestRedaction && !!selectedRedactionReview)
		)
	);
	const splitPdfHeight = $derived(
		expanded
			? 'calc(100vh - 3rem)'
			: showsReviewBelowSplit
				? '60vh'
				: 'calc(100vh - 12rem)'
	);

	// Mobile tabs for dual view
	let mobileTab: 'draft' | 'source' = $state('draft');
</script>

<svelte:window onkeydown={e => {
	if (e.key === 'Escape') expanded = !expanded;
}} />

{#if !expanded}
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
		<div class="flex gap-4 mt-2 text-sm flex-wrap items-center">
			{#if piece.typesetter}
				{#if isBothRoles}
					{#if activeRole === 'typesetter'}
						<span>Graafik: <strong>{piece.typesetter.name ?? piece.typesetter.email}</strong></span>
					{:else}
						<button onclick={() => activeRole = 'typesetter'}
							style="border: 1px solid #E8DDD0; background: #FAF6F0; border-radius: 6px; padding: 2px 10px; cursor: pointer; font-size: inherit; color: #666;">
							Graafik: {piece.typesetter.name ?? piece.typesetter.email}
						</button>
					{/if}
				{:else}
					<span>Graafik: <strong>{piece.typesetter.name ?? piece.typesetter.email}</strong></span>
				{/if}
			{/if}
			{#if piece.reviewer}
				{#if isBothRoles}
					{#if activeRole === 'reviewer'}
						<span>Korrektor: <strong>{piece.reviewer.name ?? piece.reviewer.email}</strong></span>
					{:else}
						<button onclick={() => activeRole = 'reviewer'}
							style="border: 1px solid #E8DDD0; background: #FAF6F0; border-radius: 6px; padding: 2px 10px; cursor: pointer; font-size: inherit; color: #666;">
							Korrektor: {piece.reviewer.name ?? piece.reviewer.email}
						</button>
					{/if}
				{:else}
					<span>Korrektor: <strong>{piece.reviewer.name ?? piece.reviewer.email}</strong></span>
				{/if}
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

<!-- Häälerühmad -->
{#if piece.voice_parts.length > 0 || (actingAsTypesetter && piece.status === 'küljenduses')}
	<div style="margin-bottom: 1rem;">
		<h3 style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">
			H&auml;&auml;ler&uuml;hmad / instrumendid
		</h3>
		<div class="flex gap-2 flex-wrap items-center" style="font-size: 0.8rem;">
			{#each piece.voice_parts as vp}
				<span style="background: #FAF6F0; border: 1px solid #E8DDD0; border-radius: 4px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
					{vp.name}
					{#if actingAsTypesetter && piece.status === 'küljenduses'}
						<button onclick={() => deleteVoicePart(vp.id, vp.name)}
							title="Kustuta"
							style="background: none; border: none; cursor: pointer; color: #E76F51; font-size: 0.7rem; padding: 0 2px; line-height: 1;">
							&times;
						</button>
					{/if}
				</span>
			{/each}
			{#if actingAsTypesetter && piece.status === 'küljenduses'}
				<form onsubmit={e => { e.preventDefault(); addVoicePart(); }} style="display: inline-flex; gap: 4px; align-items: center;">
					<input
						bind:this={vpInput}
						bind:value={newVoicePartName}
						placeholder="Lisa..."
						style="border: 1px solid #E8DDD0; border-radius: 4px; padding: 2px 8px; font-size: 0.8rem; width: 120px;"
					/>
					<button type="submit" disabled={vpLoading || !newVoicePartName.trim()}
						style="background: #C9A96E; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem; opacity: {vpLoading || !newVoicePartName.trim() ? 0.5 : 1};">
						+
					</button>
				</form>
			{/if}
		</div>
	</div>
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
		{@render dropZone('Lisa lähtefail', async (file) => {
			const url = await uploadFile(file);
			if (!url) return;
			const res = await fetch(`/api/pieces/${piece.id}/source-pdf`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ source_pdf_url: url }),
			});
			if (res.ok) window.location.reload();
			else statusMsg = (await res.json()).error;
		})}
	{/if}

	<!-- 2. Küljenduses: esmalt draft PDF, siis korrektori valik -->
	{#if actingAsTypesetter && piece.status === 'küljenduses'}
		<div style="display: flex; flex-direction: column; gap: 6px;">
			{@render dropZone(draftFile ? draftFile.name : 'Küljenduse PDF', (file) => { draftFile = file; })}
			{#if draftFile && users.length > 0}
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
					<label class="flex items-center gap-1" style="font-size: 0.8rem; cursor: pointer; white-space: nowrap;">
						<input type="checkbox" bind:checked={pageflowMatched} />
						1:1 pageflow
					</label>
				</div>
				<button onclick={assignReviewer} disabled={uploading || !selectedReviewer}
					style="background: #2C2416; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; opacity: {uploading || !selectedReviewer ? 0.5 : 1};">
					{uploading ? 'Laen...' : 'M\u00e4\u00e4ra korrektor'}
				</button>
			{/if}
		</div>
	{/if}

	{#if actingAsReviewer && piece.status === 'korrektuuris' && !activeReviewId}
		<button onclick={startReview}
			title="Avab ülelugemise vormi, kus saad iga parameetri kohta verdikti ja märkused sisestada."
			style="background: #E9C46A; color: #2C2416; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Alusta &uuml;lelugemist
		</button>
	{/if}

	{#if actingAsTypesetter && piece.status === 'kontrollitud'}
		{#if hasProblems}
			<button onclick={() => setStatus('paranduses')}
				title="Korrektori märkused vajavad parandamist. Noot läheb tagasi küljendamisele."
				style="background: #E76F51; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
				Parandan
			</button>
		{/if}
		<button onclick={() => setStatus('kinnitatud')}
			disabled={hasProblems}
			title={hasProblems ? 'Korrektuuris on vigasid või ettepanekuid — enne kinnitamist paranda.' : 'Korrektor kinnitas: noot on korras.'}
			style="background: #52B788; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: {hasProblems ? 'not-allowed' : 'pointer'}; opacity: {hasProblems ? 0.4 : 1};">
			Kinnita
		</button>
	{/if}

	{#if actingAsTypesetter && piece.status === 'paranduses'}
		{@render dropZone('Lae üles parandatud redaktsioon', async (file) => {
			const url = await uploadFile(file);
			if (!url) return;
			const res = await fetch(`/api/pieces/${piece.id}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'korrektuuris', pdf_url: url }),
			});
			if (res.ok) window.location.reload();
			else statusMsg = (await res.json()).error;
		})}
	{/if}

	{#if actingAsReviewer && piece.status === 'paranduses'}
		<button onclick={() => setStatus('korrektuuris')}
			title="Parandused on tehtud, aga vajavad uut ülelugemist."
			style="background: #E9C46A; color: #2C2416; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Tagasi korrektuuris
		</button>
		<button onclick={() => setStatus('kinnitatud')}
			title="Parandused on korrektsed. Kinnitan noodi."
			style="background: #52B788; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Kinnita
		</button>
	{/if}

	{#if actingAsTypesetter && piece.status === 'kinnitatud'}
		{@render dropZone('Lae üles publitseerimise PDF (valikuline)', async (file) => {
			const url = await uploadFile(file);
			if (!url) return;
			const res = await fetch(`/api/pieces/${piece.id}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'publitseeritud', pdf_url: url }),
			});
			if (res.ok) window.location.reload();
			else statusMsg = (await res.json()).error;
		})}
		<button onclick={() => setStatus('publitseeritud')}
			title="Avalda viimase korrektuurist tulnud redaktsiooniga."
			style="background: #2D6A4F; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Publitseeri nii nagu on
		</button>
	{/if}
</div>

<!-- Korrektori märkused (kontrollitud/paranduses, väljaspool split-view) -->
{#if ['kontrollitud', 'paranduses'].includes(piece.status) && !hasDualPdf && completedReviews.length > 0}
	{@const latestReview = completedReviews[completedReviews.length - 1]}
	<div style="margin-bottom: 1rem;">
		{@render readonlyReview(latestReview)}
	</div>
{/if}
{/if}<!-- /expanded -->

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
			<div style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
				{#if swapped}
					Algnoot
				{:else if redactions.length > 1}
					{@render redactionPicker()}
				{:else}
					K&uuml;ljendus
				{/if}
			</div>
			<PdfViewer
				url={leftUrl}
				height={splitPdfHeight}
				syncRatio={scrollLinked ? rightRatio : undefined}
				onScroll={onLeftScroll}
			/>
		</div>

		<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 4px; align-self: center;">
			<button onclick={() => { swapped = !swapped; }}
				title="Vaheta pooled"
				style="background: #E8DDD0; border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">
				&#x21C4;
			</button>
			{#if piece.pageflow_matched === 1}
				<button onclick={() => { scrollLinked = !scrollLinked; }}
					title={scrollLinked ? 'Lülita scroll-link välja' : 'Lülita scroll-link sisse'}
					style="background: {scrollLinked ? '#2C2416' : '#E8DDD0'}; color: {scrollLinked ? 'white' : '#2C2416'}; border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;">
					&#x1F517;
				</button>
			{/if}
			<button onclick={() => { expanded = !expanded; }}
				title={expanded ? 'Näita päist (Esc)' : 'Laienda vaade (Esc)'}
				style="background: {expanded ? '#2C2416' : '#E8DDD0'}; color: {expanded ? 'white' : '#2C2416'}; border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;">
				{#if expanded}&#x2715;{:else}&#x26F6;{/if}
			</button>
		</div>

		<div class="dual-pdf-right" style="flex: 1; min-width: 0;">
			<div style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
				{#if !swapped}
					Algnoot
				{:else if redactions.length > 1}
					{@render redactionPicker()}
				{:else}
					K&uuml;ljendus
				{/if}
			</div>
			<PdfViewer
				url={rightUrl}
				height={splitPdfHeight}
				syncRatio={scrollLinked ? leftRatio : undefined}
				onScroll={onRightScroll}
			/>
		</div>
	</div>

	<!-- Mobile: single PDF view based on tab -->
	<div class="dual-mobile-view">
		{#if mobileTab === 'draft'}
			{#if redactions.length > 1}
				<div style="margin-bottom: 6px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; display: flex; gap: 6px; align-items: center; text-transform: uppercase;">
					{@render redactionPicker()}
				</div>
			{/if}
			<PdfViewer url={activeRedactionUrl} height={splitPdfHeight} />
		{:else}
			<PdfViewer url={piece.source_pdf_url} height={splitPdfHeight} />
		{/if}
	</div>

	<!-- Review: editable vorm praegusele redaktsioonile, readonly vanemale -->
	{#if !expanded}
		{#if !isLatestRedaction && selectedRedactionReview}
			<!-- Vanema redaktsiooni readonly review -->
			<div style="margin-top: 1rem;">
				{@render readonlyReview(selectedRedactionReview)}
			</div>
		{:else if activeReviewId && actingAsReviewer && isLatestRedaction}
			<!-- Praeguse redaktsiooni editable vorm -->
			<div style="margin-top: 1rem; max-height: 60vh; overflow-y: auto;">
				{@render reviewForm()}
			</div>
		{:else if isLatestRedaction && selectedRedactionReview}
			<!-- Viimase redaktsiooni completed review (kontrollitud/paranduses) -->
			<div style="margin-top: 1rem;">
				{@render readonlyReview(selectedRedactionReview)}
			</div>
		{/if}
	{/if}

{:else}
	<!-- SINGLE PDF + REVIEW (original layout) -->
	{@const singlePdfHeight = expanded ? 'calc(100vh - 3rem)' : '70vh'}
	<div class="flex gap-6" style="align-items: flex-start; flex-wrap: wrap;">

		<!-- Vasak: PDF -->
		<div style="flex: 1; min-width: 300px;">
			{#if piece.pdf_url}
				<PdfViewer url={piece.pdf_url} height={singlePdfHeight} />
			{:else if piece.source_pdf_url}
				<PdfViewer url={piece.source_pdf_url} height={singlePdfHeight} />
				{#if !expanded}
					<p style="font-size: 0.75rem; color: #888; margin-top: 4px; text-align: center;">Algnoot (k&uuml;ljenduse PDF puudub)</p>
				{/if}
			{:else}
				<div style="border: 2px dashed #E8DDD0; border-radius: 6px; height: 200px; display: flex; align-items: center; justify-content: center; color: #aaa;">
					PDF puudub
				</div>
			{/if}
		</div>

		<!-- Parem: Review vorm (ainult korrektorile) -->
		{#if !expanded && activeReviewId && actingAsReviewer}
			<div style="flex: 1; min-width: 320px; max-height: 70vh; overflow-y: auto;">
				{@render reviewForm()}
			</div>
		{/if}
	</div>
{/if}

<!-- Review form snippet (shared by both layouts) -->
{#snippet dropZone(label: string, onFile: (file: File) => void)}
	{@const inputId = `drop-${label.replace(/\s/g, '-')}`}
	<div
		role="button"
		tabindex="0"
		ondragover={e => { e.preventDefault(); dragover = true; }}
		ondragleave={() => { dragover = false; }}
		ondrop={e => { const f = getPdfFromDrop(e); if (f) onFile(f); }}
		onclick={() => { if (!uploading) document.getElementById(inputId)?.click(); }}
		onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById(inputId)?.click(); } }}
		style="border: 2px dashed {dragover ? '#C9A96E' : '#E8DDD0'}; border-radius: 8px; padding: 16px; text-align: center; cursor: {uploading ? 'wait' : 'pointer'}; background: {dragover ? '#FAF6F0' : 'transparent'}; transition: border-color 0.15s, background 0.15s; opacity: {uploading ? 0.5 : 1};"
	>
		<input id={inputId} type="file" accept=".pdf"
			onchange={e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onFile(f); }}
			style="display: none;"
		/>
		<div style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: {dragover ? '#C9A96E' : '#888'}; text-transform: uppercase; letter-spacing: 0.05em;">
			{#if uploading}
				Laen &uuml;les...
			{:else}
				{label}
			{/if}
		</div>
		{#if !uploading}
			<div style="font-size: 0.7rem; color: #bbb; margin-top: 4px;">Lohista PDF siia v&otilde;i kl&otilde;psa</div>
		{/if}
	</div>
{/snippet}

{#snippet redactionPicker()}
	{@const actualIdx = selectedRedactionIdx < 0 ? redactions.length - 1 : selectedRedactionIdx}
	{#if redactions.length === 2}
		<!-- 2 redaktsiooni: nupud nagu rollivalik -->
		{#each redactions as r, i}
			{#if i === actualIdx}
				<span style="font-weight: 600; color: #2C2416;">{r.label ?? `v${i + 1}`}</span>
			{:else}
				<button onclick={() => { selectedRedactionIdx = i; }}
					style="border: 1px solid #E8DDD0; background: #FAF6F0; border-radius: 4px; padding: 0 6px; cursor: pointer; font-size: inherit; font-family: inherit; color: #888; text-transform: uppercase;">
					{r.label ?? `v${i + 1}`}
				</button>
			{/if}
		{/each}
	{:else}
		<!-- 3+ redaktsiooni: dropdown -->
		<select
			value={String(actualIdx)}
			onchange={e => { selectedRedactionIdx = Number((e.target as HTMLSelectElement).value); }}
			style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; border: 1px solid #E8DDD0; border-radius: 4px; padding: 1px 4px; background: white; color: #888; text-transform: uppercase;"
		>
			{#each redactions as r, i}
				<option value={String(i)}>
					{r.label ?? `v${i + 1}`} — {new Date(r.created_at).toLocaleDateString('et-EE')}
				</option>
			{/each}
		</select>
	{/if}
{/snippet}

{#snippet readonlyReview(review: { entries: ReviewEntry[] })}
	<div style="background: #FAF6F0; border: 1px solid #E8DDD0; border-radius: 6px; padding: 12px;">
		<h3 style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Korrektori m&auml;rkused</h3>
		{#if !review.entries.length}
			<p style="color: #888; font-size: 0.8rem;">M&auml;rkused puuduvad</p>
		{:else}
			{@const problems = review.entries.filter((e: ReviewEntry) => e.verdict === 'viga' || e.verdict === 'ettepanek')}
			{#if problems.length === 0}
				<p style="color: #52B788; font-size: 0.875rem;">&#10003; K&otilde;ik parameetrid korras</p>
			{:else}
				{#each review.entries as e}
					{@const paramName = piece.piece_params.find(p => p.id === e.param_id)?.param_name ?? e.param_id}
					{@const vpName = e.voice_part_id ? piece.voice_parts.find(v => v.id === e.voice_part_id)?.name : null}
					<div style="margin-bottom: 6px; font-size: 0.8rem;">
						<span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; padding: 1px 5px; border-radius: 3px; background: {e.verdict === 'viga' ? '#E76F51' : e.verdict === 'ettepanek' ? '#E9C46A' : '#52B788'}; color: {e.verdict === 'viga' ? 'white' : e.verdict === 'ettepanek' ? '#2C2416' : 'white'}; margin-right: 4px;">{e.verdict}</span>
						{paramName}{vpName ? ` (${vpName})` : ''}
						{#if e.remarks}
							<span style="color: #666; margin-left: 4px;">&mdash; {Array.isArray(e.remarks) ? e.remarks.map((r: { text: string }) => r.text).join('; ') : e.remarks}</span>
						{/if}
					</div>
				{/each}
			{/if}
		{/if}
	</div>
{/snippet}

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
	{@const currentProblems = Object.values(entries).some(e => e.verdict === 'viga' || e.verdict === 'ettepanek')}
	<button
		onclick={completeReview}
		title={currentProblems
			? 'Lõpeta ülelugemine. Graafik näeb sinu märkusi ja saab parandada.'
			: 'Noodis ei ole vigu ega ettepanekuid. Graafik saab noodi kinnitada.'}
		style="width: 100%; background: {currentProblems ? '#E9C46A' : '#52B788'}; color: {currentProblems ? '#2C2416' : 'white'}; border: none; border-radius: 6px; padding: 10px; cursor: pointer; font-size: 1rem; margin-top: 0.5rem;"
	>
		{currentProblems ? 'L\u00f5peta \u00fclelugemine' : 'Noot korras'}
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
