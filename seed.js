const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = fs.existsSync(path.join(__dirname, 'nextflix.db'))
  ? path.join(__dirname, 'nextflix.db')
  : path.join(__dirname, 'streamflix.db');

const db = new Database(dbPath);

const defaultTitles = [
  {
    title: 'KGF: Chapter 1',
    description: 'In the 1970s, a fierce rebel rises against brutal oppression at the Kolar Gold Fields, becoming the symbol of hope for thousands of downtrodden workers.',
    category: 'Action',
    year: 2018,
    file: 'kgf.mp4',
    poster: '/images/kgf.jpg',
    video_url: 'https://www.youtube.com/watch?v=gKizDojsdvs',
    trailer_url: 'https://www.youtube.com/watch?v=-KfsY-qwBS0',
    views: 45200,
    age_rating: 'adults',
    featured: 1
  },
  {
    title: 'Bhool Bhulaiyaa',
    description: 'An NRI and his wife decide to stay in his ancestral palace, ignoring eerie warnings about a vengeful dancer ghost. When strange phenomena begin, a psychiatrist friend steps in.',
    category: 'Comedy / Horror',
    year: 2007,
    file: 'bhool-bhulaiyaa.mp4',
    poster: '/images/bhool-bhulaiyaa.jpg',
    video_url: 'https://www.youtube.com/watch?v=Kkcwa_hSKLA',
    trailer_url: 'https://www.youtube.com/watch?v=kGq_0k_lE7I',
    views: 38400,
    age_rating: 'adults',
    featured: 0
  },
  {
    title: 'Attack on Titan (Season 1)',
    series: 'Attack on Titan',
    episode: 1,
    description: 'Humanity lives inside cities surrounded by enormous walls that protect them from gigantic man-eating humanoids referred to as Titans. Young Eren vows to eliminate them all.',
    category: 'Anime',
    year: 2013,
    file: 'attack-on-titan.mp4',
    poster: '/images/attack-on-titan.jpg',
    video_url: 'https://www.youtube.com/watch?v=QjJ4iPOQF_Y&list=PLpm1VVK4UL16H1PewtveOnqL8QIV9F4S9',
    trailer_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL16H1PewtveOnqL8QIV9F4S9',
    views: 52100,
    age_rating: 'teens',
    featured: 0
  },
  {
    title: 'Death Note',
    series: 'Death Note',
    episode: 1,
    description: 'An intelligent high school student goes on a secret crusade to eliminate criminals worldwide after finding a supernatural notebook capable of killing anyone whose name is written in it.',
    category: 'Anime',
    year: 2006,
    file: 'death-note.mp4',
    poster: '/images/death-note.jpg',
    video_url: 'https://www.youtube.com/playlist?list=PLJsBrksGtG0Y',
    trailer_url: 'https://www.youtube.com/watch?v=NlJZ-YgAt-c',
    views: 49800,
    age_rating: 'teens',
    featured: 0
  },
  {
    title: 'Tokyo Revengers',
    series: 'Tokyo Revengers',
    episode: 1,
    description: 'Takemichi Hanagaki travels 12 years back into the past to his middle school days to prevent the death of his ex-girlfriend Hinata by changing the destiny of the Tokyo Manji Gang.',
    category: 'Anime',
    year: 2021,
    file: 'tokyo-revengers.mp4',
    poster: '/images/tokyo-revengers.jpg',
    video_url: 'https://www.youtube.com/watch?v=rV9QmUSlPds',
    trailer_url: 'https://www.youtube.com/watch?v=rV9QmUSlPds',
    views: 31200,
    age_rating: 'teens',
    featured: 0
  },
  {
    title: 'SPY x FAMILY',
    series: 'SPY x FAMILY',
    episode: 1,
    description: 'World-class spy Twilight must infiltrate an elite school by building a mock family. But his adopted daughter is a telepath and his fake wife is a deadly assassin.',
    category: 'Anime',
    year: 2022,
    file: 'spy-family.mp4',
    poster: '/images/spy-family.jpg',
    video_url: 'https://www.youtube.com/watch?v=1AQtGDYVs7k',
    trailer_url: 'https://www.youtube.com/watch?v=ofXigq9aIpo',
    views: 64100,
    age_rating: 'kids',
    featured: 0
  }
];

const checkStmt = db.prepare('SELECT id FROM videos WHERE title = ? OR video_url = ?');
const insertStmt = db.prepare(`
  INSERT INTO videos (title, description, category, year, file, poster, video_url, trailer_url, views, series, episode, hidden, age_rating, featured)
  VALUES (@title, @description, @category, @year, @file, @poster, @video_url, @trailer_url, @views, @series, @episode, 0, @age_rating, @featured)
`);
const updateStmt = db.prepare(`
  UPDATE videos SET 
    description = @description, category = @category, year = @year,
    poster = @poster, video_url = @video_url, trailer_url = @trailer_url,
    age_rating = @age_rating, featured = @featured
  WHERE id = @id
`);

for (const item of defaultTitles) {
  const existing = checkStmt.get(item.title, item.video_url);
  if (existing) {
    updateStmt.run({ ...item, id: existing.id, series: item.series || null, episode: item.episode || null });
    console.log(`Updated: ${item.title}`);
  } else {
    insertStmt.run({ ...item, series: item.series || null, episode: item.episode || null });
    console.log(`Inserted: ${item.title}`);
  }
}

console.log('Seeding complete! Total videos in database:', db.prepare('SELECT COUNT(*) as count FROM videos').get().count);
