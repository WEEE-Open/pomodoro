import yargs from 'yargs';
import { arch } from "node:process";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import fs from "fs";

import config from "./config.js";

const argv = yargs(process.argv.slice(2))
	.option("prod", {
		alias: "p",
		type: "boolean",
		default: false,
		description: "Run in production mode",
	})
	.help()
	.alias("help", "h")
	.argv;

import Timer from "./Timer.js";
import SerialIO from "./SerialIO.js";

export const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, { 
	cors: {
		origin: "*",
	}, 
});

export const timer = new Timer();
export const serialIO = new SerialIO();

if (["arm", "arm64"].includes(arch)) {
	const gpio = new (await import("./Gpio.js")).default();
}

if (argv.prod) {
	console.log("WARNING: running in production mode")

	app.use(express.static('../frontend/dist'));

	app.use((req, res) => {
		res.setHeader('Content-Type', 'text/html')
		fs.createReadStream('../frontend/dist/index.html').pipe(res);
	})
}


io.on("connection", (socket) => {
	socket.on("reload", () => {
		io.emit("reload");
	});

	socket.on("focusEntry", (entry) => {
		io.emit("focusEntry", entry);
	});

	socket.on("start", () => {
		timer.start();
	});

	socket.on("stop", () => {
		timer.stop();
	});

	socket.on("reset", () => {
		timer.reset();
	});

	socket.on("updatePlayer", (player) => {
		timer.updatePlayer(player);
	});

	socket.on("modifyEntry", (entry) => {
		timer.modifyEntry(entry);
	});

	socket.on("deleteEntry", (entry) => {
		timer.deleteEntry(entry);
	});

	if (timer.isRunning) {
		socket.emit("timeStart");
	}
	socket.emit("timeUpdate", timer.value);
	socket.emit("playerUpdate", timer.currentPlayer);
	socket.emit("leaderboardUpdate", timer.leaderboard);
});

timer.onAny((event, ...args) => {
	io.emit(event, ...args);
});


httpServer.listen(config.port, () => {
	console.log("Server running on port " + config.port);
});