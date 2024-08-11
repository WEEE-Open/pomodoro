<script setup>
import Timer from '@/components/Timer.vue';
import Leaderboard from '@/components/Leaderboard.vue';
</script>
<script>
import io from 'socket.io-client';
import { shallowReactive } from 'vue';

export default {
	data() {
		return {
			socket: null,
			connected: false,
			time: 0,
			isRunning: false,
			leaderboard: [],
			currentPlayer: null,

			randomNumberInterval: null, // tl;dr: the last digits are bullshit

			screen: {
				width: 0,
				height: 0
			}
		};
	},
	computed: {
		randomTime() {
			let time = this.time;
			if (this.isRunning) {
				let fixed = Math.floor(time / 100) * 100;
				time = fixed + Math.floor(Math.random() * 100);
			}
			return time;
		},
		parsedTime() {
			return {
				minutes: Math.floor(this.randomTime / 60000),
				seconds: Math.floor((this.randomTime % 60000) / 1000),
				milliseconds: this.randomTime % 1000,
			};
		}
	},
	watch: {
		isRunning(value) {
			if (value) {
				this.randomNumberInterval = setInterval(() => {
					this.time += 1; // this is a hack to force the component to re-render
				}, 10);
			} else {
				clearInterval(this.randomNumberInterval);
			}
		}
	},
	mounted() {
		this.screen.width = window.innerWidth;
		this.screen.height = window.innerHeight;

		window.addEventListener('resize', () => {
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;
		});
		
		let url = new URL(window.location.href);
		this.socket = shallowReactive(io(url.origin));
		this.socket.on('connect', () => {
			this.connected = true;
		});
		this.socket.on('disconnect', () => {
			this.connected = false;
		});
		this.socket.on('reload', () => {
			window.location.reload();
		});
		this.socket.on('focusEntry', (index) => {
			this.$refs.leaderboard.focusEntry(index);
		});
		this.socket.on('timeStart', () => {
			this.isRunning = true;
		});
		this.socket.on('timeStop', () => {
			this.isRunning = false;
		});
		this.socket.on('timeReset', () => {
			this.isRunning = false;
			this.time = 0;
			this.$refs.leaderboard.toTop();
		});
		this.socket.on('timeUpdate', (time) => {
			this.time = time;
		});
		this.socket.on('leaderboardUpdate', (leaderboard) => {
			this.leaderboard = leaderboard;
		});
	}
}

</script>
<template>
	<Timer :time="parsedTime"/>
	<svg :width="screen.width" height="50">
		<path :d="`M0 50 C${screen.width/4},0 ${screen.width/4*3},0 ${screen.width},50 Z`" fill="#eee"/>
	</svg>
	<div class="leaderboard">
		<h1>Leaderboard</h1>
		<Leaderboard :leaderboard="leaderboard" ref="leaderboard"/>
	</div>
</template>
<style>
body {
	overflow: hidden;
	background: #007a2e;
	-webkit-user-select: none;
	-ms-user-select: none;
	user-select: none;
}

#app {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: auto 50px 1fr;
	height: 100%;
}

.leaderboard {
	background: #eee;
	font-family: 'londrina';
	display: flex;
	flex-flow: column nowrap;
	align-items: center;
	height: 100%;
	width: 100%;
	overflow-y: hidden;
}

.leaderboard h1 {
	text-align: center;
	margin-top: 0;
	font-size: 3em;
}
</style>