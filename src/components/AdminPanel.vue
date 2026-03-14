<template>
	<div class="admin-panel">
		<div class="menu-section">
			<h3>ניהול</h3>
			<p>לניהול טבלאות, טעינת CSV ובחירת הסט הפעיל.</p>
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
	top: 90px;
	background-color: #f9f9f9;
	border: 1px solid #ddd;
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	width: 250px;
	font-family: Arial, sans-serif;
	text-align: center;
	direction: rtl;
	z-index: 2;
}

.menu-section h3 {
	margin-bottom: 10px;
	font-size: 18px;
	color: #333;
}

.menu-section p {
	color: #555;
	line-height: 1.6;
	margin-bottom: 14px;
}

button {
	width: 100%;
	padding: 10px;
	background-color: #17342d;
	color: white;
	border: none;
	border-radius: 999px;
	cursor: pointer;
	font-size: 14px;
}

button:hover {
	background-color: #0f241f;
}

@media (max-width: 768px) {
	.admin-panel {
		position: static;
		width: 100%;
		margin: 20px auto;
		box-shadow: none;
		border: 1px solid #ccc;
	}
}
</style>
