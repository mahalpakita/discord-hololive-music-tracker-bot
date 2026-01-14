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

// Add YouTube channels here (Hololive members)
const YOUTUBE_CHANNELS = [
  // Hololive JP Gen 0-1
  { name: "Hoshimachi Suisei", channelId: "UC5CwaMl1eIgY8h02uZw7u8A" },
  { name: "Sakura Miko", channelId: "UC-hM6YJuNYVAmUWxeIr9FeA" },
  { name: "AZKi", channelId: "UC0TXe_LYZ4scaW2XMyi5_kw" },
  { name: "Shirakami Fubuki", channelId: "UCdn5BQ06XqgXoAxIhbqw5Rg" },
  { name: "Natsuiro Matsuri", channelId: "UCQ0UDLQCjY0rmuxCDE38FGg" },
  { name: "Akai Haato / Haachama", channelId: "UC1CfXB_kRs3C-zaeTG3oGyg" },
  { name: "Nakiri Ayame", channelId: "UC7fk0CB07ly8oSl0aqKkqFg" },
  { name: "Oozora Subaru", channelId: "UCvzGlP9oQwU--Y0r9id_jnA" },
  { name: "Nekomata Okayu", channelId: "UCvaTdHTWBGv3MKj3KVqJVCw" },
  { name: "Usada Pekora", channelId: "UC1DCedRgGHBdm81E1llLhOQ" },
  { name: "Houshou Marine", channelId: "UCCzUftO8KOVkV4wQG1vkUvg" },
  { name: "Tsunomaki Watame", channelId: "UCqm3BQLlJfvkTsX_hvm0UmA" },
  { name: "Tokoyami Towa", channelId: "UC1uv2Oq6kNxgATlCiez59hw" },
  { name: "Himemori Luna", channelId: "UCa9Y57gfeY0Zro_noHRVrnw" },
  { name: "Momosuzu Nene", channelId: "UCAWSyEs_Io8MtpY3m-zqILA" },
  { name: "Yukihana Lamy", channelId: "UCFKOVgVbGmX65RxO3EtH3iw" },
  { name: "La+ Darknesss", channelId: "UCENwRMx5Yh42zWpzURebzTw" },
  { name: "Hakui Koyori", channelId: "UC6eWCld0KwmyHFbAqK3V-Rw" },
  { name: "Kazama Iroha", channelId: "UC_vMYWcDjmfdpH6r4TTn1MQ" },
  { name: "Kikirara Vivi", channelId: "UCGzTVXqMQHa4AgJVJIVvtDQ" },
  { name: "Mizumiya Su", channelId: "UCjk2nKmHzgH5Xy-C5qYRd5A" },

];

// Keywords to identify music videos and covers (English and Japanese)
const MUSIC_KEYWORDS = [
  // English keywords
  "cover", "song", "music", "original song", "mv", "music video",
  "singing", "vocal", "vocal cover", "cover song","Original Anime MV","original", "karaoke", "official",
  // Japanese keywords
  "カバー", "歌ってみた", "歌", "音楽", "オリジナル曲", "MV", "ミュージックビデオ",
  "歌唱", "ボーカル", "カバーソング", "オリジナル", "曲", "公式", "オフィシャル"
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

// Check if video title/description suggests music content (cover or original)
function isMusicKeywordHit(video) {
  if (!video || !video.snippet) return false;
  
  const title = video.snippet.title.toLowerCase();
  const description = (video.snippet.description || "").toLowerCase();
  const combinedText = `${title} ${description}`;
  
  // Check if any music keyword appears in title or description
  return MUSIC_KEYWORDS.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
}

// Check if YouTube reports the video as Music category or topic
function isMusicCategoryMatch(details) {
  if (!details || !details.snippet) return false;

  const categoryId = details.snippet.categoryId;
  const topics = details.topicDetails?.topicCategories || [];

  const isMusicCategory = categoryId === "10"; // YouTube Music category
  const isMusicTopic = topics.some((t) => t.toLowerCase().includes("music"));

  return isMusicCategory || isMusicTopic;
}

// Check if video is a regular video (not live stream or short)
function isRegularVideo(item, details) {
  if (!item || !item.snippet) return false;
  
  // Exclude live streams (live, upcoming, or past live)
  const liveBroadcastContent = item.snippet.liveBroadcastContent;
  if (liveBroadcastContent && liveBroadcastContent !== "none") {
    return false; // It's a live stream or upcoming live
  }
  
  // Exclude YouTube Shorts
  const title = item.snippet.title.toLowerCase();
  const description = (item.snippet.description || "").toLowerCase();
  
  // Check for #shorts in title or description
  if (title.includes("#shorts") || description.includes("#shorts")) {
    return false;
  }
  
  // Check if URL would be a shorts URL (though we use videoId, shorts have specific pattern)
  // Shorts are typically under 60 seconds, but we'll rely on title/description check
  // Also check video duration if available in details
  if (details && details.contentDetails) {
    const duration = details.contentDetails.duration;
    if (duration) {
      // Parse ISO 8601 duration (e.g., PT1M30S = 1 minute 30 seconds)
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // Shorts are typically 60 seconds or less
        if (totalSeconds <= 60) {
          return false;
        }

        // User request: don't post videos longer than 6 minutes
        if (totalSeconds > 6 * 60) {
          return false;
        }
      }
    }
  }
  
  return true; // It's a regular video
}

