<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
	const user = $derived(data?.user ?? null);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>ESL ülelugemine</title>
</svelte:head>

<header style="background: linear-gradient(135deg, #2C2416, #4A3728); color: #FAF6F0;" class="px-6 py-4 flex items-center justify-between">
	<a href="/" class="text-xl font-semibold" style="font-family: 'Crimson Pro', serif; color: #C9A96E;">
		ESL ülelugemine
	</a>
	{#if user}
		<span class="text-sm opacity-75">{user.name}</span>
	{/if}
</header>

<main class="max-w-4xl mx-auto px-4 py-8">
	{@render children()}
</main>
