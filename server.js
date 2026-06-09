const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const s3Configured = !!(
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

const s3 = s3Configured
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
  : null;

// ==========================================
// IN-MEMORY STORES
// ==========================================
const mediaStore = [];
const usersStore = [];
const notificationsStore = [
  "Welcome to EventLens — your event media platform!",
  "AWS S3 cloud integration ready. Configure .env to enable uploads."
];
const eventsStore = [
  {
    id: 1,
    name: "Freshers Party",
    date: "2026-08-12",
    category: "Cultural",
    description: "Welcome event for new students.",
    visibility: "public",
    club: "Cultural Club",
    cover: "linear-gradient(135deg,#6366f1,#a78bfa)"
  },
  {
    id: 2,
    name: "Workshop on Web Dev",
    date: "2026-08-18",
    category: "Workshop",
    description: "Hands-on frontend and backend session.",
    visibility: "private",
    club: "Tech Club",
    cover: "linear-gradient(135deg,#0f766e,#34d399)"
  }
];

// ==========================================
// UTILITIES
// ==========================================
function smartTags(text = "") {
  const s = text.toLowerCase();
  const tags = [];
  if (/(mountain|hill|trek|trip|travel)/.test(s)) tags.push("mountains");
  if (/(beach|sea|ocean|water)/.test(s)) tags.push("beach");
  if (/(sport|match|game|football|cricket|basketball)/.test(s)) tags.push("sports");
  if (/(crowd|people|group|fest|party)/.test(s)) tags.push("crowd");
  if (/(code|dev|workshop|tech|computer|laptop)/.test(s)) tags.push("workshop");
  if (/(dance|music|stage|performance|concert)/.test(s)) tags.push("stage");
  return tags.length ? [...new Set(tags)] : ["event"];
}

function generateAICaption(title, eventName, tags) {
  const tag = tags[0] || "event";
  return `A memorable moment from ${eventName || "the event"} — ${tag} vibes captured perfectly.`;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = { name: "Guest", email: "guest@example.com", role: "Viewer" };
    return next();
  }

  const matchingUser = usersStore.find(u => u.token === token);
  req.user = matchingUser
    ? matchingUser
    : { name: "Authenticated User", email: "user@example.com", role: "Viewer" };
  next();
}

function sanitizeKey(fileName) {
  return `media/${Date.now()}-${fileName}`.replace(/\s+/g, "_");
}

async function getMediaSrc(item) {
  if (item.localSrc) return item.localSrc;
  if (!s3Configured || !item.key) return null;
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: item.key }),
    { expiresIn: 900 }
  );
}

// ==========================================
// API ROUTES
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    s3Configured,
    mediaCount: mediaStore.length,
    eventCount: eventsStore.length
  });
});

app.get("/api/analytics", (req, res) => {
  const totalLikes = mediaStore.reduce((s, m) => s + (m.likes || 0), 0);
  const totalFavs = mediaStore.filter(m => m.favourites).length;
  const publicCount = mediaStore.filter(m => m.visibility === "public").length;
  const privateCount = mediaStore.filter(m => m.visibility === "private").length;

  res.json({
    events: eventsStore.length,
    media: mediaStore.length,
    likes: totalLikes,
    favourites: totalFavs,
    public: publicCount,
    private: privateCount,
    duplicatesBlocked: mediaStore.filter(m => m.wasDuplicate).length
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Fill every register field." });
  }
  if (usersStore.some(u => u.email === email)) {
    return res.status(400).json({ message: "User email already registered." });
  }

  const mockToken = `mock-jwt-token-${Date.now()}`;
  const newUser = { name, email, password, role: role || "Viewer", token: mockToken };
  usersStore.push(newUser);

  res.status(201).json({
    user: { name: newUser.name, email: newUser.email, role: newUser.role },
    token: newUser.token
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = usersStore.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid email or password." });

  res.json({
    user: { name: user.name, email: user.email, role: user.role },
    token: user.token
  });
});

app.get("/api/me", authenticateToken, (req, res) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ message: "No active token session found." });
  }
  res.json(req.user);
});

app.get("/api/events", (req, res) => {
  res.json(eventsStore);
});

app.post("/api/events", (req, res) => {
  const { name, date, category, description, club, visibility } = req.body;
  if (!name || !date || !category) {
    return res.status(400).json({ message: "Missing required event fields" });
  }

  const newEvent = {
    id: Date.now(),
    name,
    date,
    category,
    description: description || "",
    club: club || "General Club",
    visibility: visibility || "public",
    cover: `linear-gradient(135deg,#6366f1,#a78bfa)`
  };

  eventsStore.push(newEvent);
  notificationsStore.unshift(`New event created: ${newEvent.name}`);
  res.status(201).json(newEvent);
});

/**
 * AWS S3: Request presigned upload URL (direct browser-to-S3 upload)
 */
