<template>
	<div class="volunteer-name-input">
		<label for="volunteerName">שם המתנדב:</label>
		<input
			id="volunteerName"
			v-model="localVolunteerName"
			type="text"
			placeholder="הכנס שם מתנדב"
			@input="emitVolunteerName"
		/>
	</div>
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			localVolunteerName: this.value,
		};
	},
	watch: {
		value(newValue) {
			this.localVolunteerName = newValue;
		},
	},
	methods: {
		emitVolunteerName() {
			this.$emit("update-volunteer-name", this.localVolunteerName);
		},
	},
};
</script>

<style scoped>
.volunteer-name-input {
	position: sticky;
	top: 16px;
	max-width: 1500px;
	margin: 0 auto 18px;
	padding: 16px 20px;
	background: rgba(255, 250, 244, 0.82);
	border: 1px solid rgba(24, 53, 46, 0.12);
	border-radius: 24px;
	box-shadow: 0 20px 46px rgba(24, 53, 46, 0.12);
	display: grid;
	grid-template-columns: auto minmax(260px, 360px);
	justify-content: center;
	align-items: center;
	gap: 14px;
	z-index: 12;
	direction: rtl;
	backdrop-filter: blur(18px);
}

.volunteer-name-input label {
	font-weight: 800;
	color: var(--color-primary);
	font-size: 15px;
}

.volunteer-name-input input {
	padding: 12px 14px;
	font-size: 15px;
	width: 100%;
}

@media (max-width: 768px) {
	.volunteer-name-input {
		position: static;
		grid-template-columns: 1fr;
		width: calc(100% - 28px);
		margin: 0 auto 14px;
		padding: 16px;
		justify-content: stretch;
	}

	.volunteer-name-input input {
		font-size: 16px;
	}
}
</style>
