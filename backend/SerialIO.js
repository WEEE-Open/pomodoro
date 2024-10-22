import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

import config from './config.js';

import { timer } from './index.js';

export default class SerialIO {
	constructor() {
		this.lastLedState = 'off';
		this.buttons = [
			false,
			false
		];
		this.lastChange = 0;
		this.bothPressed = false;

		this.openTimeout = null;

		this.buffer = '';

		this.serial = new SerialPort({
			path: config.serialPort,
			baudRate: 115200,
			autoOpen: false,
		});

		this.serial.on('data', (data) => {
			this.buffer += data.toString();
			let lines = this.buffer.split('\n');
			this.buffer = lines.pop();
			for (let line of lines) {
				this.handleCommand(line);
			}
		});

		timer.on('timeStart', () => {
			this.setLed('on');
		});
		timer.on('timeStop', () => {
			this.setLed('off');
		});
		timer.on('timeReset', () => {
			this.setLed('blink', 500);
		});
		timer.on('newHighscore', () => {
			this.setLed('blink', 200);
		});

		if (config.serialPort) this.begin();
	}

	begin() {
		this.serial.open((err) => {
			if (err) {
				console.error(err);
				this.openTimeout = setTimeout(() => {
					this.begin();
				}, 1000);
			}
		});
	}

	handleCommand(command) {
		if (command.startsWith('button')) {
			let [_, pin, state] = command.split('-');
			this.handleButtonUpdate(parseInt(pin), parseInt(state) === 1);
		} else if (command.startsWith('reset')) {
			let [_, state] = command.split('-');
			this.handleResetButton(parseInt(state));
		}
	}

	handleButtonUpdate(pin, state) {
		let changed = false;
		if (this.buttons[pin] != state) {
			changed = true;
		}
		this.buttons[pin] = state;
		if (timer.isRunning) {
			if (timer.value < 1000) return;
			if (this.buttons[0] && this.buttons[1]) {
				timer.stop();
				this.lastChange = performance.now();
			}
		} else {
			if (this.lastChange + 1000 > performance.now()) return;
			if (this.buttons[0] != this.buttons[1] && this.bothPressed) {
				timer.start();
				this.lastChange = performance.now();
				this.bothPressed = false;
			} else if (this.buttons[0] && this.buttons[1]) {
				this.bothPressed = true;
			}
		}
	}

	handleResetButton(state) {
		if (state === 1) {
			timer.reset();
			this.bothPressed = false;
		}
	}

	/**
	 * 
	 * @param {('on'|'off'|'blink')} state 
	 * @param {number} interval (optional, only used for 'blink' state)
	 */
	setLed(state, interval = 500) {
		if (state === 'blink') {
			this.lastLedState = 'blink-' + interval;
		} else {
			this.lastLedState = state;
		}
		this.serial.write('\nled-' + this.lastLedState + '\n');
	}
}