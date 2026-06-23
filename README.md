# 🌌 BigQuery Release Pulse

A modern, responsive web dashboard built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript** that aggregates, filters, and formats Google Cloud BigQuery release notes, enabling you to compose and share them directly to **X (formerly Twitter)** with a single click.

---

## ✨ Features

### 📡 Live Feed Aggregation & Grouping
* Fetches the live XML Atom feed from Google Cloud: `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`
* Parsed with **BeautifulSoup** to automatically segment date entries into distinct sub-update blocks by type (e.g., `Feature`, `Changed`, `Deprecated`, `Fixed`).
* Cached in-memory for 10 minutes to maintain snappy response times, with support for forced refreshing.

### 🎨 Premium Glassmorphic Dark UI
* Fully responsive layout with grid-based separation of timeline and tweet previews.
* Uses custom HSL color systems, subtle pulsing animations, custom scrollbars, and active card highlights.
* Categorized color badges for different update classes (Feature, Changed, Deprecated, etc.).

### 🐦 Twitter (X) Composer Mockup
* **Realtime Character Circle Indicator**: An interactive SVG circular progress ring that changes color based on remaining space (Cyan ➔ Yellow ➔ Red) and disables the Share button if limits are exceeded.
* **X-Accurate URL Metric**: Follows X's character counting logic, treating any URL as exactly 23 characters regardless of length.
* **Auto-Truncating Templates**: Generate and compose sharing draft text via four custom layouts (Standard, Hype, Detailed, and Minimal) which automatically truncate long texts to fit within the character limit.
* **Realtime Post Mockup**: Dynamic live preview styling matching a dark-mode X post complete with styled verified badges, handles, and highlighted tags/links.

---

## 🛠️ Tech Stack

* **Backend**: Python 3.11, Flask, BeautifulSoup4, Requests
* **Frontend**: Vanilla HTML5, Vanilla CSS3, Javascript (ES6)
* **API Integration**: Twitter Web Intent (`https://twitter.com/intent/tweet`)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Kopparthisonika/Antigravity.git
cd Antigravity
```

### 2. Install dependencies
```bash
python -m pip install -r requirements.txt
```

### 3. Run the development server
```bash
python app.py
```

Open your browser and navigate to:
👉 **http://127.0.0.1:5000**

---

## 📬 Sharing to X
When you click **Post to X**, the application launches a secure X Share Web Intent URL in a new tab. This safely prefills your X tweet box without requiring you to share your official credentials or API keys with the application.