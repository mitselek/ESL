<script lang="ts">
	import type { Piece } from '$lib/server/api/pieces';
	import PdfViewer from './PdfViewer.svelte';

	let {
		hoveredPiece = null,
		problems = [],
		statusColors = {},
		onComposerUpdate = undefined,
	}: {
		hoveredPiece: Piece | null;
		problems: { param_name: string; verdict: string; remarks: string | null; voice_name: string | null }[];
		statusColors: Record<string, string>;
		onComposerUpdate?: ((pieceId: string, composer: string) => void) | undefined;
	} = $props();

	const STATES = [
		{ id: 'teos', label: 'Teos', tip: 'Noot lisatud, PDF puudub' },
		{ id: 'lähtefail', label: 'Lähtefail', tip: 'Algnoot üles laetud' },
		{ id: 'küljenduses', label: 'Küljenduses', tip: 'Graafik küljendab nooti' },
		{ id: 'korrektuuris', label: 'Korrektuuris', tip: 'Korrektor loeb nooti üle' },
		{ id: 'kontrollitud', label: 'Kontrollitud', tip: 'Ülelugemine lõpetatud' },
		{ id: 'paranduses', label: 'Paranduses', tip: 'Graafik parandab vigu' },
		{ id: 'kinnitatud', label: 'Kinnitatud', tip: 'Noot heaks kiidetud' },
		{ id: 'publitseeritud', label: 'Publitseeritud', tip: 'Noot avaldatud' },
	];

	const TRANSITION_TIPS = [
		'Kasutaja laeb üles algnoodi PDF-i',
		'Graafik võtab noodi küljendada',
		'Graafik laeb üles küljenduse ja määrab korrektori',
		'Korrektor lõpetab ülelugemise',
		'Graafik tunnistab vigu ja hakkab parandama',
		'Korrektor kiidab parandused heaks',
		'Graafik avaldab lõpliku noodi',
	];

	const currentIndex = $derived(
		hoveredPiece ? STATES.findIndex(s => s.id === hoveredPiece.status) : -1
	);

	const CX = 20;
	const STEP = 36;
	const R = 6;
	const TEXT_X = 36;
	const SVG_PAD_L = 25;
	const SVG_W = 220;
	const SVG_H = STATES.length * STEP;

	function circleY(i: number) {
		return 18 + i * STEP;
	}

	function circleFill(i: number): string {
		if (currentIndex < 0) return 'none';
		if (i < currentIndex) return '#ADB5BD';
		if (i === currentIndex) return statusColors[STATES[i].id] ?? '#ADB5BD';
		return 'none';
	}

	function circleStroke(i: number): string {
		if (currentIndex < 0) return '#ADB5BD';
		if (i <= currentIndex) return circleFill(i) === 'none' ? '#ADB5BD' : circleFill(i);
		return '#E8DDD0';
	}

	function lineStroke(i: number): string {
		if (currentIndex < 0) return '#E8DDD0';
		if (i < currentIndex) return '#ADB5BD';
		return '#E8DDD0';
	}

	const arcY1 = $derived(circleY(5));
	const arcY2 = $derived(circleY(3));
	const arcPath = $derived(
		`M ${CX - R - 2} ${arcY1} C ${CX - 35} ${arcY1}, ${CX - 35} ${arcY2}, ${CX - R - 2} ${arcY2}`
	);
	const arcStroke = $derived(
		currentIndex >= 5 ? '#ADB5BD' : '#E8DDD0'
	);

	// Instant tooltip (no browser delay)
	let tipText = $state('');

	// Composer editing
	let editingComposer = $state(false);

	// Reset editing state when piece changes
	$effect(() => {
		if (hoveredPiece) editingComposer = false;
	});

	function autofocus(node: HTMLElement) {
		node.focus();
	}

	// Actor name for current state
	function stateActor(i: number): string | null {
		if (!hoveredPiece || i !== currentIndex) return null;
		const stateId = STATES[i].id;
		if (stateId === 'küljenduses' || stateId === 'paranduses') {
			return hoveredPiece.typesetter?.name ?? null;
		}
		if (stateId === 'korrektuuris' || stateId === 'kontrollitud' || stateId === 'kinnitatud') {
			return hoveredPiece.reviewer?.name ?? null;
		}
		return null;
	}
