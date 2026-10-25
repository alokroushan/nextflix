const express = require('express'), multer = require('multer'), path = require('path');
const fs = require('fs'), crypto = require('crypto'), Database = require('better-sqlite3');
const { spawnSync } = require('child_process');

const UP = path.join(__dirname, 'uploads'); fs.mkdirSync(UP, { recursive: true });
const dbPath = fs.existsSync(path.join(__dirname, 'nextflix.db')) ? path.join(__dirname, 'nextflix.db') : path.join(__dirname, 'streamflix.db');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS videos(
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
  category TEXT DEFAULT 'New Releases', year INTEGER, file TEXT NOT NULL, poster TEXT,
  views INTEGER DEFAULT 0, series TEXT, episode INTEGER, hidden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
try { db.exec("ALTER TABLE videos ADD COLUMN age_rating TEXT DEFAULT 'adults'"); } catch (error) {
  if (!/duplicate column name/i.test(error.message)) throw error;
}
db.prepare("UPDATE videos SET age_rating = 'adults' WHERE age_rating IS NULL OR age_rating = ''").run();
db.exec('CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)');
const hashPassword = password => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};
const passwordMatches = (password, stored) => {
  if (!stored) return false;
  if (stored.includes(':')) {
    const [salt, expected] = stored.split(':');
    const actual = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expected, 'hex');
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
  }
  const actual = Buffer.from(password);
  const expected = Buffer.from(stored);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const configuredPassword = () => db.prepare("SELECT value FROM app_settings WHERE key = 'admin_password'").get()?.value
  || process.env.ADMIN_PASSWORD || 'admin123';
