<script setup>

</script>
<script>
export default {
	props: ['screen', 'color'],
	data() {
		return {
			offset: 0,
			lastTimestamp: 0
		}
	},
	computed: {
		l() {
			return Math.sqrt(Math.pow(screen.width, 2) + Math.pow(screen.height, 2));
		},
		rays() { // `M ${screen.width/2} ${screen.height/2} L ${screen.width/2 + l * Math.cos(i * Math.PI / 5 + offset)} ${screen.height/2 + l * Math.sin(i * Math.PI / 5 + offset)} L ${screen.width/2 + l * Math.cos((i + 0.5) * Math.PI / 5 + offset)} ${screen.height/2 + l * Math.sin((i + 0.5) * Math.PI / 5 + offset)}`
			let path = `M ${this.screen.width/2} ${this.screen.height/2} `;
			for (let i = 0; i < 10; i++) {
				path += `L ${this.screen.width/2 + this.l * Math.cos(i * Math.PI / 5 + this.offset)} ${this.screen.height/2 + this.l * Math.sin(i * Math.PI / 5 + this.offset)} L ${this.screen.width/2 + this.l * Math.cos((i + 0.5) * Math.PI / 5 + this.offset)} ${this.screen.height/2 + this.l * Math.sin((i + 0.5) * Math.PI / 5 + this.offset)} L ${this.screen.width/2} ${this.screen.height/2}`;
			}
			return path;
		}
	},
	mounted() {
		this.lastTimestampt = performance.now();
		requestAnimationFrame(this.animate);
	},
	methods: {
		animate(timestamp) {
			const delta = timestamp - this.lastTimestamp;
			this.lastTimestamp = timestamp;
			this.offset = (this.offset + 0.0005 * delta) % (Math.PI / 5);
			requestAnimationFrame(this.animate);
		}
	}
}
</script>
<template>
	<svg :width="screen.width" :height="screen.height">
		<defs>
			<radialGradient id="Background">
				<stop offset="0%" stop-color="#0004" />
				<stop offset="100%" stop-color="transparent" />
			</radialGradient>
			<radialGradient id="Rays">
				<stop offset="0%" :stop-color="`color-mix(in srgb, ${color} 75%, transparent)`" />
				<stop offset="100%" stop-color="transparent" />
			</radialGradient>
			<radialGradient id="Gloom">
				<stop offset="50%" stop-color="transparent" />
				<stop offset="100%" stop-color="#0004" />
			</radialGradient>
		</defs>
		<rect x="0" y="0" :width="screen.width" :height="screen.height" fill="url(#Background)" />
		<path :d="rays" fill="url(#Rays)"/>
		<circle :cx="screen.width/2" :cy="screen.height/2" r="300" fill="#f30e" />
		<slot />
		<rect x="0" y="0" :width="screen.width" :height="screen.height" fill="url(#Gloom)" />
	</svg>
</template>
<style scoped>
svg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>