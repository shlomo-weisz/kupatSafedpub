<template>
	<CodeProtectedComponent>
		<div class="home-shell">
			<div class="page-actions page-actions--mobile-tablet">
				<button class="scan-link" @click="$router.push('/scan-id')">
					<span>מסך צילום תעודה</span>
					<small>צילום, פענוח וסימון קבלה</small>
				</button>
			</div>
			<VolunteerSearch />
			<myLogo />
		</div>
	</CodeProtectedComponent>
</template>

<script>
import VolunteerSearch from "./VolunteerSearch.vue";
import myLogo from "./myLogo.vue";
import CodeProtectedComponent from "./CodeProtectedComponent.vue";

export default {
	components: {
		VolunteerSearch,
		myLogo,
		CodeProtectedComponent,
	},
};
</script>

<style>
.home-shell {
	padding: 20px 0 48px;
}

.page-actions {
	max-width: 1500px;
	margin: 0 auto 18px;
	padding: 0 16px;
	display: flex;
	justify-content: flex-end;
}

.scan-link {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	border: 1px solid var(--color-border-strong);
	background: var(--color-surface);
	color: var(--color-primary);
	padding: 14px 20px;
	border-radius: var(--radius-md);
	cursor: pointer;
	font-size: 14px;
	font-weight: 700;
	box-shadow: var(--shadow-soft);
	backdrop-filter: blur(16px);
}

.scan-link:hover {
	background: var(--color-primary);
	color: #fffaf1;
}

.scan-link small {
	font-size: 12px;
	font-weight: 600;
	opacity: 0.72;
}

@media (min-width: 1281px) {
	.page-actions--mobile-tablet {
		display: none;
	}
}

@media (max-width: 768px) {
	.home-shell {
		padding-top: 14px;
	}

	.page-actions {
		padding: 0 14px;
	}

	.scan-link {
		width: 100%;
		align-items: center;
		text-align: center;
	}
}
</style>
