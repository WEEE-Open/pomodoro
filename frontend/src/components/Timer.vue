<script setup>

</script>
<script>
export default {
	props: ['time']
}
</script>
<template>
	<div class="timer outline">
		<div class="big">
			<span v-if="time.minutes < 10" class="dark">0</span>{{ time.minutes }}:{{ ("0" + time.seconds).slice(-2) }}
		</div>
		<div class="small">
			.{{ ("00" + time.milliseconds).slice(-3) }}
		</div>
	</div>
</template>
<style scoped>
.timer {
	font-family: 'knewave';
	display: grid;
	grid-template-columns: 0.5fr 1fr 1fr;
	grid-template-areas: ". big small";
	align-items: end;
	width: 100%;
	color: #eee;
}

.timer .dark {
	color: #999;
}

.timer .big {
	font-size: 10em;
	grid-area: big;
	justify-self: end;
	z-index: 2;
}

.timer .small {
	color: #ddd;
	font-size: 5em;
	grid-area: small;
	justify-self: start;
	padding-bottom: 25px;
	margin-left: -25px;
	z-index: 1;
}

.outline {
	filter: drop-shadow(10px 10px 0 #1C661A);
} 
</style>