</script>

<div class="previewer">
	<!-- SVG State Machine -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg width={SVG_W + SVG_PAD_L} height={SVG_H} viewBox="{-SVG_PAD_L} 0 {SVG_W + SVG_PAD_L} {SVG_H}"
		role="img"
		onmouseleave={() => { tipText = ''; }}
	>
		<!-- Visible transition lines -->
		{#each STATES as _, i}
			{#if i < STATES.length - 1}
				<line
					x1={CX} y1={circleY(i) + R}
					x2={CX} y2={circleY(i + 1) - R}
					stroke={lineStroke(i)}
					stroke-width="1.5"
				/>
			{/if}
		{/each}

		<!-- Arc: paranduses -> korrektuuris (visible) -->
		<path d={arcPath} fill="none" stroke={arcStroke} stroke-width="1.5" marker-end="url(#arrowhead)" />
		<defs>
			<marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
				<polygon points="0 0, 6 2, 0 4" fill={arcStroke} />
			</marker>
		</defs>

		<!-- Transition hover areas (wide invisible lines, behind state groups) -->
		{#each STATES as _, i}
			{#if i < STATES.length - 1}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<line
					x1={CX} y1={circleY(i) + R}
					x2={CX} y2={circleY(i + 1) - R}
					stroke="transparent"
					stroke-width="30"
					role="presentation"
					onmouseenter={() => { tipText = TRANSITION_TIPS[i]; }}
				/>
			{/if}
		{/each}

		<!-- Arc hover area -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<path d={arcPath} fill="none" stroke="transparent" stroke-width="30"
			role="presentation"
			onmouseenter={() => { tipText = 'Graafik laeb parandatud versiooni, noot läheb uuesti korrektuuri'; }}
		/>

		<!-- State groups (on top — capture events over transition lines) -->
		{#each STATES as state, i}
			{@const cy = circleY(i)}
			{@const actor = stateActor(i)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
		<g role="presentation" onmouseenter={() => { tipText = state.tip; }}>
				<!-- Invisible hover rect spanning circle + text -->
				<rect x={CX - R - 2} y={cy - 10} width={SVG_W - CX + R + 2} height={20}
					fill="transparent"
				/>
				<circle
					cx={CX} cy={cy} r={R}
					fill={circleFill(i)}
					stroke={circleStroke(i)}
					stroke-width="1.5"
					class={i === currentIndex ? 'state-current' : ''}
				/>
				<text
					x={TEXT_X} y={cy + 4}
					class="state-label"
					fill={currentIndex >= 0 && i === currentIndex ? (statusColors[state.id] ?? '#2C2416') : '#2C2416'}
					opacity={currentIndex >= 0 && i > currentIndex ? 0.4 : 1}
				>{state.label}{#if actor} — {actor}{/if}</text>
			</g>
		{/each}
	</svg>

	<!-- Instant tooltip below SVG -->
	{#if tipText}
		<div class="sm-tip">{tipText}</div>
	{/if}

	<!-- Hovered piece details -->
	{#if hoveredPiece}
		{@const previewUrl = hoveredPiece.status === 'publitseeritud' && hoveredPiece.pdf_url
			? hoveredPiece.pdf_url
			: hoveredPiece.source_pdf_url}
		{#if previewUrl}
			<div class="thumbnail">
				<PdfViewer url={previewUrl} height="100%" singlePage />
			</div>
		{/if}

		<div class="piece-info">
			<div class="piece-title">{hoveredPiece.title}</div>
			{#if editingComposer}
				<input
					class="composer-input"
					value={hoveredPiece.composer ?? ''}
					placeholder="Helilooja?"
					onblur={async (e) => {
						const val = (e.target as HTMLInputElement).value.trim();
						editingComposer = false;
						if (!val || !hoveredPiece || val === hoveredPiece.composer) return;
						const res = await fetch(`/api/pieces/${hoveredPiece.id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ composer: val }),
						});
						if (res.ok) onComposerUpdate?.(hoveredPiece.id, val);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
						if (e.key === 'Escape') { editingComposer = false; }
					}}
					use:autofocus
				/>
			{:else if hoveredPiece.composer}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="piece-composer editable" onclick={() => { editingComposer = true; }}>
					{hoveredPiece.composer}
				</div>
			{:else}
				<input
					class="composer-input"
					placeholder="Helilooja?"
					onblur={async (e) => {
						const val = (e.target as HTMLInputElement).value.trim();
						if (!val || !hoveredPiece) return;
						const res = await fetch(`/api/pieces/${hoveredPiece.id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ composer: val }),
						});
						if (res.ok) onComposerUpdate?.(hoveredPiece.id, val);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
					}}
				/>
			{/if}
			{#if hoveredPiece.typesetter}
				<div class="piece-meta">Graafik: {hoveredPiece.typesetter.name ?? '—'}</div>
			{/if}
			{#if hoveredPiece.reviewer}
				<div class="piece-meta" style="color: #52B788;">Korrektor: {hoveredPiece.reviewer.name ?? '—'}</div>
			{/if}
		</div>

		{#if problems.length > 0}
			<div class="problems">
				<div class="problems-heading">Markused</div>
				{#each problems as problem}
					<div class="problem-row">
						<span
							class="verdict-badge"
							style="background: {problem.verdict === 'viga' ? '#E76F51' : '#E9C46A'}; color: {problem.verdict === 'viga' ? '#fff' : '#2C2416'};"
						>{problem.verdict}</span>
						<span class="problem-param">{problem.param_name}</span>
						{#if problem.voice_name}
							<span class="problem-voice">({problem.voice_name})</span>
						{/if}
						{#if problem.remarks}
							<span class="problem-remarks">{problem.remarks}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.previewer {
		background: #FAF6F0;
		border: 1px solid #E8DDD0;
		border-radius: 8px;
		padding: 16px;
	}

	.sm-tip {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		color: #888;
		padding: 6px 0 2px;
		line-height: 1.4;
	}

	.state-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
	}

	.state-current {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.thumbnail {
		margin-top: 12px;
		border: 1px solid #E8DDD0;
		border-radius: 4px;
		overflow: hidden;
		aspect-ratio: 1 / 1.4142;
		width: 100%;
	}

	.piece-info {
		margin-top: 12px;
	}

	.piece-title {
		font-weight: 600;
		color: #2C2416;
	}

	.piece-composer {
		color: #888;
		font-size: 0.85rem;
	}

	.piece-composer.editable {
		cursor: pointer;
	}
	.piece-composer.editable:hover {
		color: #C9A96E;
	}

	.composer-input {
		font-size: 0.85rem;
		color: #2C2416;
		background: #fff;
		border: 1px solid #E8DDD0;
		border-radius: 4px;
		padding: 2px 6px;
		width: 100%;
		outline: none;
		font-family: inherit;
	}
	.composer-input:focus {
		border-color: #C9A96E;
	}

	.piece-meta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #888;
		margin-top: 2px;
	}

	.problems {
		margin-top: 16px;
	}

	.problems-heading {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #C9A96E;
		letter-spacing: 0.1em;
		margin-bottom: 8px;
	}

	.problem-row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px;
		margin-bottom: 6px;
		font-size: 0.8rem;
	}

	.verdict-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		padding: 1px 6px;
		border-radius: 3px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.problem-param {
		font-weight: 500;
		color: #2C2416;
	}

	.problem-voice {
		color: #888;
		font-size: 0.75rem;
	}

	.problem-remarks {
		color: #666;
		font-size: 0.75rem;
		flex-basis: 100%;
		padding-left: 4px;
	}
</style>
