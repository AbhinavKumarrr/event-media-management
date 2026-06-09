# EventLens — Event & Media Management Platform

**Live Demo:** https://event-media-management.onrender.com/

EventLens is a modern event media management platform built for clubs, societies, photographers, and members to organize event albums, upload media, discover photos, and interact with content in a clean dashboard-style interface.

---

## Overview

Clubs and societies often generate a large number of event photos and videos, but these files are usually scattered across multiple drives, personal folders, and cloud links. EventLens solves this by providing a centralized platform for:

- event-wise media organization
- public/private access control
- social-media-like interactions
- smart image tagging and discovery
- personalized photo matching
- watermark-based downloads
- stories/highlights
- gallery analytics
- cloud-based media storage using AWS S3

---

## Problem Statement Coverage

This project was designed to address the following needs:

- Create and manage events
- Organize event-wise albums
- Upload photos and videos
- Support bulk upload and drag-and-drop
- Show media preview before upload
- Provide access control using user roles
- Enable likes, comments, sharing, and favourites
- Support AI-style media tagging and search
- Add watermark on download
- Store and serve media through AWS S3

---

## Features

### 1) Event Management
- Create and manage events
- Event-wise albums
- Event descriptions and metadata
- Sorting by:
  - event name
  - date
  - category

### 2) Media Upload System
- Upload photos and videos
- Bulk uploads
- Drag-and-drop upload support
- Media preview before upload
- Duplicate detection
- Cloud upload flow through AWS S3

### 3) Access Control & Authentication
- Login and register screens
- Role-based access control
- Suggested roles supported:
  - Admin
  - Photographer
  - Club Member
  - Viewer
- Public media visible to everyone
- Private media visible only to authorized roles

### 4) Social Features
- Like
- Comment
- Share
- Download
- Add to favourites
- Notifications panel
- Stories/highlights section
- QR album sharing

### 5) AI / ML Style Features
- Smart image tagging based on event/media context
- Advanced search by event, tag, caption, user, and date-related text
- Personalized discovery section
- Duplicate media detection
- AI caption-style previews

> Note: the current frontend demonstrates AI-style behavior using rule-based logic and demo matching. It is designed so real ML or face-recognition services can be added later.

### 6) Cloud Integration
- Media storage integrated with AWS S3
- Cloud-based upload and retrieval flow
- Designed for scalable media hosting
- Signed URLs / cloud access flow through backend integration

### 7) Watermarking System
- Automatic watermarking during download
- Dynamic watermark content based on:
  - club name
  - event name
  - user role

### Bonus Features
- Infinite scrolling gallery
- QR-based album sharing
- Story/highlight feature
- Collaborative gallery-style browsing
- Analytics dashboard
- PWA-style experience
- Offline-friendly UI behavior

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Cloud Storage:** AWS S3
- **UI:** Custom responsive dashboard layout
- **Deployment:** Render

---

## Database Schema

For a production-ready version, the following schema is recommended:

### Users
- id
- name
- email
- password
- role
- profilePicture
- createdAt

### Events
- id
- name
- date
- category
- description
- club
- visibility
- createdBy
- createdAt

### Media
- id
- eventId
- uploaderId
- title
- type
- mediaUrl
- tags
- caption
- likes
- favourites
- visibility
- uploadedAt
- fileHash

### Comments
- id
- mediaId
- userId
- text
- createdAt

### Notifications
- id
- userId
- message
- isRead
- createdAt

---

## Architecture Diagram

### Production Architecture

```text
+------------------+
|   User Browser   |
+------------------+
         |
         v
+---------------------------+
| Frontend (HTML/CSS/JS)    |
+---------------------------+
         |
         v
+---------------------------+
| Backend API (Node.js)     |
+---------------------------+
    |            |          |
    v            v          v
+--------+   +---------+   +-----------+
|MongoDB |   | AWS S3  |   | AI/ML API |
+--------+   +---------+   +-----------+

```
---

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
```t
---

Author

Abhinav Kumar

---
