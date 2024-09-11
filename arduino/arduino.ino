#include <ezButton.h>

#define BUTTON0 2
#define BUTTON1 3
#define RESETBUTTON 4
#define LED 13

ezButton button0(BUTTON0);
ezButton button1(BUTTON1);
ezButton resetButton(RESETBUTTON);

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  button0.setDebounceTime(50);
  button1.setDebounceTime(50);
  resetButton.setDebounceTime(50);
}

#define LOW 0
#define HIGH 1
#define BLINKING 2

int ledState = LOW;
int blinkTime = 1000;
unsigned long lastTime = 0;

void loop() {
  button0.loop();
  button1.loop();
  resetButton.loop();

  if (button0.isPressed()) {
	Serial.println("button-0-1");
  }

  if (button0.isReleased()) {
	Serial.println("button-0-0");
  }

  if (button1.isPressed()) {
	Serial.println("button-1-1");
  }

  if (button1.isReleased()) {
	Serial.println("button-1-0");
  }

  if (resetButton.isPressed()) {
	Serial.println("reset-1");
  }

  if (resetButton.isReleased()) {
	Serial.println("reset-0");
  }

  if (Serial.available()) {
	String command = Serial.readStringUntil('\n');
	if (command == "led-on") {
	  ledState = HIGH;
	  digitalWrite(LED, HIGH);
	} else if (command == "led-off") {
	  ledState = LOW;
	  digitalWrite(LED, LOW);
	} else if (command.startsWith("led-blink")) {
	  ledState = BLINKING;
	  blinkTime = command.substring(10).toInt();
	  lastTime = millis();
	}
  }

  if (ledState == BLINKING) {
	if (millis() - lastTime > blinkTime) {
	  lastTime += blinkTime;
	  digitalWrite(LED, !digitalRead(LED));
	}
  }
}