app.post("/api/media/request-presigned-url", authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType, eventId } = req.body;
    if (!fileName) return res.status(400).json({ message: "fileName required" });

    const key = sanitizeKey(fileName);

    if (!s3Configured) {
      return res.json({
        uploadUrl: `http://localhost:${process.env.PORT || 5000}/api/media/local-upload`,
        key,
        localMode: true
      });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType || "application/octet-stream"
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ uploadUrl, key, eventId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * AWS S3: Confirm upload & register media metadata (with duplicate detection)
 */
app.post("/api/media/confirm-upload", authenticateToken, async (req, res) => {
  try {
    const {
      s3Key, localSrc, eventId, title, type, visibility,
      uploaderName, caption, tags, fileHash
    } = req.body;

    if (!s3Key || !eventId) {
      return res.status(400).json({ message: "s3Key and eventId required" });
    }

    if (fileHash && mediaStore.some(m => m.fileHash === fileHash)) {
      return res.status(409).json({ message: "Duplicate image detected", duplicate: true });
    }

    const event = eventsStore.find(e => String(e.id) === String(eventId));
    const mediaTags = tags || smartTags(`${title} ${event?.name || ""} ${event?.category || ""}`);
    const mediaCaption = caption || generateAICaption(title, event?.name, mediaTags);
    const useLocal = localSrc || !s3Configured;

    const item = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      eventId: Number(eventId),
      type: type || "image",
      key: useLocal ? null : s3Key,
      localSrc: useLocal ? localSrc : null,
      title: title || "Untitled",
      caption: mediaCaption,
      uploader: uploaderName || req.user.name || "Guest",
      uploaderEmail: req.user.email || "",
      tags: mediaTags,
      fileHash: fileHash || null,
      visibility: visibility || "public",
      uploadedAt: new Date().toISOString().slice(0, 10),
      likes: 0,
      comments: [],
      favourites: false
    };

    mediaStore.unshift(item);
    notificationsStore.unshift(`${item.uploader} uploaded "${item.title}" to ${event?.name || "an event"}`);

    const src = await getMediaSrc(item);
    res.status(201).json({ ...item, src });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Legacy multipart upload (still supported)
 */
app.post("/api/media/upload", upload.array("files"), async (req, res) => {
  try {
    const { eventId, eventName, eventCategory, clubName, visibility, uploaderName } = req.body;
    const uploaded = [];

    for (const file of req.files || []) {
      const key = sanitizeKey(file.originalname);
      let localSrc = null;

      if (s3Configured) {
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
          })
        );
      } else {
        localSrc = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      }

      const tags = smartTags(`${file.originalname} ${eventName} ${eventCategory} ${clubName}`);
      const item = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        eventId: Number(eventId),
        type: file.mimetype.startsWith("video") ? "video" : "image",
        key: s3Configured ? key : null,
        localSrc,
        title: file.originalname.replace(/\.[^.]+$/, ""),
        caption: generateAICaption(file.originalname, eventName, tags),
        uploader: uploaderName || "Guest",
        tags,
        visibility: visibility || "public",
        uploadedAt: new Date().toISOString().slice(0, 10),
        likes: 0,
        comments: [],
        favourites: false
      };

      mediaStore.unshift(item);
      uploaded.push({ ...item, src: localSrc || await getMediaSrc(item) });
    }

    res.json({ success: true, media: uploaded });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/media", async (req, res) => {
  try {
    const { eventId = "all" } = req.query;
    const list = mediaStore.filter(m => {
      if (eventId === "all") return true;
      return String(m.eventId) === String(eventId);
    });

    const withUrls = await Promise.all(
      list.map(async (m) => ({ ...m, src: await getMediaSrc(m) }))
    );

    res.json(withUrls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/media/:id/like", (req, res) => {
  const item = mediaStore.find(m => String(m.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: "Media not found" });
  item.likes = (item.likes || 0) + 1;
  res.json({ success: true, likes: item.likes });
});

app.post("/api/media/:id/favourite", (req, res) => {
  const item = mediaStore.find(m => String(m.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: "Media not found" });
  item.favourites = !item.favourites;
  res.json({ success: true, favourites: item.favourites });
});

app.post("/api/media/:id/comment", authenticateToken, (req, res) => {
  const item = mediaStore.find(m => String(m.id) === String(req.params.id));
  if (!item) return res.status(404).json({ message: "Media not found" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

  const newComment = { user: req.user.name || "Guest", text };
  item.comments = item.comments || [];
  item.comments.push(newComment);
  res.status(201).json({ success: true, comment: newComment });
});

app.get("/api/media/:id/download", async (req, res) => {
  try {
    const item = mediaStore.find(m => String(m.id) === String(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.localSrc) return res.json({ url: item.localSrc });

    if (!s3Configured || !item.key) {
      return res.status(503).json({ message: "S3 not configured" });
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: item.key }),
      { expiresIn: 60 }
    );

    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/notifications", (req, res) => {
  res.json(notificationsStore);
});

// ==========================================
// STATIC FILES & PWA
// ==========================================
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================================
// START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EventLens server running on http://localhost:${PORT}`);
  console.log(s3Configured ? "AWS S3 configured ✓" : "AWS S3 not configured — using local fallback mode");
});
