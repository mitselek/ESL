<script lang="ts">
	import type { Piece } from '$lib/server/api/pieces';

	let { data } = $props();
	const pieces: Piece[] = $derived(data.pieces);
	const user = $derived(data.user);

	const STATUS_COLORS: Record<string, string> = {
		'teos': '#ADB5BD',
		'lähtefail': '#ADB5BD',
		'küljenduses': '#E9C46A',
		'korrektuuris': '#E9C46A',
		'kontrollitud': '#E76F51',
		'paranduses': '#E76F51',
		'kinnitatud': '#52B788',
		'publitseeritud': '#2D6A4F',
	};

	const SECTIONS = ['I', 'II', 'III', 'IV'];

	const bySection = $derived(
		SECTIONS.map(s => ({ section: s, pieces: pieces.filter(p => p.section === s) }))
			.filter(g => g.pieces.length > 0)
	);

	const total = $derived(pieces.length);
	const kuljendatud = $derived(pieces.filter(p => !['teos', 'lähtefail'].includes(p.status)).length);
	const kontrollitud = $derived(pieces.filter(p => ['kontrollitud', 'paranduses', 'kinnitatud', 'publitseeritud'].includes(p.status)).length);

	async function claim(pieceId: string) {
		const res = await fetch(`/api/pieces/${pieceId}/claim`, { method: 'PUT' });
		if (res.ok) window.location.reload();
		else alert((await res.json()).error);
	}
</script>

<div class="space-y-6">
	<!-- Statistika -->
	<div style="background: #E8DDD0; border-radius: 8px;" class="p-4 flex gap-6 text-sm">
		<span><strong>{kuljendatud}/{total}</strong> küljendatud</span>
		<span><strong>{kontrollitud}/{kuljendatud}</strong> kontrollitud</span>
	</div>

	<!-- Progressiriba -->
	<div style="background: #E8DDD0; border-radius: 4px; height: 12px; overflow: hidden; display: flex;">
		{#each Object.entries(STATUS_COLORS) as [status, color]}
			{@const count = pieces.filter(p => p.status === status).length}
			{#if count > 0}
				<div style="background: {color}; flex: {count}; transition: flex 0.3s;" title="{status}: {count}"></div>
			{/if}
		{/each}
	</div>

	<!-- Nootide nimekiri osade kaupa -->
	{#each bySection as group}
		<section>
			<h2 style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; letter-spacing: 0.1em; color: #C9A96E; text-transform: uppercase;" class="mb-3">
				{group.section} OSA
			</h2>
			<div class="space-y-2">
				{#each group.pieces as piece}
					<a href="/pieces/{piece.id}" style="border: 1px solid #E8DDD0; border-radius: 6px; text-decoration: none; color: inherit; transition: border-color 0.15s, background 0.15s;" class="p-3 flex items-center gap-3 bg-white hover:border-[#C9A96E] hover:bg-[#FAF6F0]">
						<!-- Staatuse punkt -->
						<span style="width: 10px; height: 10px; border-radius: 50%; background: {STATUS_COLORS[piece.status] ?? '#ccc'}; flex-shrink: 0; display: inline-block;"></span>

						<!-- Pealkiri + helilooja -->
						<div class="flex-1 min-w-0">
							<span class="font-semibold" style="color: #2C2416;">
								{piece.title}
							</span>
							{#if piece.composer}
								<span class="text-sm opacity-60 ml-2">{piece.composer}</span>
							{/if}
						</div>

						<!-- Graafik / korrektor -->
						<div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #888;" class="text-right hidden sm:block">
							{#if piece.typesetter}
								<div>{piece.typesetter.name ?? piece.typesetter.email}</div>
							{:else}
								<span style="color: #ADB5BD;">&mdash;</span>
							{/if}
							{#if piece.reviewer}
								<div style="color: #52B788;">{piece.reviewer.name ?? piece.reviewer.email}</div>
							{/if}
						</div>

						<!-- Võta küljendada -->
						{#if piece.status === 'teos' && !piece.typesetter}
							<button
								onclick={(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); claim(piece.id); }}
								style="font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; background: #E8DDD0; color: #2C2416; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; white-space: nowrap; transition: background 0.15s;"
								class="claim-btn"
							>
								Võta küljendada
							</button>
						{/if}

						<!-- Staatus -->
						<span style="font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: {STATUS_COLORS[piece.status] ?? '#ccc'}; white-space: nowrap;" class="hidden md:block">
							{piece.status}
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.claim-btn:hover {
		background: #C9A96E !important;
		color: white !important;
	}
</style>
