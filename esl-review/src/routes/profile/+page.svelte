<script lang="ts">
	let { data } = $props();
	const user = $derived(data.user);

	let name = $state(user?.name ?? '');
	const savedName = user?.name ?? '';
	let saving = $state(false);
	let saved = $state(false);

	const dirty = $derived(name !== savedName && !saving);
	const btnLabel = $derived(saving ? 'Salvestan...' : saved ? 'Salvestatud' : 'Salvesta');

	async function save() {
		if (!dirty) return;
		saving = true;
		saved = false;
		const res = await fetch('/api/me', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name }),
		});
		saving = false;
		if (res.ok) {
			saved = true;
			setTimeout(() => { saved = false; }, 2500);
		}
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

	<button
		onclick={save}
		disabled={!dirty}
		style="background: {saved ? '#52B788' : '#2C2416'}; color: white; border: none; border-radius: 6px; padding: 8px 20px; cursor: {dirty ? 'pointer' : 'default'}; opacity: {dirty ? 1 : 0.4}; transition: background 0.2s, opacity 0.2s;"
	>
		{btnLabel}
	</button>
</div>
