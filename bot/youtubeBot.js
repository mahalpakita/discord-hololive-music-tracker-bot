require("dotenv").config({ path: "./dev.env" });
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");

const {
  DISCORD_TOKEN,
  YOUTUBE_API_KEY,
  DISCORD_CHANNEL_ID,
} = process.env;

// Add YouTube channels here
const YOUTUBE_CHANNELS = [
  { name: "JohnBuiChūbā", channelId: "UCADDnSMEnIWADucecpU5tsQ" },
];

// Save last videos (prevents spam on restart)
const DATA_FILE = "./bot/lastVideos.json";
let lastVideos = fs.existsSync(DATA_FILE)
  ? JSON.parse(fs.readFileSync(DATA_FILE))
  : {};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  // Validate environment variables
  if (!DISCORD_TOKEN || !YOUTUBE_API_KEY || !DISCORD_CHANNEL_ID) {
    console.error("❌ Missing required environment variables!");
    process.exit(1);
  }
  
  // Run initial check
  console.log("🔍 Running initial check for new videos...");
  for (const channel of YOUTUBE_CHANNELS) {
    try {
      await checkChannel(channel);
    } catch (err) {
      console.error(`Error checking ${channel.name}:`, err.message);
    }
  }
  console.log("✅ Initial check complete. Monitoring for new uploads...");
});

async function checkChannel(channel) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channel.channelId}&part=snippet,id&order=date&maxResults=1&type=video`;

  const res = await axios.get(url);
  
  // Check if API returned any items
  if (!res.data.items || res.data.items.length === 0) {
    return;
  }
  
  const item = res.data.items[0];

  if (!item || item.id.kind !== "youtube#video") return;

  const videoId = item.id.videoId;

  // Skip if this is the same video we already notified about
  if (lastVideos[channel.channelId] === videoId) return;

  // Save the new video ID
  lastVideos[channel.channelId] = videoId;
  fs.writeFileSync(DATA_FILE, JSON.stringify(lastVideos, null, 2));

  // Send notification to Discord
  const discordChannel = await client.channels.fetch(DISCORD_CHANNEL_ID);
  if (!discordChannel) {
    throw new Error(`Channel ${DISCORD_CHANNEL_ID} not found!`);
  }
  
  await discordChannel.send(
    `📢 **New upload from ${channel.name}!**\n**${item.snippet.title}**\nhttps://youtu.be/${videoId}`
  );
  
  console.log(`✅ Posted new video from ${channel.name}: ${item.snippet.title}`);
}

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  for (const channel of YOUTUBE_CHANNELS) {
    try {
      await checkChannel(channel);
    } catch (err) {
      console.error(`Error checking ${channel.name}`, err.message);
    }
  }
});

client.login(DISCORD_TOKEN);
