const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function seed(database) {
  const db = database || new Database(
    fs.existsSync(path.join(__dirname, 'nextflix.db'))
      ? path.join(__dirname, 'nextflix.db')
      : path.join(__dirname, 'streamflix.db')
  );

  // Schema safeguards
  db.exec(`CREATE TABLE IF NOT EXISTS videos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
    category TEXT DEFAULT 'New Releases', year INTEGER, file TEXT NOT NULL, poster TEXT,
    views INTEGER DEFAULT 0, series TEXT, episode INTEGER, hidden INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

  for (const col of [
    { name: 'age_rating', type: "TEXT DEFAULT 'adults'" },
    { name: 'series', type: 'TEXT' },
    { name: 'episode', type: 'INTEGER' },
    { name: 'featured', type: 'INTEGER DEFAULT 0' },
    { name: 'video_url', type: "TEXT DEFAULT ''" },
    { name: 'trailer_url', type: "TEXT DEFAULT ''" },
    { name: 'hidden', type: 'INTEGER DEFAULT 0' }
  ]) {
    try { db.exec(`ALTER TABLE videos ADD COLUMN ${col.name} ${col.type}`); } catch (e) {
      if (!/duplicate column name/i.test(e.message)) throw e;
    }
  }

  // Remove titles that only had trailers or broken playlists
  const removedTitles = [
    'Death Note',
    'Suzume',
    'Weathering With You',
    'Your Name (Kimi no Na wa)',
    'Your Name',
    'A Silent Voice',
    'The Silent Voice',
    'Spirited Away',
    'Demon Slayer: Kimetsu no Yaiba',
    'Hyouka',
    'Campfire Cooking in Another World',
    'Tokyo Revengers',
    'SPY x FAMILY',
    'Anohana   The Flower We Saw That Day',
    "Doraemon Movie Nobita'S Space Heroes",
    "Doraemon Movie： Nobita'S New Dinosaur",
    'Doremon Movie｜Sky Utopia',
    'Look Back',
    'Shin Chan: The Spicy Kasukabe Dancers In India',
    'Spider Man Brand New Day',
    'Hope'
  ];
  for (const t of removedTitles) {
    db.prepare('DELETE FROM videos WHERE title = ?').run(t);
  }

  // 100% Full Movies and Official Full Season Anime Playlists only
  const verifiedTitles = [
    // --- Bollywood & Blockbuster Cinema (Full Feature Films) ---
    {
      title: 'KGF: Chapter 1',
      description: 'In the 1970s, a fierce rebel rises against brutal oppression at the Kolar Gold Fields, becoming the symbol of hope for thousands of downtrodden workers.',
      category: 'Action',
      year: 2018,
      file: '',
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
      file: '',
      poster: '/images/bhool-bhulaiyaa.jpg',
      video_url: 'https://www.youtube.com/watch?v=Kkcwa_hSKLA',
      trailer_url: 'https://www.youtube.com/watch?v=kGq_0k_lE7I',
      views: 38400,
      age_rating: 'adults',
      featured: 0
    },

    // --- Official Full Season Anime Playlists (Official Muse India / Muse Asia) ---
    {
      title: 'Attack on Titan (Season 1)',
      series: 'Attack on Titan',
      episode: 1,
      description: 'Humanity lives inside cities surrounded by enormous walls that protect them from gigantic man-eating humanoids referred to as Titans. Young Eren vows to eliminate them all.',
      category: 'Anime',
      year: 2013,
      file: '',
      poster: '/images/attack-on-titan.jpg',
      video_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL16H1PewtveOnqL8QIV9F4S9',
      trailer_url: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ',
      views: 52100,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Tokyo Revengers (Season 1)',
      series: 'Tokyo Revengers',
      episode: 1,
      description: 'Takemichi Hanagaki travels 12 years back into the past to his middle school days to prevent the death of his ex-girlfriend Hinata by changing the destiny of the Tokyo Manji Gang.',
      category: 'Anime',
      year: 2021,
      file: '',
      poster: '/images/tokyo-revengers.jpg',
      video_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL14ZN_ayyUTitn2qFsVKMI_9',
      trailer_url: 'https://www.youtube.com/watch?v=rV9QmUSlPds',
      views: 41200,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'SPY x FAMILY (Season 1)',
      series: 'SPY x FAMILY',
      episode: 1,
      description: 'World-class spy Twilight must infiltrate an elite school by building a mock family. But his adopted daughter is a telepath and his fake wife is a deadly assassin.',
      category: 'Anime',
      year: 2022,
      file: '',
      poster: '/images/spy-family.jpg',
      video_url: 'https://www.youtube.com/playlist?list=PLpm1VVK4UL145WmZpHC4VMbgjCAShnb1M',
      trailer_url: 'https://www.youtube.com/watch?v=ofXigq9aIpo',
      views: 64100,
      age_rating: 'kids',
      featured: 0
    },
    {
      title: 'One-Punch Man (Season 1)',
      series: 'One-Punch Man',
      episode: 1,
      description: 'Saitama is a hero who only became a hero for fun. After three years of relentless training, he has grown so overpowered that he can defeat any enemy with just a single punch.',
      category: 'Anime',
      year: 2015,
      file: '',
      poster: '/images/one-punch-man.jpg',
      video_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl0YZIflIt1EK0dcjLuMuxLd',
      trailer_url: 'https://www.youtube.com/watch?v=atxYe-nOa9w',
      views: 71200,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Mob Psycho 100 (Season 1)',
      series: 'Mob Psycho 100',
      episode: 1,
      description: 'Eighth-grader Shigeo "Mob" Kageyama possesses godlike psychic power, but wants nothing more than to live a normal peaceful life while keeping his emotional gauge below 100%.',
      category: 'Anime',
      year: 2016,
      file: '',
      poster: '/images/mob-psycho-100.jpg',
      video_url: 'https://www.youtube.com/playlist?list=PLwLSw1_eDZl1pvIv1fBd3oKkP3XEQpT_G',
      trailer_url: 'https://www.youtube.com/watch?v=nTze7vAdRpM',
      views: 43300,
      age_rating: 'teens',
      featured: 0
    },

    // --- Hollywood Classics & Legal Feature Films (Complete Full Movies) ---
    {
      title: 'Sherlock Holmes: Dressed to Kill',
      description: 'Sherlock Holmes and Dr. Watson investigate a string of suspicious murders linked to three innocuous music boxes crafted by an inmate at Dartmoor Prison.',
      category: 'Mystery',
      year: 1946,
      file: '',
      poster: '/images/sherlock-holmes.jpg',
      video_url: 'https://www.youtube.com/watch?v=F_fV17L7K-I',
      trailer_url: 'https://www.youtube.com/watch?v=F_fV17L7K-I',
      views: 34100,
      age_rating: 'adults',
      featured: 0
    },
    {
      title: 'Night of the Living Dead',
      description: 'George A. Romero\'s legendary horror masterpiece: a disparate group of strangers barricades themselves in an isolated farmhouse to survive hordes of reanimated flesh-eating ghouls.',
      category: 'Horror',
      year: 1968,
      file: '',
      poster: '/images/night-of-the-living-dead.jpg',
      video_url: 'https://www.youtube.com/watch?v=5gUKZ4tB-48',
      trailer_url: 'https://www.youtube.com/watch?v=5gUKZ4tB-48',
      views: 74200,
      age_rating: 'adults',
      featured: 0
    },
    {
      title: 'Charade',
      description: 'Often called "the best Hitchcock movie Hitchcock never made": Audrey Hepburn and Cary Grant star in a thrilling Parisian caper involving stolen fortune, deceit, and murder.',
      category: 'Thriller',
      year: 1963,
      file: '',
      poster: '/images/charade.jpg',
      video_url: 'https://www.youtube.com/watch?v=6P3B9N1xPcg',
      trailer_url: 'https://www.youtube.com/watch?v=6P3B9N1xPcg',
      views: 51200,
      age_rating: 'adults',
      featured: 0
    },
    {
      title: 'The General',
      description: 'Buster Keaton\'s iconic action-comedy masterpiece: train engineer Johnnie Gray undertakes a breathtaking locomotive chase behind enemy lines to rescue his engine and love.',
      category: 'Comedy',
      year: 1926,
      file: '',
      poster: '/images/the-general.jpg',
      video_url: 'https://www.youtube.com/watch?v=iHlBMKcg9as',
      trailer_url: 'https://www.youtube.com/watch?v=iHlBMKcg9as',
      views: 41800,
      age_rating: 'kids',
      featured: 0
    },
    {
      title: 'The Kid',
      description: 'Charlie Chaplin\'s heartwarming silent comedy classic following the Little Tramp as he raises an orphaned child, forging an unbreakable bond full of laughter and tears.',
      category: 'Comedy',
      year: 1921,
      file: '',
      poster: '/images/the-kid.jpg',
      video_url: 'https://www.youtube.com/watch?v=gT8_4q0w7Zk',
      trailer_url: 'https://www.youtube.com/watch?v=gT8_4q0w7Zk',
      views: 39600,
      age_rating: 'kids',
      featured: 0
    },
    {
      title: 'His Girl Friday',
      description: 'Howard Hawks\' whirlwind screwball comedy featuring lightning-fast banter as ruthless editor Walter Burns tries to stop his ace reporter ex-wife from leaving the newspaper business.',
      category: 'Comedy',
      year: 1940,
      file: '',
      poster: '/images/his-girl-friday.jpg',
      video_url: 'https://www.youtube.com/watch?v=mHn10lQ6l6M',
      trailer_url: 'https://www.youtube.com/watch?v=mHn10lQ6l6M',
      views: 29400,
      age_rating: 'teens',
      featured: 0
    }
  ];

  const checkStmt = db.prepare("SELECT id FROM videos WHERE title = ? OR (video_url != '' AND video_url = ?)");
  const insertStmt = db.prepare(`
    INSERT INTO videos (title, description, category, year, file, poster, video_url, trailer_url, views, series, episode, hidden, age_rating, featured)
    VALUES (@title, @description, @category, @year, @file, @poster, @video_url, @trailer_url, @views, @series, @episode, 0, @age_rating, @featured)
  `);
  const updateStmt = db.prepare(`
    UPDATE videos SET 
      title = @title, description = @description, category = @category, year = @year,
      poster = @poster, video_url = @video_url, trailer_url = @trailer_url,
      age_rating = @age_rating, featured = @featured, series = @series, episode = @episode
    WHERE id = @id
  `);

  for (const item of verifiedTitles) {
    const existing = checkStmt.get(item.title, item.video_url);
    if (existing) {
      updateStmt.run({
        ...item,
        id: existing.id,
        series: item.series || null,
        episode: item.episode || null,
        featured: item.featured || 0
      });
      console.log(`Updated title: ${item.title}`);
    } else {
      insertStmt.run({
        ...item,
        series: item.series || null,
        episode: item.episode || null,
        featured: item.featured || 0
      });
      console.log(`Inserted title: ${item.title}`);
    }
  }

  console.log('Seeding complete! Verified full titles in database:', db.prepare('SELECT COUNT(*) as count FROM videos').get().count);
}

if (require.main === module) {
  seed();
}

module.exports = seed;