if (!db.prepare("SELECT 1 FROM app_settings WHERE key = 'age_rating_defaults_migrated'").get()) {
  db.prepare("UPDATE videos SET age_rating = 'kids' WHERE age_rating = 'adults'").run();
  db.prepare("INSERT INTO app_settings(key, value) VALUES('age_rating_defaults_migrated', '1')").run();
}
for (const column of ['series', 'episode']) {
  try { db.exec(`ALTER TABLE videos ADD COLUMN ${column} ${column === 'episode' ? 'INTEGER' : 'TEXT'}`); } catch (error) {
    if (!/duplicate column name/i.test(error.message)) throw error;
  }
  try { db.exec('ALTER TABLE videos ADD COLUMN featured INTEGER DEFAULT 0'); } catch (error) {
    if (!/duplicate column name/i.test(error.message)) throw error;
  }
  for (const column of ['video_url', 'trailer_url']) {
    try { db.exec(`ALTER TABLE videos ADD COLUMN ${column} TEXT DEFAULT ''`); } catch (error) {
      if (!/duplicate column name/i.test(error.message)) throw error;
    }
  }
  try { db.exec('ALTER TABLE videos ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (error) {
    if (!/duplicate column name/i.test(error.message)) throw error;
  }
}

try {
  const seed = require('./seed.js');
  if (typeof seed === 'function') seed(db);
} catch (e) {
  console.warn('Database seed notice:', e.message);
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.mpeg', '.mpg', '.ogv']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const IMPORT_TYPES = {
  movie: 'movie', 'web-series': 'web-series', videos: 'videos'
};
const titleFromFilename = name => path.basename(name, path.extname(name))
  .replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim() || 'Untitled video';
const validUrl = value => {
  try { return /^https?:$/.test(new URL(String(value)).protocol); } catch { return false; }
};
const importedFile = (name, type) => {
  const folder = path.join(UP, 'imported', type);
  fs.mkdirSync(folder, { recursive: true });
  const target = crypto.randomUUID() + path.extname(name).toLowerCase();
  return { folder, target, relative: path.join('imported', type, target) };
};
const episodeFromFilename = name => {
  const match = path.basename(name).match(/(?:s\d{1,2}e|episode[\s._-]*|ep[\s._-]*)(\d{1,3})/i) ||
    path.basename(name).match(/(?:^|[\s._-])(\d{1,3})(?:[\s._-]|$)/);
  return match ? Number(match[1]) : null;
};
const metadataForFile = name => {
  const base = path.basename(name, path.extname(name));
  const yearMatch = base.match(/\b(19|20)\d{2}\b/);
  const lower = base.toLowerCase();
  const categories = [
    ['anime', 'Anime'], ['animation', 'Animation'], ['documentary', 'Documentary'],
    ['comedy', 'Comedy'], ['horror', 'Horror'], ['thriller', 'Thriller'],
    ['action', 'Action'], ['drama', 'Drama'], ['romance', 'Romance'],
    ['sci-fi', 'Sci-Fi'], ['scifi', 'Sci-Fi'], ['fantasy', 'Fantasy'],
    ['sport', 'Sports'], ['music', 'Music'], ['tutorial', 'Education']
  ];
  const category = categories.find(([keyword]) => lower.includes(keyword))?.[1] || 'New Releases';
  return {
    title: titleFromFilename(name),
    category,
    year: yearMatch ? Number(yearMatch[0]) : new Date().getFullYear()
  };
};
const createPoster = file => {
  const output = `preview-${crypto.randomUUID()}.jpg`;
  const result = spawnSync('ffmpeg', [
    '-y', '-ss', '2', '-i', path.join(UP, file), '-frames:v', '1',
    '-vf', 'scale=640:-2', '-q:v', '3', path.join(UP, output)
  ], { stdio: 'ignore', windowsHide: true });
  if (result.status === 0 && fs.existsSync(path.join(UP, output))) return output;
  fs.rmSync(path.join(UP, output), { force: true });
  return null;
};
const discoverUploads = () => {
  db.prepare("UPDATE videos SET category = 'New Releases' WHERE category = 'General'").run();
  const missingFiles = db.prepare("SELECT id, file, poster FROM videos WHERE file != '' AND (video_url IS NULL OR TRIM(video_url) = '')").all()
    .filter(video => !fs.existsSync(path.join(UP, video.file)));
  const removeMissing = db.transaction(() => {
    for (const video of missingFiles) {
      const posterInUse = video.poster && db.prepare(
        'SELECT 1 FROM videos WHERE poster = ? AND id != ?').get(video.poster, video.id);
      db.prepare('DELETE FROM videos WHERE id = ?').run(video.id);
      if (video.poster && !posterInUse && fs.existsSync(path.join(UP, video.poster))) {
        fs.rmSync(path.join(UP, video.poster), { force: true });
      }
    }
  });
  removeMissing();
  const known = new Set(db.prepare('SELECT file FROM videos').all().map(v => v.file).filter(Boolean));
  const collect = (directory, series) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    return entries.flatMap(entry => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collect(full, series || entry.name);
      }
      if (!entry.isFile() || !VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ||
          /-browser$/i.test(path.basename(entry.name, path.extname(entry.name)))) return [];
      return [{ entry, full, series, entries }];
    });
  };
  const files = fs.readdirSync(UP, { withFileTypes: true });
  const videos = collect(UP, null);
  const insert = db.prepare(`INSERT INTO videos(title,description,category,year,file,poster,series,episode)
    VALUES(?,?,?,?,?,?,?,?)`);
  const add = db.transaction(() => {
    for (const video of videos) {
      const relative = path.relative(UP, video.full);
      if (known.has(relative)) continue;
      const meta = metadataForFile(video.entry.name);
      const stem = path.basename(video.entry.name, path.extname(video.entry.name));
      const posterEntry = video.entries.find(candidate => {
        if (!candidate.isFile() || !IMAGE_EXTENSIONS.has(path.extname(candidate.name).toLowerCase())) return false;
        const candidateStem = path.basename(candidate.name, path.extname(candidate.name));
        return candidateStem === stem || Boolean(video.series && /^(poster|cover|folder)$/i.test(candidateStem));
      });
      const poster = posterEntry?.name || null;
      insert.run(meta.title, 'Added automatically from the uploads folder.', meta.category,
        meta.year, relative, poster ? path.relative(UP, path.join(path.dirname(video.full), poster)) :
          createPoster(relative), video.series, episodeFromFilename(video.entry.name));
    }
  });
  add();
  const missing = db.prepare("SELECT id, file FROM videos WHERE poster IS NULL AND file != ''").all();
  const updatePoster = db.prepare('UPDATE videos SET poster = ? WHERE id = ?');
  for (const video of missing) {
    if (fs.existsSync(path.join(UP, video.file))) {
      const poster = createPoster(video.file);
      if (poster) updatePoster.run(poster, video.id);
    }
  }
};
discoverUploads();
const sessions = new Set();
const upload = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (_, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase())
  }),
  fileFilter: (_, f, cb) => cb(null, /^(video|image)\//.test(f.mimetype))
});
const auth = (req, res, next) =>
  sessions.has(req.get('x-token')) ? next() : res.status(401).json({ error: 'Admin login required' });

