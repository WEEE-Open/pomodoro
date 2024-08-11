# Pomodoro

**Programma Opportuno alla Misurazione Ottimale Di Orari Rigorosamente Ottimali**
(Program for optimized mesurement of optiomal times)

This is a program created to measure times of challenges proposed to events, with an integrated leaderboard to show the results.

## Usage

1. `git clone https://github.com/WEEE-Open/pomodoro.git`
2. `cd pomodoro && npm i`
3. `npm run prod`

To view the leaderboard, open in a browser tab `http://localhost:3000`, for the control dashboard `http://localhost:3000/dashboard`.

If run on a raspberry pi, the timer can also be controlled via GPIO, with the following pinout:

|pin|purpose|
|---|-----|
|17 |button 1|
|18 |button 2|
|22 |reset button|
|27 |led output|


## Development

Same sad installation, but you will start with `npm run dev` and the server will be on port 5173.