// Post a simple message: channel name, title, link
async function postVideo(videoItem, videoDetails, channel, isCatchUp = false) {
  const discordChannel = await client.channels.fetch(DISCORD_CHANNEL_ID);
  if (!discordChannel) {
    throw new Error(`Channel ${DISCORD_CHANNEL_ID} not found!`);
  }

  const videoId = videoItem.id.videoId;
  const snippet = videoDetails?.snippet || videoItem.snippet;
  const title = snippet.title;
  const videoUrl = `https://youtu.be/${videoId}`;

  // Use <...> to prevent Discord from auto-embedding the link (keeps it clean)
  // If you WANT the big playable preview, remove the < and >.
  const message = `**${channel.name}**\n${title}\n<${videoUrl}>`;

  await discordChannel.send(message);
  console.log(
    `✅ Posted${isCatchUp ? " (catch-up)" : ""} from ${channel.name}: ${title}`
  );
}

async function checkChannel(channel) {
  try {
    // Get results to catch up on missed videos (reduced to 2 to save API quota)
    const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channel.channelId}&part=snippet,id&order=date&maxResults=2&type=video`;

    const res = await axios.get(url);
    
    // Check if API returned any items
    if (!res.data.items || res.data.items.length === 0) {
      return;
    }
    
    // Collect all music video candidates
    const candidates = [];
    const videoIds = [];

    for (const item of res.data.items) {
      if (item.id.kind !== "youtube#video") continue;
      videoIds.push(item.id.videoId);
      candidates.push(item);
    }

    // Get detailed information for all candidates
    if (videoIds.length === 0) return;
    
    const ids = videoIds.join(",");
    let detailsRes;
    try {
      detailsRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,topicDetails,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`
      );
    } catch (error) {
      if (error.response) {
        if (error.response.status === 403) {
          console.error(`❌ 403 Forbidden for ${channel.name} (video details): ${error.response.data?.error?.message || 'API quota exceeded or key invalid'}`);
        } else {
          console.error(`❌ API Error for ${channel.name} (video details): ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
        }
      } else {
        console.error(`❌ Network Error for ${channel.name} (video details):`, error.message);
      }
      return;
    }

    const detailMap = new Map();
    for (const d of detailsRes.data.items || []) {
      detailMap.set(d.id, d);
    }

    // Find all music videos
    const musicVideos = [];
    const lastVideoId = lastVideos[channel.channelId];
    const isFirstRun = !lastVideoId; // First time checking this channel

    for (const item of candidates) {
      const videoId = item.id.videoId;
      const details = detailMap.get(videoId);
      
      // Skip if not a regular video (exclude live streams and shorts)
      if (!isRegularVideo(item, details)) continue;
      
      // On first run, only get the most recent music video to avoid spamming old videos
      if (isFirstRun && musicVideos.length > 0) break;
      
      // Skip if this is the last video we already posted
      if (lastVideoId === videoId) break;
      
      const keywordHit = isMusicKeywordHit(item);
      const categoryMatch = details ? isMusicCategoryMatch(details) : false;
      
      if (keywordHit || categoryMatch) {
        // Add publish date for sorting
        const publishDate = new Date(item.snippet.publishedAt);
        musicVideos.push({ item, details, videoId, publishDate });
      }
    }

    // If no music videos found, skip
    if (musicVideos.length === 0) return;

    // Sort by publish date (oldest first) to post in chronological order
    musicVideos.sort((a, b) => a.publishDate - b.publishDate);

    // Post all missed videos in order
    for (let i = 0; i < musicVideos.length; i++) {
      const { item, details, videoId } = musicVideos[i];
      const isCatchUp = i < musicVideos.length - 1; // All except the newest are catch-ups
      
      await postVideo(item, details, channel, isCatchUp);
      
      // Small delay between posts to avoid rate limiting
      if (i < musicVideos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      // Update last video ID after each post
      lastVideos[channel.channelId] = videoId;
    }

    // Save the latest video ID
    fs.writeFileSync(DATA_FILE, JSON.stringify(lastVideos, null, 2));
  } catch (error) {
    if (error.response) {
      // API responded with error
      if (error.response.status === 403) {
        const errorMessage = error.response.data?.error?.message || 'API quota exceeded or key invalid';
        console.error(`❌ 403 Forbidden for ${channel.name}: ${errorMessage}`);
        if (error.response.data?.error?.errors) {
          error.response.data.error.errors.forEach(err => {
            console.error(`   Reason: ${err.reason}, Domain: ${err.domain}`);
          });
        }
      } else if (error.response.status === 404) {
        console.error(`❌ 404 Not Found for ${channel.name}: Channel may not exist or be private`);
      } else if (error.response.status === 400) {
        console.error(`❌ 400 Bad Request for ${channel.name}: ${error.response.data?.error?.message || error.message}`);
      } else {
        console.error(`❌ API Error for ${channel.name}: ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
      }
    } else if (error.request) {
      console.error(`❌ Network Error for ${channel.name}: No response from YouTube API`);
    } else {
      console.error(`❌ Error for ${channel.name}:`, error.message);
    }
    return; // Skip this channel on error
  }
}

// Run every 15 minutes (reduced from 5 to save API quota)
// This spreads out API calls and reduces quota usage significantly
cron.schedule("*/15 * * * *", async () => {
  console.log(`🔍 Checking ${YOUTUBE_CHANNELS.length} channels for new music videos...`);
  for (const channel of YOUTUBE_CHANNELS) {
    try {
      await checkChannel(channel);
      // Add 2 second delay between channels to:
      // 1. Avoid rate limiting from YouTube API
      // 2. Spread out quota usage over time
      // 3. Prevent overwhelming the API with rapid requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`Error checking ${channel.name}`, err.message);
      // Still add delay even on error to maintain consistent timing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.log(`✅ Finished checking all channels. Next check in 15 minutes.`);
});

client.login(DISCORD_TOKEN);