const app = express();
app.use(express.json());

app.post('/api/login', (req, res) => {
  const inputPw = String(req.body.password || '');
  const stored = configuredPassword();
  const envPw = process.env.ADMIN_PASSWORD || 'admin123';
  if (!passwordMatches(inputPw, stored) && inputPw !== envPw) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const t = crypto.randomUUID(); sessions.add(t); res.json({ token: t });
});
app.get('/api/session', auth, (_, res) => res.json({ ok: true }));
app.put('/api/admin/password', auth, (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  const envPw = process.env.ADMIN_PASSWORD || 'admin123';
  if (!passwordMatches(currentPassword, configuredPassword()) && currentPassword !== envPw) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  db.prepare("INSERT INTO app_settings(key, value) VALUES('admin_password', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(hashPassword(newPassword));
  res.json({ ok: true });
});

app.get('/api/videos', (req, res) => {
  discoverUploads();
  const q = `%${req.query.q || ''}%`;
  const audience = String(req.query.audience || 'adults');
  const allowed = audience === 'kids' ? ['kids'] : audience === 'teens' ? ['kids', 'teens'] : ['kids', 'teens', 'adults'];
  res.json(db.prepare(`SELECT * FROM videos WHERE hidden = 0 AND age_rating IN (${allowed.map(() => '?').join(',')})
    AND (title LIKE ? OR category LIKE ?) ORDER BY id DESC`).all(...allowed, q, q));
});
app.get('/api/admin/videos', auth, (req, res) => {
  discoverUploads();
  const q = `%${req.query.q || ''}%`;
  res.json(db.prepare(`SELECT * FROM videos WHERE title LIKE ? OR category LIKE ? ORDER BY id DESC`).all(q, q));
});
app.post('/api/videos/:id/view', (req, res) => {
  db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(req.params.id); res.json({ ok: true });
});

app.post('/api/videos', auth, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'poster', maxCount: 1 }]),
  (req, res) => {
    const v = req.files?.video?.[0];
    const videoUrl = String(req.body.videoUrl || '').trim();
    const trailerUrl = String(req.body.trailerUrl || '').trim();
    if (!v && !validUrl(videoUrl)) return res.status(400).json({ error: 'Provide a video file or a valid video link' });
    if (videoUrl && !validUrl(videoUrl)) return res.status(400).json({ error: 'Video link must be an http(s) URL' });
    if (trailerUrl && !validUrl(trailerUrl)) return res.status(400).json({ error: 'Trailer link must be an http(s) URL' });
    const p = req.files?.poster?.[0];
    const meta = metadataForFile(v?.originalname || videoUrl);
    const featured = req.body.featured === '1' ? 1 : 0;
    const ageRating = ['kids', 'teens', 'adults'].includes(req.body.ageRating) ? req.body.ageRating : 'adults';
    const info = db.prepare(`INSERT INTO videos(title,description,category,year,file,poster,video_url,trailer_url,featured,age_rating) VALUES(?,?,?,?,?,?,?,?,?,?)`)
      .run(req.body.title?.trim() || meta.title, req.body.description || '', req.body.category?.trim() || meta.category,
           +req.body.year || meta.year, v?.filename || '', p ? p.filename : null, videoUrl, trailerUrl, featured, ageRating);
    if (featured) db.prepare('UPDATE videos SET featured = CASE WHEN id = ? THEN 1 ELSE 0 END').run(info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid });
  });

app.post('/api/import-folder', auth, upload.none(), (req, res) => {
  const type = IMPORT_TYPES[String(req.body.type || '')];
  const source = path.resolve(String(req.body.folderPath || ''));
  if (!['movie', 'web-series', 'videos'].includes(type) ||
      !source || !fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    return res.status(400).json({ error: 'Choose an existing folder and classification' });
  }
  const recursive = req.body.recursive !== 'false';
  const allowed = VIDEO_EXTENSIONS;
  const files = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory() && recursive) walk(full);
      else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  };
  walk(source);
  let imported = 0;
  const insertVideo = db.prepare(`INSERT INTO videos(title,description,category,year,file,poster,series,episode,video_url,trailer_url)
    VALUES(?,?,?,?,?,?,?,?,?,?)`);
  for (const file of files) {
    const target = importedFile(file, type);
    fs.copyFileSync(file, path.join(UP, target.relative));
    const title = String(req.body.title || '').trim() || titleFromFilename(file);
    const category = String(req.body.category || '').trim() || type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    insertVideo.run(title, String(req.body.description || '').trim(), category,
      Number(req.body.year) || new Date().getFullYear(), target.relative, null,
      type === 'web-series' ? path.basename(source) : null, episodeFromFilename(file),
      validUrl(req.body.videoUrl) ? req.body.videoUrl : '', validUrl(req.body.trailerUrl) ? req.body.trailerUrl : '');
    imported++;
  }
  res.json({ imported });
});

