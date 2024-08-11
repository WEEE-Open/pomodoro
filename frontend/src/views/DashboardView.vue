<script setup>

</script>
<script>
import io from 'socket.io-client';
import { shallowReactive, toRaw } from 'vue';

export default {
	data() {
		return {
			socket: null,
			connected: false,
			time: 0,
			isRunning: false,
			leaderboard: [],
			currentPlayer: null,
			editingPlayerId: null,
			editingPlayer: null,
		};
	},
	mounted() {
		let url = new URL(window.location.href);
		this.socket = shallowReactive(io(url.origin));
		this.socket.on('connect', () => {
			this.connected = true;
		});
		this.socket.on('disconnect', () => {
			this.connected = false;
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
		});
		this.socket.on('timeUpdate', (time) => {
			this.time = time;
		});
		this.socket.on('leaderboardUpdate', (leaderboard) => {
			this.leaderboard = leaderboard;
		});
		this.socket.on('playerUpdate', (player) => {
			this.currentPlayer = player;
		});
	},
	computed: {
		parsedTime() {
			return {
				minutes: Math.floor(this.time / 60000),
				seconds: Math.floor((this.time % 60000) / 1000),
				milliseconds: this.time % 1000,
			};
		},
		parsedLeaderboard() {
			let i = 0;
			return this.leaderboard.map(player => {
				return {
					...player,
					time: {
						minutes: Math.floor(player.time / 60000),
						seconds: Math.floor((player.time % 60000) / 1000),
						milliseconds: player.time % 1000,
					},
					index: i++
				};
			});
		}
	},
	watch: {
		leaderboard(newList, oldList) {
			if (this.leaderboard.findIndex(player => player.id === this.editingPlayerId) == -1) {
				this.editingPlayerId = null;
			}
			// find new entry
			let newEntry = newList.find(player => !oldList.find(oldPlayer => oldPlayer.id === player.id));
			if (newEntry) {
				this.editingPlayerId = newEntry.id;
			}
		},
		editingPlayerId() {
			if (this.editingPlayerId) {
				let search = this.leaderboard.find(player => player.id === this.editingPlayerId);
				if (search) {
					this.editingPlayer = { ...search }; // Clone the object
				}
			} else {
				this.editingPlayer = null;
			}
		},
		editingPlayer: {
			handler() {
				let original = this.leaderboard.find(player => player.id === this.editingPlayerId);
				if (!original) {
					return;
				}
				let edited = false;
				for (let key in this.editingPlayer) {
					if (this.editingPlayer[key] != original[key]) {
						edited = true;
						break;
					}
				}
				if (edited) {
					this.socket.emit('modifyEntry', this.editingPlayer);
				}
			},
			deep: true
		},
	},
	methods: {
		toggleSelection(player) {
			if (this.editingPlayerId == player) {
				this.editingPlayerId = null;
			} else {
				this.editingPlayerId = player;
			}
		},
		deleteEntry(entry) {
			let minutes = Math.floor(entry.time / 60000);
			let seconds = Math.floor((entry.time % 60000) / 1000);
			let milliseconds = entry.time % 1000;
			// ask for confirmation
			if (confirm(`Are you sure you want to delete this entry (${entry.player} [${entry.id}]: ${("0" + minutes).slice(-2) }:${ ("0" + seconds).slice(-2) }.${ ("00" + milliseconds).slice(-3) })?`)) {
				this.socket.emit('deleteEntry', entry.id);
			}
		}
	}
}
</script>
<template>
	<div>
		<div v-if="!connected" style="float: right;">Connecting...</div>
		<h1>Pomodoro</h1>
		<button @click="socket.emit('reload')" class="btn">Reload</button>
		<h2>Time: {{ ("0" + parsedTime.minutes).slice(-2) }}:{{ ("0" + parsedTime.seconds).slice(-2) }}.{{ ("00" + parsedTime.milliseconds).slice(-3) }} ({{ time }})</h2>
		<div class="buttons">
			<button v-if="!isRunning" @click="socket.emit('start')" style="background: #7f7">Start</button>
			<button v-else @click="socket.emit('stop')" style="background: #f77">Stop</button>
			<button @click="socket.emit('reset')">Reset</button>
		</div>
		<h2>Current player: <input type="text" :value="currentPlayer" @keyup="socket.emit('updatePlayer', $event.target.value)"/></h2>
		<template v-if="editingPlayerId">
			<div class="title-buttons">
				<h2>Edit entry</h2>
				<div>
					<button @click="socket.emit('focusEntry', editingPlayer.id)">Focus</button>
					<button @click="deleteEntry(editingPlayer)">Delete</button>
				</div>
			</div>
			<div>
				<label for="player">Player: </label>
				<input type="text" v-model="editingPlayer.player" id="player"/>
			</div>
			<div>
				<label for="time">Time: </label>
				<input type="number" v-model="editingPlayer.time" id="time"/>
			</div>
			<div>
				<h3>Add penalties</h3>
				<div class="buttons-list">
					<button @click="editingPlayer.time -= 1000">-1s</button>
					<button @click="editingPlayer.time += 1000">+1s</button>
					<button @click="editingPlayer.time += 3000">Missing cable +3s</button>
					<button @click="editingPlayer.time += 5000">Improperly fastened/missing screw +5s</button>
					<button @click="editingPlayer.time += 7000">Case not closed correctly +7s</button>
					<button @click="editingPlayer.time += 10000">Incorrectly installed ram +10s</button>
				</div>
			</div>
		</template>
	</div>
	<div>
		<h2>Leaderboard</h2>
		<table>
			<tr>
				<th></th>
				<th>Player</th>
				<th>Time</th>
			</tr>
			<tr v-for="player in parsedLeaderboard" :key="player.id" @click.prevent="toggleSelection(player.id)" :class="{selected:editingPlayerId == player.id}">
				<td>
					<input type="checkbox" :checked="editingPlayerId == player.id"/>
				</td>
				<td class="player">{{ player.player }}</td>
				<td>{{ ("0" + player.time.minutes).slice(-2) }}:{{ ("0" + player.time.seconds).slice(-2) }}.{{ ("00" + player.time.milliseconds).slice(-3) }}</td>
			</tr>
		</table>
	</div>
</template>
<style>
body, html {
	background: #111;
	color: #eee;
}

#app {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	height: 100%;
}

@media screen and (max-width: 600px) {
	#app {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}

#app > div {
	padding: 20px;
}

.buttons {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

.buttons button {
	font-size: 1.5em;
	padding: 10px;
	margin: 10px;
	border: none;
	border-radius: 5px;
}

.title-buttons {
	display: grid;
	grid-template-columns: 1fr auto;
}

.title-buttons>div {
	margin: .75em 0;
}

.title-buttons button {
	font-size: 1em;
	padding: 5px;
	margin: 5px;
	border: none;
	border-radius: 5px;
}

.buttons-list {
	display: grid;
	grid-template-columns: 1fr;
	gap: 5px;
}

.buttons-list button, .btn {
	font-size: 1em;
	padding: 10px;
	border: none;
	border-radius: 5px;
	width: 100%;
}

table {
	width: 100%;
	border-collapse:separate; 
	border-spacing: 0 10px;
}

table td {
	cursor: pointer;
}

table tr.selected {
	background: #333;
}

table .player {
	width: 100%;
}

input[type="checkbox"] {
	transform: scale(1.5);
}

input[type="text"], input[type="number"] {
	width: calc(100% - 10px);
	font-size: 1em;
	padding: 5px;
	border: none;
	border-radius: 5px;
}
</style>