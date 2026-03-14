<template>
	<div class="admin-panel">
		<div class="menu-section">
			<p class="panel-eyebrow">כלי מערכת</p>
			<h3>מסך ניהול</h3>
			<p>טבלאות פעילות, טעינות קבצים, דוחות, סיסמאות והגדרות שרת.</p>
			<button @click="$router.push('/admin')">פתח מסך ניהול</button>
		</div>
	</div>
</template>

<script>
export default {
	name: "AdminPanel",
};
</script>

<style scoped>
.admin-panel {
	position: sticky;
	top: 108px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: 22px;
	box-shadow: var(--shadow-soft);
	width: 100%;
	text-align: right;
	direction: rtl;
	z-index: 2;
	backdrop-filter: blur(16px);
}

.panel-eyebrow {
	margin: 0 0 8px;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.12em;
	color: var(--color-accent);
}

.menu-section h3 {
	margin: 0 0 10px;
	font-size: 24px;
	color: var(--color-primary);
}

.menu-section p {
	color: var(--color-text-muted);
	line-height: 1.6;
	margin: 0 0 16px;
}

button {
	width: 100%;
	padding: 14px 16px;
	background: linear-gradient(135deg, var(--color-primary), #21493f);
	color: #fffaf1;
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: var(--radius-pill);
	cursor: pointer;
	font-size: 15px;
	font-weight: 800;
}

button:hover {
	background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary));
}

@media (max-width: 768px) {
	.admin-panel {
		position: static;
		padding: 18px;
	}
}
</style>
