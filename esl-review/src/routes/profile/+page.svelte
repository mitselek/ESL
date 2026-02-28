<script lang="ts">
	let { data } = $props();
	const user = $derived(data.user);

	let name = $state(user?.name ?? '');
	let saving = $state(false);
	let msg = $state('');

	async function save() {
		saving = true;
		msg = '';
		const res = await fetch('/api/me', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name }),
		});
		saving = false;
		if (res.ok) { msg = 'Salvestatud.'; }
		else { msg = (await res.json()).error; }
	}
</script>

<div style="max-width: 400px;">
	<h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem;">Profiil</h1>

	<div style="margin-bottom: 1rem;">
		<label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 4px;">E-post</label>
		<div style="font-size: 1rem;">{user?.email}</div>
	</div>

	<div style="margin-bottom: 1rem;">
		<label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 4px;" for="name">Nimi</label>
		<input
			id="name"
			type="text"
			bind:value={name}
			placeholder="Sinu nimi"
			style="width: 100%; border: 1px solid #E8DDD0; border-radius: 6px; padding: 8px 10px; font-size: 1rem;"
		/>
	</div>

	{#if msg}
		<p style="font-size: 0.875rem; color: {msg === 'Salvestatud.' ? '#52B788' : '#E76F51'}; margin-bottom: 0.75rem;">{msg}</p>
	{/if}

	<button
		onclick={save}
		disabled={saving}
		style="background: #2C2416; color: white; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; opacity: {saving ? 0.5 : 1};"
	>
		{saving ? 'Salvestab...' : 'Salvesta'}
	</button>
</div>
