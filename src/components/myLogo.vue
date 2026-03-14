<template>
	<div class="logo-container">
		<a
			href="https://example.com"
			target="_blank"
			rel="noopener noreferrer"
			class="logo-link"
		>
			<img src="../assets/myLogo.png" alt="לוגו עסקי" class="logo-image" />
			<span class="logo-caption">Kupat Safed</span>
		</a>
	</div>
</template>

<script>
export default {
	name: "myLogo",
};
</script>

<style scoped>
.logo-container {
	position: fixed;
	left: 22px;
	bottom: 22px;
	z-index: 24;
}

.logo-link {
	display: inline-flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-radius: 999px;
	background: rgba(255, 251, 246, 0.76);
	border: 1px solid rgba(24, 53, 46, 0.1);
	box-shadow: 0 16px 34px rgba(24, 53, 46, 0.1);
	backdrop-filter: blur(16px);
	text-decoration: none;
	color: var(--color-text-muted);
}

.logo-image {
	width: 54px;
	height: auto;
	transition: transform 0.3s ease;
}

.logo-caption {
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.logo-link:hover .logo-image {
	transform: scale(1.08);
}

@media (max-width: 768px) {
	.logo-container {
		position: static;
		margin: 28px auto 0;
		display: flex;
		justify-content: center;
		padding: 0 16px;
	}

	.logo-link {
		padding: 10px 14px;
	}

	.logo-image {
		width: 46px;
	}
}
</style>
