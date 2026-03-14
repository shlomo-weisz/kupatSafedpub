<template>
	<div class="stats-box">
		<p class="stats-eyebrow">נתוני חלוקה</p>
		<h3>סטטוס בזמן אמת</h3>
		<div class="stats-grid">
			<div class="stat-item">
				<span class="stat-label">קיבלו</span>
				<strong class="stat-value">{{ totalTaken }}</strong>
			</div>
			<div class="stat-item">
				<span class="stat-label">מתוך</span>
				<strong class="stat-value">{{ totalCustomers }}</strong>
			</div>
			<div class="stat-item accent">
				<span class="stat-label">אחוז חלוקה</span>
				<strong class="stat-value">{{ percentageTaken }}%</strong>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		totalTaken: {
			type: Number,
			required: true,
		},
		percentageTaken: {
			type: [Number, String],
			required: true,
		},
		totalCustomers: {
			type: Number,
			required: true,
		},
	},
};
</script>

<style scoped>
.stats-box {
	position: sticky;
	top: 108px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: 22px;
	box-shadow: var(--shadow-soft);
	width: 100%;
	text-align: right;
	z-index: 2;
	backdrop-filter: blur(16px);
}

.stats-eyebrow {
	margin: 0 0 8px;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.12em;
	color: var(--color-accent);
}

.stats-box h3 {
	margin: 0 0 18px;
	font-size: 24px;
	color: var(--color-primary);
}

.stats-grid {
	display: grid;
	gap: 12px;
}

.stat-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.62);
	border: 1px solid rgba(24, 53, 46, 0.08);
}

.stat-item.accent {
	background: rgba(194, 107, 67, 0.12);
}

.stat-label {
	color: var(--color-text-muted);
	font-weight: 700;
}

.stat-value {
	font-size: 24px;
	color: var(--color-primary);
}

@media (max-width: 768px) {
	.stats-box {
		position: static;
		padding: 18px;
	}
}
</style>
