# 🏹 ARROWHEAD — Infinite Logic

> **An infinite Tap-Away arrow puzzle game built with HTML, CSS and JavaScript.**

ARROWHEAD is a fast-paced logic puzzle where every piece is an arrow.

Your goal is simple:

**Find an arrow with a completely clear path → tap it → remove it.**

But as the levels increase, the board becomes more complex, requiring observation, planning and careful decisions.

---

## 🎮 Live Demo

🌐 **Play ARROWHEAD Online:**

https://mahalakshmikommaranahalli9-cell.github.io/arrowhead/

---

## ✨ Features

### 🏹 Tap-Away Gameplay

Every game piece is a directional arrow:

- ↑ Up
- ↓ Down
- ← Left
- → Right

An arrow can be removed only when its entire path in its direction is clear.

If another arrow blocks the path, the move fails.

---

### ♾️ Infinite Levels

ARROWHEAD uses procedural level generation instead of relying only on manually created levels.

As the level increases:

- Board size increases
- Number of arrows increases
- Puzzle complexity increases
- The challenge continues

There is no fixed final level.

**How far can you go?**

---

### ❤️ Three Lives

Every level starts with:

**❤️ ❤️ ❤️**

Selecting a blocked arrow costs one life.

Lose all three lives and the run ends.

You can retry the same level with fresh lives.

---

### 🧠 Milestone Q&A

Every **10 completed levels**, the game introduces a special:

> 🧠 **BRAIN BREAK**

Instead of arrows, you get a fun multiple-choice question.

Milestones include:

- Level 10
- Level 20
- Level 30
- Level 40
- Level 50
- ...and beyond

Answer correctly to receive a bonus and milestone badge.

---

### 🏅 Badges

Successful milestone questions unlock badges.

Examples include:

- 🧠 FIRST MILESTONE
- ⚡ LOGIC RUNNER
- 🎯 ARROW MASTER
- 💻 CODE THINKER
- 🔥 PUZZLE HUNTER
- 🏆 BRAIN ARCHITECT

Badges are stored locally in the browser.

---

### ⏭️ Skip Mechanism

Don't like the milestone question?

You can skip it.

However:

> **SKIP = lose the milestone badge + score earned in that 10-level block**

This creates an additional risk/reward decision.

---

### 🏆 Local Scoreboard

ARROWHEAD includes a local scoreboard showing the top scores recorded on the current browser/device.

The scoreboard stores:

- Player name
- Score
- Level
- Ranking
- Date

> The scoreboard is currently local to the browser/device and is not an online global leaderboard.

---

### 📊 Dashboard

The dashboard provides information about your progress, including:

- High Score
- Highest Level
- Games Played
- Accuracy
- Best Time
- Perfect Levels
- 🏅 Badges
- 🏆 Local Scoreboard

---

### ⏱️ Timer

Every level tracks completion time.

Fast solving contributes to better performance.

---

### 🎯 Scoring System

Each successfully removed arrow awards points.

The score becomes increasingly challenging as the level increases.

Milestone Q&A questions can provide additional bonus points.

---

### ⏸️ Pause & Resume

The game can be paused during gameplay.

You can:

- Pause
- Resume
- Restart the current level
- Return to dashboard

---

### 🔄 Retry System

When a level is lost:

- The same level can be replayed
- Lives reset to 3
- The player can attempt the puzzle again

---

### 💾 Progress Saving

ARROWHEAD uses browser `localStorage` to save player information and progress.

Saved information includes:

- Player name
- High score
- Highest level
- Games played
- Attempts
- Successful moves
- Best time
- Perfect levels
- Current progress
- Unlocked levels
- Badges
- Milestone Q&A state
- Local scoreboard

---

### 📱 Responsive Design

ARROWHEAD is designed to work across:

- 💻 Desktop
- 💻 Laptop
- 📱 Mobile
- 📱 Tablet

The interface adapts to different screen sizes.

---

### 🌿 Animated Environment

The game includes subtle background nature animations to make the puzzle environment feel more alive.

The background elements are visual only and do not affect gameplay.

---

### 📲 Progressive Web App

ARROWHEAD includes a web app manifest and service worker.

The project can behave like a Progressive Web App on supported devices.

---

# 🕹️ How To Play

## Step 1 — Start

Enter your player name and start the game.

---

## Step 2 — Observe

Look at all the arrows on the board.

Each arrow points toward one of four directions:

```text
        ↑

←       →       →

        ↓
