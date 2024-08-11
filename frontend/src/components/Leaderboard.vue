<script setup>
import Trophy from '@/components/Trophy.vue';
import Medal from '@/components/Medal.vue';

import { toRaw } from 'vue';
import bezierEasing from 'bezier-easing';
</script>
<script>
const bezier = bezierEasing(0.25, 0.1, 0.25, 1);

export default {
	props: ['leaderboard'],
	expose: ['toTop', 'focusEntry'],
	data() {
		return {
			animating: false,
			animationQueue: [],
			displayingLeaderboard: [],
			timeoutToTop: null,
			blink: null,
		};
	},
	computed: {
		parsedLeaderboard() {
			let i = 0;
			return this.leaderboard.map(entry => {
				return {
					...entry,
					time: {
						minutes: Math.floor(entry.time / 60000),
						seconds: Math.floor((entry.time % 60000) / 1000),
						milliseconds: entry.time % 1000,
					},
					originalTime: entry.time,
					index: i++
				};
			});
		},
		names() { // using this to update names instantly regardless
			return Object.fromEntries(this.leaderboard.map(entry => [entry.id, entry.player]));
		}
	},
	watch: {
		parsedLeaderboard: {
			handler(newBoard, oldBoard) {
				if (oldBoard == null || oldBoard.length == 0) return this.displayingLeaderboard = this.parsedLeaderboard.map(entry => ({ ...entry }));

				const oldIds = oldBoard.map(entry => entry.id);
				const newIds = newBoard.map(entry => entry.id);

				const newEntries = newBoard.filter(entry => !oldIds.includes(entry.id));
				const removedEntries = oldBoard.filter(entry => !newIds.includes(entry.id));
				const focusEntries = [];

				// find entries where the time changed
				const movedEntries = newBoard.filter(entry => {
					const oldEntry = oldBoard.find(oldEntry => oldEntry.id == entry.id);
					if (oldEntry == null) return false;
					if (oldEntry.originalTime != entry.originalTime) {
						if (oldEntry.index != entry.index) {
							return true;
						} else {
							focusEntries.push(entry);
							return false;
						}
					} 
				});

				newEntries.forEach(entry => {
					this.animationQueue.push({
						type: "add",
						entry: {...entry},
						duration: 1000,
						pause: 1000,
					});
				});

				removedEntries.forEach(entry => {
					this.animationQueue.push({
						type: "remove",
						entry: {...entry},
						duration: 1000,
						pause: 1000,
					});
				});

				movedEntries.forEach(entry => {
					let oldEntry = oldBoard.find(oldEntry => oldEntry.id == entry.id);
					this.animationQueue.push({
						type: "remove",
						entry: {...oldEntry},
						duration: 500,
						pause: 500,
					});
					this.animationQueue.push({
						type: "add",
						entry: {...entry},
						duration: 500,
						pause: 500,
					});
				});

				focusEntries.forEach(entry => {
					this.animationQueue.push({
						type: "focus",
						entry: {...entry},
						duration: 500,
						pause: 500,
						blink: true,
					});
				})
			},
			immediate: true
		},
		animationQueue: {
			handler() {
				if (!this.animating && this.animationQueue.length > 0) {
					this.animating = true;
					clearTimeout(this.timeoutToTop);
					requestAnimationFrame(this.animate);
				}
			},
			deep: true
		}
	},
	methods: {
		animate(timestamp) {
			let currentAnimation = this.animationQueue[0];

			if (currentAnimation == null) {
				this.animating = false;
				return;
			}

			if (currentAnimation.start == null) {
				currentAnimation.start = timestamp;
				currentAnimation.startPosition = this.$refs.list.$el.scrollTop;
				let clientRect = this.$refs.list.$el.getBoundingClientRect();
				if (currentAnimation.entry.index * 100 < clientRect.height/2)
					currentAnimation.endPosition = 0;
				else {
					currentAnimation.endPosition = Math.min(currentAnimation.entry.index * 100 - clientRect.height/2 + 100, this.$refs.list.$el.scrollHeight - clientRect.height);
				}
				if (currentAnimation.endPosition == currentAnimation.startPosition) {
					currentAnimation.start = timestamp - currentAnimation.duration;
				}
			}

			let progress = (timestamp - currentAnimation.start) / currentAnimation.duration;
			if (progress > 1) progress = 1;
			let easedProgress = bezier(progress);
			this.$refs.list.$el.scrollTop = currentAnimation.startPosition + (currentAnimation.endPosition - currentAnimation.startPosition) * easedProgress;

			if (currentAnimation.start + currentAnimation.duration < timestamp && currentAnimation.modified == null) {
				currentAnimation.modified = true;
				if (currentAnimation.type == "add") {
					this.displayingLeaderboard.splice(currentAnimation.entry.index, 0, currentAnimation.entry);
				} else if (currentAnimation.type == "remove") {
					this.displayingLeaderboard.splice(this.displayingLeaderboard.findIndex(player => player.id == currentAnimation.entry.id), 1);
				} else if (currentAnimation.type == "focus") {
					this.displayingLeaderboard.splice(currentAnimation.entry.index, 1, currentAnimation.entry);
					if (currentAnimation.blink) {
						this.blink = currentAnimation.entry.id;
					}
				}
			} else if (currentAnimation.start + currentAnimation.duration + currentAnimation.pause < timestamp) {
				this.blink = null;
				this.displayingLeaderboard.forEach((player, index) => {
					player.index = index;
				});
				this.animationQueue.shift();
				if (this.animationQueue.length == 0) {
					this.animating = false;
					this.timeoutToTop = setTimeout(() => {
						this.focusEntry(this.displayingLeaderboard[0].id, false);
					}, 30000);
					return;
				}
			}

			requestAnimationFrame(this.animate);
		},
		toTop() {
			this.$refs.list.$el.scrollTop = 0;
		},
		focusEntry(id, blink = true) {
			this.animationQueue.push({
				type: "focus",
				entry: this.displayingLeaderboard.find(player => player.id == id),
				duration: 1000,
				pause: 1000,
				blink,
			});
		}
	},
	mounted() {
		this.toTop();
	}
}
</script>
<template>
	<transition-group name="slide-fade" tag="div" class="leaderboard-list" ref="list">
		<div v-for="entry in displayingLeaderboard" :key="entry.id" class="leaderboard-item" :class="{blink: blink == entry.id}">
			<div v-if="entry.index == 0" class="rank">
				<Trophy color="#D3BE00" text="1"/>
			</div>
			<div v-else-if="entry.index <= 2" class="rank">
				<Medal :color="[null, '#758081', '#9B7966'][entry.index]" :text="entry.index+1"/>
			</div>
			<div v-else class="rank">#{{ entry.index+1 }}</div>
			<div class="player">{{ names[entry.id] }}</div>
			<div class="time">{{ ("0" + entry.time.minutes).slice(-2) }}:{{ ("0" + entry.time.seconds).slice(-2) }}.{{ ("00" + entry.time.milliseconds).slice(-3) }}</div>
		</div>
		<div class="dummy" key="dummy"></div>
	</transition-group>
