import { SerialPort } from 'serialport';

import config from './config.js';

import { timer } from './index.js';

export default class SerialIO {
	constructor() {
		this.lastLedState = 'off';
		this.lastButton1Press = -1000;
		this.lastButton2Press = -1000;
		this.states = [0, 0];
		this.openTimeout = null;

		this.buffer = '';

		this.serial = new SerialPort({
			path: config.serialPort,
			baudRate: 9600,
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

		timer.on('start', () => {
			this.setLed('on');
		});
		timer.on('stop', () => {
			this.setLed('off');
		});
		timer.on('reset', () => {
			this.setLed('off');
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
			this.handleButtonUpdate(parseInt(pin), parseInt(state));
		} else if (command.startsWith('resetButton')) {
			let [_, state] = command.split('-');
			this.handleResetButton(parseInt(state));
		}
	}

	handleButtonUpdate(pin, state) {
		this.states[pin] = state;
		this[`lastButton${pin}Press`] = performance.now();
		if (this.timer.isRunning) {
			for (let i = 0; i < 2; i++) {
				if (this.states[i] === 0 && performance.now() - this[`lastButton${i + 1}Press`] < 500) { // debounce
					this.states[i] = 1;
				}
			}
			if (states.every(s => s === 1)) {
				timer.stop();
			}
		} else {
			if (states.every(s => s === 0)) {
				timer.start();
				this.lastButton1Press -= 1000;
				this.lastButton2Press -= 1000;
			}
		}
	}

	handleResetButton(state) {
		if (state === 1) {
			timer.reset();
		}
	}

	/**
	 * 
	 * @param {('on'|'off'|'blink')} state 
	 * @param {number} interval (optional, only used for 'blink' state)
	 */
	setLed(state, interval = 500) {
		if (state === 'blink') {
			this.lastLedState = 'blink' + interval;
		} else {
			this.lastLedState = state;
		}
		this.serial.write('\nled-' + this.lastLedState + '\n');
	}
}