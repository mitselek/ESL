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

{#if user}
	<a href="/profile" style="position: fixed; top: 12px; right: 16px; z-index: 50; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #888; text-decoration: none; background: rgba(250, 246, 240, 0.85); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 4px; border: 1px solid #E8DDD0; transition: color 0.15s, border-color 0.15s;"
		class="profile-link">
		{user.name ?? user.email}
	</a>
{/if}

<main class="max-w-7xl mx-auto px-4 py-8">
	{@render children()}
</main>

<style>
	.profile-link:hover {
		color: #2C2416 !important;
		border-color: #C9A96E !important;
	}
</style>
