<template>
	<div class="app-shell">
		<router-view />
	</div>
</template>

<script>
export default {};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Heebo:wght@400;500;700;800&display=swap");

:root {
	--font-sans: "Assistant", "Heebo", "Segoe UI", sans-serif;
	--color-bg: #f6f1e8;
	--color-surface: rgba(255, 251, 246, 0.88);
	--color-surface-strong: rgba(255, 255, 255, 0.96);
	--color-border: rgba(24, 53, 46, 0.12);
	--color-border-strong: rgba(24, 53, 46, 0.2);
	--color-text: #18352e;
	--color-text-muted: #5f675d;
	--color-primary: #18352e;
	--color-primary-hover: #0f241f;
	--color-accent: #c26b43;
	--color-success: #2f7d59;
	--color-danger: #b64f47;
	--shadow-soft: 0 18px 40px rgba(24, 53, 46, 0.08);
	--shadow-medium: 0 28px 70px rgba(24, 53, 46, 0.12);
	--radius-md: 20px;
	--radius-lg: 28px;
	--radius-pill: 999px;
}

*,
*::before,
*::after {
	box-sizing: border-box;
}

html,
body {
	height: 100%;
	margin: 0;
	padding: 0;
	overflow-x: hidden;
	scroll-behavior: smooth;
}

body {
	background-image:
		radial-gradient(circle at top right, rgba(194, 107, 67, 0.22), transparent 28%),
		radial-gradient(circle at top left, rgba(47, 125, 89, 0.14), transparent 26%),
		linear-gradient(180deg, rgba(255, 250, 243, 0.9), rgba(243, 237, 226, 0.92)),
		url("./assets/image.png");
	background-size: auto, auto, auto, cover;
	background-position: top right, top left, center, center;
	background-repeat: no-repeat;
	background-attachment: fixed;
	background-color: var(--color-bg);
	font-family: var(--font-sans);
	color: var(--color-text);
	-webkit-text-size-adjust: 100%;
	text-size-adjust: 100%;
	line-height: 1.5;
}

body::before {
	content: "";
	position: fixed;
	inset: 0;
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent 45%),
		radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.28), transparent 18%);
	pointer-events: none;
	z-index: -1;
}

#app {
	min-height: 100%;
	display: flex;
	flex-direction: column;
}

.app-shell {
	min-height: 100vh;
	position: relative;
}

img {
	max-width: 100%;
	display: block;
}

button,
input,
select,
textarea {
	font: inherit;
}

button {
	transition:
		transform 0.18s ease,
		box-shadow 0.18s ease,
		background-color 0.18s ease,
		border-color 0.18s ease,
		color 0.18s ease;
}

button:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 14px 28px rgba(24, 53, 46, 0.12);
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
	outline: 3px solid rgba(194, 107, 67, 0.28);
	outline-offset: 2px;
}

input,
select,
textarea {
	border: 1px solid rgba(24, 53, 46, 0.14);
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.84);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
	color: var(--color-text);
}

input::placeholder,
textarea::placeholder {
	color: rgba(95, 103, 93, 0.82);
}

input:focus,
select:focus,
textarea:focus {
	border-color: rgba(194, 107, 67, 0.45);
	box-shadow:
		0 0 0 4px rgba(194, 107, 67, 0.12),
		inset 0 1px 0 rgba(255, 255, 255, 0.9);
	outline: none;
}

@media (max-width: 768px) {
	body {
		background-attachment: scroll;
	}
}
</style>
