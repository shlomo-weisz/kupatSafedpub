<template>
	<div class="last-received-box" v-if="lastReceived">
		<p class="last-received-eyebrow">התקבל לאחרונה</p>
		<h3>הלקוח האחרון שסומן</h3>
		<ul class="last-received-list">
			<li><strong>שם משפחה</strong><span>{{ lastReceived.last_name }}</span></li>
			<li><strong>שם האב</strong><span>{{ lastReceived.father_first_name }}</span></li>
			<li><strong>שם האם</strong><span>{{ lastReceived.mother_first_name }}</span></li>
			<li><strong>ילדים נשואים</strong><span>{{ lastReceived.married_children }}</span></li>
			<li><strong>ילדים לא נשואים</strong><span>{{ lastReceived.unmarried_children }}</span></li>
			<li><strong>סה"כ ילדים</strong><span>{{ lastReceived.total_children }}</span></li>
			<li v-if="lastReceived.payment_method">
				<strong>תשלום</strong>
				<span>{{ formatPaymentMethod(lastReceived.payment_method) }}</span>
			</li>
		</ul>
	</div>
</template>

<script>
export default {
	props: {
		lastReceived: {
			type: Object,
			required: false,
		},
	},
	methods: {
		formatPaymentMethod(paymentMethod) {
			const normalizedPaymentMethod = String(paymentMethod || "")
				.trim()
				.toLowerCase();

			if (normalizedPaymentMethod === "cash") {
				return "מזומן";
			}

			if (normalizedPaymentMethod === "credit") {
				return "אשראי";
			}

			return paymentMethod || "";
		},
	},
};
</script>

<style scoped>
.last-received-box {
	margin: 18px 0 0;
	background: rgba(255, 253, 248, 0.86);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: 22px;
	box-shadow: var(--shadow-soft);
	width: 100%;
	text-align: right;
	backdrop-filter: blur(16px);
}

.last-received-eyebrow {
	margin: 0 0 8px;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.12em;
	color: var(--color-accent);
}

.last-received-box h3 {
	margin: 0 0 16px;
	font-size: 22px;
	color: var(--color-primary);
}

.last-received-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 10px;
}

.last-received-list li {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.66);
	direction: rtl;
	color: var(--color-text-muted);
}

.last-received-list strong {
	font-size: 13px;
	color: var(--color-primary);
}

.last-received-list span {
	font-size: 15px;
	font-weight: 700;
	color: var(--color-primary);
}

@media (max-width: 768px) {
	.last-received-box {
		padding: 18px;
	}

	.last-received-box h3 {
		font-size: 20px;
	}

	.last-received-list li {
		padding: 10px 12px;
	}
}
</style>
