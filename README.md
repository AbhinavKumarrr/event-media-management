# EventLens — Event & Media Management Platform

**Live Demo:** [https://event-media-management.onrender.com/](https://event-media-management.onrender.com/)

EventLens is a modern event media management platform built for clubs, societies, photographers, and members to organize event albums, upload media, discover photos, and interact with content in a clean dashboard-style interface.

---

## Overview

Clubs and societies often generate a large amount of event photos and videos, but these files are usually scattered across multiple drives, personal folders, and cloud links. EventLens solves this by providing a centralized platform for:

* event-wise media organization
* public/private access control
* social-media-like interactions
* smart image tagging and discovery
* personalized photo matching
* watermark-based downloads
* stories/highlights
* gallery analytics

---

## Features

### 1) Event Management

* Create and manage events
* Event-wise albums
* Event descriptions and metadata
* Sorting by:

  * event name
  * date
  * category

### 2) Media Upload System

* Upload photos and videos
* Bulk uploads
* Drag-and-drop upload support
* Media preview before upload
* Duplicate detection
* Optimized upload flow for future cloud storage integration

### 3) Access Control & Authentication

* Login and register screens
* Role-based access control
* Suggested roles supported:

  * Admin
  * Photographer
  * Club Member
  * Viewer
* Public media visible to everyone
* Private media visible only to authorized roles

### 4) Social Features

* Like
* Comment
* Share
* Download
* Add to favourites
* Notifications panel
* Stories/highlights section
* QR album sharing

### 5) AI / ML Style Features

* Smart image tagging based on event/media context
* Advanced search by event, tag, caption, user, and date-related text
* Personalized discovery section
* Duplicate media detection
* AI caption-style previews

> Note: the current public frontend shows AI-style behavior using rule-based logic and demo matching. It is designed so real ML or face-recognition services can be added later.

### 6) Cloud Integration

* Cloud-ready architecture
* Designed to integrate with AWS S3 for media storage
* Frontend includes cloud-oriented UI and upload flow

> Note: if your current public deployment is frontend-only, AWS S3 can be connected later through a backend layer.

### 7) Watermarking System

* Automatic watermarking during download
* Dynamic watermark content based on:

  * club name
  * event name
  * user role

### Bonus Features

* Infinite scrolling gallery
* QR-based album sharing
* Story/highlight feature
* Collaborative gallery-style browsing
* Analytics dashboard
* PWA-style experience
* Offline-friendly UI behavior

---

## Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Storage:** LocalStorage for current frontend demo
* **UI:** Custom responsive dashboard layout
* **Deployment:** Render

---

## Folder Structure

```text
EventLens/
├── index.html
├── style.css
├── script.js
├── manifest.json
├── sw.js
├── package.json
├── package-lock.json
├── server.js (if backend is used)
└── .env (not committed)
```

---

## How to Run Locally

1. Clone the repository.
2. Open the project in VS Code.
3. Open `index.html` in a browser, or use Live Server.
4. Login/register with a valid user.
5. Explore events, upload previews, gallery, stories, analytics, and downloads.

---

## Deployment

The frontend is deployed on Render as a static site.

**Live Demo:** [https://event-media-management.onrender.com/](https://event-media-management.onrender.com/)

If you update the code on GitHub, Render will auto-deploy the latest version.

---

## Requirement Coverage

| Requirement                     | Status                            |
| ------------------------------- | --------------------------------- |
| Event Management                | Implemented                       |
| Media Upload System             | Implemented                       |
| Access Control & Authentication | Implemented                       |
| Social Features                 | Implemented                       |
| AI/ML Features                  | Demo / Rule-based implementation  |
| Cloud Integration (AWS S3)      | Cloud-ready / backend-connectable |
| Watermarking System             | Implemented                       |

---
## Author

**Abhinav Kumar**

---

## License

This project is for academic and demonstration purposes.
