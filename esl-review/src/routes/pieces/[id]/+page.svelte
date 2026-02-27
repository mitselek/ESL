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

	async function assignReviewer() {
		if (!selectedReviewer) return;
		const res = await fetch(`/api/pieces/${piece.id}/assign-reviewer`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reviewer_id: selectedReviewer }),
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
</script>

<div class="mb-4">
	<a href="/" style="color: #C9A96E; font-size: 0.875rem;">← Tagasi</a>
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
				<span>Graafik: <strong>{piece.typesetter.name}</strong></span>
			{/if}
			{#if piece.reviewer}
				<span>Korrektor: <strong>{piece.reviewer.name}</strong></span>
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
<div class="flex gap-3 mb-6 flex-wrap">
	{#if user && !piece.typesetter}
		<button onclick={claim} style="background: #C9A96E; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Võta küljendada
		</button>
	{/if}

	{#if isTypesetter && piece.status === 'küljenduses' && users.length > 0}
		<div class="flex gap-2">
			<select bind:value={selectedReviewer} style="border: 1px solid #E8DDD0; border-radius: 6px; padding: 6px 10px; background: white;">
				<option value="">Vali korrektor…</option>
				{#each users as u}
					<option value={u.id}>{u.name}</option>
				{/each}
			</select>
			<button onclick={assignReviewer} style="background: #2C2416; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
				Määra korrektor
			</button>
		</div>
	{/if}

	{#if isReviewer && piece.status === 'korrektuuris' && !activeReviewId}
		<button onclick={startReview} style="background: #E9C46A; color: #2C2416; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;">
			Alusta ülelugemist
		</button>
	{/if}
</div>

<!-- Split-vaade -->
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
			<!-- Whole-piece parameetrid -->
			{#if wholePieceParams.length > 0}
				<h3 style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;">
					Üldised
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
								placeholder="Märkused…"
							></textarea>
						{/if}
					</div>
				{/each}
			{/if}

			<!-- Per-voice parameetrid -->
			{#if perVoiceParams.length > 0 && piece.voice_parts.length > 0}
				<h3 style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.1em; margin: 1rem 0 0.75rem;">
					Häälerühmade kaupa
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
										placeholder="Märkused…"
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
				Lõpeta ülelugemine
			</button>
		</div>
	{/if}
</div>