</template>
<style>
.leaderboard-list {
	display: flex;
	flex-flow: column nowrap;
	max-width: 1000px;
	min-width: 300px;
	width: 80%;
	height: 100%;
	overflow-y: hidden;
	padding-top: 10px;
}

.leaderboard-item {
	border: 4px solid #c9c9c9;
	border-radius: 20px;
	height: 80px;
	display: grid;
	grid-template-columns: 20px 80px 1fr auto;
	grid-template-areas: ". rank name time";
	flex-shrink: 0;
	margin-bottom: 20px;
}

.leaderboard-item.blink {
	animation: blink 0.3s infinite ease-in-out;
}

@keyframes blink {
	0%, 100% {
		border: transparent solid 4px;
	}
	50% {
		border: #007a2e solid 4px;
	}
}

.leaderboard-item:first-child .rank {
	transform: scale(1.5);
}

.leaderboard-item .rank {
	grid-area: rank;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 2em;
	transition: transform .2s ease-in-out;
}

.leaderboard-item .player {
	grid-area: name;
	display: flex;
	align-items: center;
	font-size: 2em;
	padding-left: 20px;
}

.leaderboard-item .time {
	grid-area: time;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 2em;
	padding-right: 20px;
}

.dummy {
	height: 160px;
	flex-shrink: 0;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  	transition: all .5s ease-out;
	overflow: hidden;
}

.slide-fade-enter-from, .slide-fade-leave-to {
	height: 0;
	margin-bottom: 0;
	opacity: 0;
	border: transparent solid 0;
}
</style>