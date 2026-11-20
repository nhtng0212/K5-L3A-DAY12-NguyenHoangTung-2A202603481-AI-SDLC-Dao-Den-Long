import fs from 'fs';
import path from 'path';

const LEADERBOARD_FILE = path.resolve('leaderboard.json');

export function loadLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
      if (Array.isArray(data.entries)) return data.entries;
    }
  } catch (e) {}
  return [];
}

export function saveLeaderboard(entries) {
  // Sort descending by score; if equal, earlier achieved_at first
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.achieved_at) - new Date(b.achieved_at);
  });
  const top10 = entries.slice(0, 10);
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries: top10 }, null, 2) + '\n', 'utf-8');
  return top10;
}

export function addEntry({ name, score, nights_won = 0, seed = 1 }) {
  // Validate name: 3-12 characters [A-Za-z0-9_]
  if (!name || !/^[A-Za-z0-9_]{3,12}$/.test(name)) {
    throw new Error('Name must be 3-12 characters [A-Za-z0-9_]');
  }
  const entries = loadLeaderboard();
  const newEntry = {
    name,
    score,
    nights_won,
    achieved_at: new Date().toISOString(),
    seed
  };
  entries.push(newEntry);
  return saveLeaderboard(entries);
}

// CLI Handler
if (process.argv[1] && process.argv[1].endsWith('leaderboard.js')) {
  const args = process.argv.slice(2);
  let exportPath = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--export' && i + 1 < args.length) {
      exportPath = args[++i];
    }
  }

  if (exportPath) {
    const entries = loadLeaderboard();
    fs.writeFileSync(exportPath, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
    console.log(`Leaderboard exported to ${exportPath}`);
    process.exit(0);
  }
}
