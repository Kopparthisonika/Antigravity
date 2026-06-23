# 🌌 BigQuery Release Pulse

[![Flask](https://img.shields.io/badge/Flask-3.0.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

> An interactive, glassmorphic dashboard built to fetch Google Cloud BigQuery release notes and instantly share updates to X (formerly Twitter) with a custom, Twitter-accurate live composer.

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#%EF%B8%8F-system-architecture)
4. [Tech Stack](#-tech-stack)
5. [Getting Started](#-getting-started)
6. [API Reference](#-api-reference)
7. [X (Twitter) Share Logic](#-x-twitter-share-logic)
8. [License](#-license)

---

## 🔍 Overview

**BigQuery Release Pulse** fetches the official Google Cloud BigQuery release feed, parses and groups complex updates, and places them into a high-end dashboard. Users can easily browse features, search for keywords, filter by update type, and immediately share them to X/Twitter using structured templates.

---

## ✨ Key Features

* **📡 Live Feed Synchronization**: Fetches feed items from Google Cloud's official XML feed and segments them dynamically based on update category titles.
* **🏷️ Type-based Badging**: Auto-tags updates with color-coded badges indicating `Feature`, `Changed`, `Deprecated`, `Fixed`, or `Other`.
* **🔍 Live Filtering & Search**: Instant keyword filtering across titles, descriptions, and types, complete with clean empty states.
* **🚀 Live Mockup Twitter Composer**: Real-time interactive mockup card of a dark-mode X post, showing exactly how the draft text will render.
* **📏 Exact Character Length Rules**: Uses X's proprietary character counting logic (e.g. treating every URL as exactly 23 characters) to ensure tweets never exceed the 280-character limit.
* **⏱️ Character Counter Progress Ring**: Uses a circular SVG offset indicator that turns yellow as you approach the limit, red when exceeded, and locks the share button.
* **📋 Multi-Format Share Templates**: Switch between **Standard**, **Product Hype**, **Detailed**, and **Minimal** templates which auto-truncate content to fit URL sizes.
* **🧼 Secure Web Intent Integration**: Launches standard Twitter/X sharing handlers, ensuring no account details, API keys, or permissions are shared with this local application.

---

## 🛠️ System Architecture

The application implements a single-page architecture connecting a lightweight Flask API with a reactive CSS/JS user interface.

```
BigQuery Release Pulse/
├── app.py                     # Flask Server & XML Atom Feed Parser
├── requirements.txt           # Project Dependencies
├── .gitignore                 # Tracked Files Exclusion Rules
├── templates/
│   └── index.html             # Dashboard Structure, SVG Icons, Skeleton Screens
└── static/
    ├── css/
    │   └── style.css          # Glassmorphic Stylesheet, Animations, X Mockup CSS
    └── js/
        └── app.js             # State Controller, Templates, Char Counters, Intents
```

---

## 💻 Tech Stack

### Backend
* **Python 3.11** - Main engine.
* **Flask** - Server routing and JSON API hosting.
* **BeautifulSoup4** - XML/HTML tag processing, parsing, and layout grouping.
* **Urllib / Requests** - Feed retrieval with timeouts.

### Frontend
* **HTML5** - Semantic layout and embedded vectors (SVGs).
* **CSS3 (Vanilla)** - Variables, glassmorphic filters, responsive Grid/Flex, transition timelines, and pulsing keyframe animations.
* **JavaScript (ES6)** - State management, string regex formatters, event listener routing, and DOM manipulation.

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure that Python 3.11 or newer is installed on your machine.

### 🔌 1. Install Dependencies
Run the installation command in your project directory:
```bash
python -m pip install -r requirements.txt
```

### 🛰️ 2. Run the Server
Start the Flask development server:
```bash
python app.py
```

### 🖥️ 3. Access the Dashboard
Open your preferred web browser and visit:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📡 API Reference

### Get Release Notes Feed
Returns a cached list of release entries parsed from the Google Cloud BigQuery feed.

* **URL**: `/api/feed`
* **Method**: `GET`
* **Params**: `refresh=[true|false]` (Force fetches from the source and invalidates the cache).
* **Response Example (`200 OK`)**:
```json
{
  "last_updated": "2026-06-23 17:45:10",
  "entries": [
    {
      "id": "entry-0",
      "title": "June 22, 2026",
      "date": "June 22, 2026",
      "updated": "2026-06-22T00:00:00-07:00",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_22_2026",
      "updates": [
        {
          "id": "up-0-0",
          "type": "Feature",
          "html": "<p>You can use the BigQuery Data Transfer Service...</p>",
          "text": "You can use the BigQuery Data Transfer Service to transfer metadata..."
        }
      ]
    }
  ]
}
```

---

## 🐦 X (Twitter) Share Logic

### URL Character Calculation
On Twitter, links are automatically shortened using the `t.co` service. This means **every URL counts as exactly 23 characters**, regardless of its actual link length. The composer uses the following regex to calculate lengths accurately:

```javascript
function countTwitterChars(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    const textWithoutUrls = text.replace(urlRegex, '');
    return textWithoutUrls.length + (urls.length * 23);
}
```

### Content Auto-Truncation
When loading a template, the composer determines the maximum space remaining for the note's description:
$$\text{Max Content Chars} = 280 - \text{Template Chars (with URLs counted as 23)}$$
If the release description exceeds this limit, it is cleanly truncated with `...` before formatting, guaranteeing the post stays under 280 characters.

---

## 📝 License
This project is open-source and available under the MIT License.