import EventEmitter from "events";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";

import config from "./config.js";

export default class Timer extends EventEmitter {
	constructor() {
		super();

		this.startTime = null;
		this.value = 0;
		this.interval = null;
		this.isRunning = false;
		this.leaderboard = [];
		this.currentPlayer = '';
		this.anyListeners = [];

		this.loadLeaderboard();
	}

	onAny(listener) {
		this.anyListeners.push(listener);
	}

	offAny(listener) {
		this.anyListeners = this.anyListeners.filter(l => l !== listener);
	}

	emit(event, ...args) {
		this.anyListeners.forEach(listener => listener(event, ...args));
		super.emit(event, ...args);
	}

	async loadLeaderboard() {
		await fs.readFile(config.leaderboardFile).then(data => {
			this.leaderboard = JSON.parse(data);
		}).catch(() => {
			console.log("Could not load leaderboard");
			this.leaderboard = [];
		});
		this.emit("leaderboardUpdate", this.leaderboard);
	}

	start() {
		if (this.isRunning) return;
		this.isRunning = true;
		this.startTime = Date.now();
		this.interval = setInterval(this.updateTime.bind(this), 100);
		this.emit("timeStart");
	}

	updateTime() {
		this.value = Date.now() - this.startTime;
		this.emit("timeUpdate", this.value);
	}

	stop() {
		if (!this.isRunning) return;
		this.isRunning = false;
		clearInterval(this.interval);
		this.updateTime(); // Update one last time
		this.emit("timeStop", this.value);
		this.submitTime();
	}

	reset() {
		this.isRunning = false;
		clearInterval(this.interval);
		this.value = 0;
		this.emit("timeReset");
		this.emit("timeUpdate", this.value);
	}

	updatePlayer(player) {
		this.currentPlayer = player;
		this.emit("playerUpdate", player);
	}

	submitTime({time, player, id, when} = {}) {
		if (!time) time = this.value;
		if (!player) {
			player = this.currentPlayer;
			this.currentPlayer = '';
			this.emit("playerUpdate", '');
		} 
		if (!id) id = uuid();
		if (!when) when = Date.now();
		let newHighscore = false;
		if (this.leaderboard.length != 0 && this.leaderboard[0].time > time) {
			newHighscore = true;
		}
		this.leaderboard.push({ time, id, player, when });
		this.leaderboard.sort((a, b) => a.time - b.time); // is this a good idea? it's probably fine, i don't expect to get more than 1000 entries...
		this.emit("leaderboardUpdate", this.leaderboard);
		if (newHighscore) {
			this.emit("newHighscore", { time, id, player, when });
		}
		fs.writeFile(config.leaderboardFile, JSON.stringify(this.leaderboard));
	}

	deleteEntry(id) {
		this.leaderboard = this.leaderboard.filter(entry => entry.id !== id);
		this.emit("leaderboardUpdate", this.leaderboard);
		fs.writeFile(config.leaderboardFile, JSON.stringify(this.leaderboard));
	}

	modifyEntry(entry) {
		this.leaderboard = this.leaderboard.map(e => e.id === entry.id ? {...e, ...entry} : e);
		this.leaderboard.sort((a, b) => a.time - b.time);
		this.emit("leaderboardUpdate", this.leaderboard);
		fs.writeFile(config.leaderboardFile, JSON.stringify(this.leaderboard));
	}
}