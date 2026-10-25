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

  const defaultTitles = [
    // --- Bollywood & Blockbuster Hits ---
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

    // --- Popular Anime Series & Seasons (Official Muse Asia / Ani-One) ---
    {
      title: 'Attack on Titan (Season 1)',
      series: 'Attack on Titan',
      episode: 1,
      description: 'Humanity lives inside cities surrounded by enormous walls that protect them from gigantic man-eating humanoids referred to as Titans. Young Eren vows to eliminate them all.',
      category: 'Anime',
      year: 2013,
      file: '',
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
      file: '',
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
      file: '',
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
      file: '',
      poster: '/images/spy-family.jpg',
      video_url: 'https://www.youtube.com/watch?v=1AQtGDYVs7k',
      trailer_url: 'https://www.youtube.com/watch?v=ofXigq9aIpo',
      views: 64100,
      age_rating: 'kids',
      featured: 0
    },
    {
      title: 'One-Punch Man',
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
      title: 'Mob Psycho 100',
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
    {
      title: 'Demon Slayer: Kimetsu no Yaiba',
      series: 'Demon Slayer',
      episode: 1,
      description: 'Tanjiro Kamado embarks on a perilous journey to become a Demon Slayer to avenge his slain family and find a cure for his sister Nezuko, who was transformed into a demon.',
      category: 'Anime',
      year: 2019,
      file: '',
      poster: '/images/demon-slayer.jpg',
      video_url: 'https://www.youtube.com/watch?v=VQGCKyvzIM4',
      trailer_url: 'https://www.youtube.com/watch?v=6vMuWuWlW4I',
      views: 89400,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Hyouka',
      series: 'Hyouka',
      episode: 1,
      description: 'Energy-conserving high schooler Hotaro Oreki joins the Classic Literature Club and finds himself solving fascinating school mysteries alongside curious club president Eru Chitanda.',
      category: 'Anime',
      year: 2012,
      file: '',
      poster: '/images/hyouka.jpg',
      video_url: 'https://www.youtube.com/watch?v=qM2E46pL8Z0',
      trailer_url: 'https://www.youtube.com/watch?v=7hR9a8qFjEw',
      views: 28900,
      age_rating: 'kids',
      featured: 0
    },
    {
      title: 'Campfire Cooking in Another World',
      series: 'Campfire Cooking',
      episode: 1,
      description: 'Transported to a fantasy world with only an "Online Grocery" skill, Tsuyoshi Mukoda creates mouthwatering modern dishes that captivate magical creatures and legendary beasts.',
      category: 'Anime',
      year: 2023,
      file: '',
      poster: '/images/campfire-cooking.jpg',
      video_url: 'https://www.youtube.com/watch?v=tFvQ0bB-t6o',
      trailer_url: 'https://www.youtube.com/watch?v=1uR1O9vXGqM',
      views: 35100,
      age_rating: 'kids',
      featured: 0
    },

    // --- Acclaimed Anime Feature Films ---
    {
      title: 'Your Name (Kimi no Na wa)',
      description: 'Two teenagers share a profound, magical connection upon discovering they are swapping bodies. But things become even more complicated when the boy and girl decide to meet in person.',
      category: 'Anime',
      year: 2016,
      file: '',
      poster: '/images/your-name.jpg',
      video_url: 'https://www.youtube.com/watch?v=s0wTdCQoc2k',
      trailer_url: 'https://www.youtube.com/watch?v=s0wTdCQoc2k',
      views: 92400,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Suzume',
      description: 'A 17-year-old girl named Suzume helps a mysterious young man close mystical doors unleashing devastation across Japan, embarking on an epic journey to save humanity.',
      category: 'Anime',
      year: 2022,
      file: '',
      poster: '/images/suzume.jpg',
      video_url: 'https://www.youtube.com/watch?v=5pYFp_5sJ2w',
      trailer_url: 'https://www.youtube.com/watch?v=5pYFp_5sJ2w',
      views: 58200,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'A Silent Voice',
      description: 'A young man is ostracized by his classmates after he bullies a deaf girl to the point she moves away. Years later, he sets off on a journey for redemption to make amends.',
      category: 'Anime',
      year: 2016,
      file: '',
      poster: '/images/silent-voice.jpg',
      video_url: 'https://www.youtube.com/watch?v=nfK6UgLra7g',
      trailer_url: 'https://www.youtube.com/watch?v=nfK6UgLra7g',
      views: 61300,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Weathering With You',
      description: 'A high school boy who runs away to Tokyo befriends an orphaned girl who appears to have the miraculous ability to manipulate the weather and bring sunshine to the city.',
      category: 'Anime',
      year: 2019,
      file: '',
      poster: '/images/weathering-with-you.jpg',
      video_url: 'https://www.youtube.com/watch?v=Q6iK6DjV_iE',
      trailer_url: 'https://www.youtube.com/watch?v=Q6iK6DjV_iE',
      views: 47900,
      age_rating: 'teens',
      featured: 0
    },
    {
      title: 'Spirited Away',
      description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
      category: 'Anime',
      year: 2001,
      file: '',
      poster: '/images/spirited-away.jpg',
      video_url: 'https://www.youtube.com/watch?v=ByXuk9QqQkk',
      trailer_url: 'https://www.youtube.com/watch?v=ByXuk9QqQkk',
      views: 83500,
      age_rating: 'kids',
      featured: 0
    },

    // --- Hollywood Classics & Official Free Releases ---
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
      description = @description, category = @category, year = @year,
      poster = @poster, video_url = @video_url, trailer_url = @trailer_url,
      age_rating = @age_rating, featured = @featured, series = @series, episode = @episode
    WHERE id = @id
  `);

  for (const item of defaultTitles) {
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

  console.log('Seeding complete! Total videos in database:', db.prepare('SELECT COUNT(*) as count FROM videos').get().count);
}

if (require.main === module) {
  seed();
}

module.exports = seed;
