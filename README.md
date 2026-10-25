# Logic gates simulator rewrite

Live site: https://staywithryan.github.io/logic-gates-simulator-rewrite/

Feature-parity rewrite of [StayWithRyan/logic-gates-simulator](https://github.com/StayWithRyan/logic-gates-simulator). Placing gates, wiring, toggling inputs, live simulation, and custom elements behave like the original Create React App simulator. This version uses Vite, current React, and TypeScript.

## Built-in blocks

The toolbar starts with CREATE (user-saved custom elements) and the original gates, then two ready-made blocks. Pin names are drawn on the gate, top to bottom.

| Block | Inputs | Outputs | Behavior |
| --- | --- | --- | --- |
| BIT | D, EN | Q | Level-sensitive latch. EN high stores D on that tick and drives Q. EN low holds the stored bit across later ticks and ignores D. The bit starts at 0. |
| ADD2 | A1, A0, B1, B0, Cin | S1, S0, Cout | 2-bit adder. A1, B1, and S1 are the high bits. The sum is A + B + Cin (0 through 7). |

Each simulation tick is still one left-to-right pass. BIT keeps its bit on the element between ticks. CREATE still records settled field outputs and does not turn that stored bit into a sequential custom element. The toolbar is a single row, so a very narrow window can omit the last button. BIT and ADD2 are placed before that cutoff on a 1200px-wide window, and a short custom name such as INV still fits after them.

## Install

```sh
npm install
```

## Dev

```sh
npm run dev
```

## Build

```sh
npm run build
```

## Test

```sh
npm test
```