app.put('/api/videos/:id', auth, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'poster', maxCount: 1 }]),
  (req, res) => {
  const current = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Video not found' });
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || '').trim();
  if (!title || !category) return res.status(400).json({ error: 'Title and category are required' });
  const year = Number(req.body.year);
  if (!Number.isInteger(year) || year < 1888 || year > new Date().getFullYear() + 1) {
    return res.status(400).json({ error: 'Enter a valid year' });
  }
  const video = req.files?.video?.[0];
  const poster = req.files?.poster?.[0];
  const nextFile = video ? video.filename : current.file;
  const videoUrl = String(req.body.videoUrl || '').trim();
  const nextVideoUrl = video ? '' : (req.body.videoUrl !== undefined ? videoUrl : current.video_url || '');
  const trailerUrl = String(req.body.trailerUrl || '').trim();
  const featured = req.body.featured === '1' ? 1 : 0;
  const hidden = req.body.hidden === '1' ? 1 : 0;
  const ageRating = ['kids', 'teens', 'adults'].includes(req.body.ageRating) ? req.body.ageRating : 'adults';
  if (videoUrl && !validUrl(videoUrl)) return res.status(400).json({ error: 'Video link must be an http(s) URL' });
  if (trailerUrl && !validUrl(trailerUrl)) return res.status(400).json({ error: 'Trailer link must be an http(s) URL' });
  let nextPoster = poster ? poster.filename : current.poster;
  if (video && !poster) nextPoster = createPoster(video.filename) || current.poster;
  db.prepare(`UPDATE videos SET title = ?, description = ?, category = ?, year = ?, file = ?, poster = ?,
    video_url = ?, trailer_url = ?, featured = ?, hidden = ?, age_rating = ? WHERE id = ?`).run(title, String(req.body.description || '').trim(), category, year,
    nextFile, nextPoster, nextVideoUrl, req.body.trailerUrl !== undefined ? trailerUrl : current.trailer_url || '', featured, hidden, ageRating, current.id);
  if (featured) db.prepare('UPDATE videos SET featured = CASE WHEN id = ? THEN 1 ELSE 0 END').run(current.id);
  const posterStillUsed = current.poster && db.prepare(
    'SELECT 1 FROM videos WHERE poster = ? AND id != ?').get(current.poster, current.id);
  if (video && current.file) fs.rm(path.join(UP, current.file), () => {});
  if (poster && current.poster && current.poster !== nextPoster && !posterStillUsed) {
    fs.rm(path.join(UP, current.poster), () => {});
  }
  res.json({ ok: true });
});

app.delete('/api/videos/:id', auth, (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (v) {
    const posterInUse = v.poster && db.prepare('SELECT 1 FROM videos WHERE poster = ? AND id != ?').get(v.poster, v.id);
    [v.file, posterInUse ? null : v.poster].filter(Boolean).forEach(f => fs.rm(path.join(UP, f), () => {}));
    db.prepare('DELETE FROM videos WHERE id = ?').run(v.id);
  }
  res.json({ ok: true });
});
const PUBLIC_PATH = path.join(__dirname, 'public');

app.use('/media', express.static(UP));          // handles HTTP Range requests, so seeking works
app.use('/uploads', express.static(UP));

// 1. The NEXTFLIX video streaming catalog:
app.get(['/browse', '/browse.html', '/stream', '/home', '/home.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'browse.html'));
});

// 2. The Complete Admin Studio page:
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'admin.html'));
});

// 3. The Netflix landing page serving as the entry/signup page:
app.get(['/', '/index.html', '/landing'], (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

app.use(express.static(PUBLIC_PATH));
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`NEXTFLIX running at http://localhost:${PORT}`));
