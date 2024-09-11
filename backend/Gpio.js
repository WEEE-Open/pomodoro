import rp from 'array-gpio';

import config from './config.js';

import { timer } from './index.js';

export default class Gpio {
	constructor() {
		this.lastButton1Press = -1000;
		this.lastButton2Press = -1000;
		this.button1 = rp.in(config.button1Pin);
		this.button2 = rp.in(config.button2Pin);
		this.resetButton = rp.in(config.resetButtonPin);
		this.led = rp.out(config.ledPin);
		this.ledState = 'off';
		this.blinker = null;

		this.button1.watch('both', this.handleButtonUpdate.bind(this, 1));
		this.button2.watch('both', this.handleButtonUpdate.bind(this, 2));
		this.resetButton.watch('rising', this.handleResetButton);

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
	}

	handleButtonUpdate(pin, state) {
		let states = [null, null];
		states[pin - 1] = state;
		this[`lastButton${pin}Press`] = performance.now();
		for (let i = 0; i < 2; i++) {
			if (states[i] === null) {
				states[i] = this[`button${i + 1}`].state ? 1 : 0;
			}
		}
		if (this.timer.isRunning) {
			for (let i = 0; i < 2; i++) {
				if (states[i] === 0 && performance.now() - this[`lastButton${i + 1}Press`] < 500) { // debounce
					states[i] = 1;
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
			if (this.blinker) {
				clearInterval(this.blinker);
				this.blinker = null;
			}
			this.blinker = setInterval(() => {
				this.led.write(!this.ledPin.state);
			}, interval);
			this.ledState = 'blink';
		} else {
			if (this.blinker) {
				clearInterval(this.blinker);
				this.blinker = null;
			}
			this.led.write(state === 'on');
			this.ledState = state;
		}
	}
}