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
  { name: "Tokino Sora", channelId: "UCp6993wxpyDPHUpavwDFqgg" },
  { name: "Robocosan", channelId: "UCDqI2jOz0weumE8s7paEk6g" },
  { name: "Hoshimachi Suisei", channelId: "UC5CwaMl1eIgY8h02uZw7u8A" },
  { name: "Sakura Miko", channelId: "UC-hM6YJuNYVAmUWxeIr9FeA" },
  { name: "AZKi", channelId: "UC0TXe_LYZ4scaW2XMyi5_kw" },
  { name: "Shirakami Fubuki", channelId: "UCdn5BQ06XqgXoAxIhbqw5Rg" },
  { name: "Natsuiro Matsuri", channelId: "UCQ0UDLQCjY0rmuxCDE38FGg" },
  { name: "Akai Haato / Haachama", channelId: "UC1CfXB_kRs3C-zaeTG3oGyg" },
  { name: "Aki Rosenthal", channelId: "UCFTLzh12_nrtzqBPsTCqenA" },
  { name: "Nakiri Ayame", channelId: "UC7fk0CB07ly8oSl0aqKkqFg" },
  { name: "Yuzuki Choco", channelId: "UC1suqwovbL1kzsoaZgFZLKg" },
  { name: "Oozora Subaru", channelId: "UCvzGlP9oQwU--Y0r9id_jnA" },
  { name: "Ookami Mio", channelId: "UCp-5t9SrOQwXMU7iIjQfARg" },
  { name: "Nekomata Okayu", channelId: "UCvaTdHTWBGv3MKj3KVqJVCw" },
  { name: "Usada Pekora", channelId: "UC1DCedRgGHBdm81E1llLhOQ" },
  { name: "Houshou Marine", channelId: "UCCzUftO8KOVkV4wQG1vkUvg" },
  { name: "Shiranui Flare", channelId: "UCvInZx9h3jC2JzsIzoOebWg" },
  { name: "Shirogane Noel", channelId: "UCdyqAaZDKHXg4Ahi7VENThQ" },
  { name: "Tsunomaki Watame", channelId: "UCqm3BQLlJfvkTsX_hvm0UmA" },
  { name: "Tokoyami Towa", channelId: "UC1uv2Oq6kNxgATlCiez59hw" },
  { name: "Himemori Luna", channelId: "UCa9Y57gfeY0Zro_noHRVrnw" },
  { name: "Momosuzu Nene", channelId: "UCAWSyEs_Io8MtpY3m-zqILA" },
  { name: "Omaru Polka", channelId: "UCK9V2B22uJYu3N7eR_BT9QA" },
  { name: "Shishiro Botan", channelId: "UCUKD-uaobj9jiqB-VXt71mA" },
  { name: "Yukihana Lamy", channelId: "UCFKOVgVbGmX65RxO3EtH3iw" },
  { name: "La+ Darknesss", channelId: "UCENwRMx5Yh42zWpzURebzTw" },
  { name: "Takane Lui", channelId: "UCs9_O1tRPMQTHQ-N_L6FU2g" },
  { name: "Sakamata Chloe", channelId: "UCIBY1ollUsauvVi4hW4cumw" },
  { name: "Hakui Koyori", channelId: "UC6eWCld0KwmyHFbAqK3V-Rw" },
  { name: "Kazama Iroha", channelId: "UC_vMYWcDjmfdpH6r4TTn1MQ" },
  { name: "Otonose Kanade", channelId: "UCWQtYtq9EOB4-I5P-3fh8lA" },
  { name: "Ichijou Ririka", channelId: "UCtyWhCj3AqKh2dXctLkDtng" },
  { name: "Juufuutei Raden", channelId: "UCdXAk5MpyLD8594lm_OvtGQ" },
  { name: "Todoroki Hajime", channelId: "UC1iA6_NT4mtAcIII6ygrvCw" },
  { name: "Kikirara Vivi", channelId: "UCGzTVXqMQHa4AgJVJIVvtDQ" },
  { name: "Isaki Riona", channelId: "UC9LSiN9hXI55svYEBrrK-tw" },
  { name: "Koganei Niko", channelId: "UCuI_opAVX6qbxZY-a-AxFuQ" },
  { name: "Mizumiya Su", channelId: "UCjk2nKmHzgH5Xy-C5qYRd5A" },
  { name: "Rindo Chihaya", channelId: "UCKMWFR6lAstLa7Vbf5dH7ig" },
  // Hololive ID
  { name: "Ayunda Risu", channelId: "UCOyYb1c43VlX9rc_lT6NKQw" },
  { name: "Moona Hoshinova", channelId: "UCP0BspO_AMEe3aQqqpo89Dg" },
  { name: "Airani Iofifteen", channelId: "UCAoy6rzhSf4ydcYjJw3WoVg" },
  { name: "Kureiji Ollie", channelId: "UCYz_5n-uDuChHtLo7My1HnQ" },
  { name: "Anya Melfissa", channelId: "UC727SQYUvx5pDDGQpTICNWg" },
  { name: "Pavolia Reine", channelId: "UChgTyjG-pdNvxxhdsXfHQ5Q" },
  { name: "Kobo Kanaeru", channelId: "UCjLEmnpCNeisMxy134KPwWw" },
  { name: "Vestia Zeta", channelId: "UCTvHWSfBZgtxE4sILOaurIQ" },
  { name: "Kaela Kovalskia", channelId: "UCZLZ8Jjx_RN2CXloOmgTHVg" },
  // Hololive EN
  { name: "Ninomae Ina'nis", channelId: "UCMwGHR0BTZuLsmjY_NT5Pwg" },
  { name: "Takanashi Kiara", channelId: "UCHsx4Hqa-1ORjQTh9TYDhww" },
  { name: "Mori Calliope", channelId: "UCL_qhgtOy0dy1Agp8vkySQg" },
  { name: "IRyS", channelId: "UC8rcEBzJSleTkf_-agPM20g" },
  { name: "Watson Amelia", channelId: "UCyl1z3jo3XHR1riLFKG5UAg" },
  { name: "Ouro Kronii", channelId: "UCmbs8T6MWqUHP1tIQvSgKrg" },
  { name: "Hakos Baelz", channelId: "UCgmPnx-EEeOrZSg5Tiw7ZRQ" },
  { name: "Shiori Novella", channelId: "UCgnfPPb9JI3e9A4cXHnWbyg" },
  { name: "Koseki Bijou", channelId: "UC9p_lqQ0FEDz327Vgf5JwqA" },
  { name: "Nerissa Ravencroft", channelId: "UC_sFNM0z0MWm9A6WlKPuMMg" },
  { name: "FuwaMoco", channelId: "UCt9H_RpQzhxzlyBxFqrdHqA" },
  { name: "Elizabeth Rose Bloodflame", channelId: "UCW5uhrG1eCBYditmhL0Ykjw" },
  { name: "Gigi Murin", channelId: "UCDHABijvPBnJm7F-KlNME3w" },
  { name: "Cecilia Immergreen", channelId: "UCvN5h1ShZtc7nly3pezRayg" },
  { name: "Raora Panthera", channelId: "UCl69AEx4MdqMZH7Jtsm7Tig" },
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

async function checkChannel(channel) {
  // Get more results to find music videos (in case latest isn't music)
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channel.channelId}&part=snippet,id&order=date&maxResults=10&type=video`;

  const res = await axios.get(url);
  
  // Check if API returned any items
  if (!res.data.items || res.data.items.length === 0) {
    return;
  }
  
  // Collect candidates and prefer keyword hits first
  let musicVideo = null;
  const candidates = [];

  for (const item of res.data.items) {
    if (item.id.kind !== "youtube#video") continue;

    const videoId = item.id.videoId;
    const keywordHit = isMusicKeywordHit(item);
    candidates.push({ item, videoId, keywordHit });

    if (keywordHit) {
      musicVideo = item; // most recent keyword match
      break;
    }
  }

  // If no keyword hit, fall back to Music category/topic detection
  if (!musicVideo && candidates.length > 0) {
    const ids = candidates.map((c) => c.videoId).join(",");
    const detailsRes = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,topicDetails&id=${ids}&key=${YOUTUBE_API_KEY}`
    );

    const detailMap = new Map();
    for (const d of detailsRes.data.items || []) {
      detailMap.set(d.id, d);
    }

    for (const candidate of candidates) {
      const details = detailMap.get(candidate.videoId);
      if (isMusicCategoryMatch(details)) {
        musicVideo = candidate.item;
        break;
      }
    }
  }

  // If still no music video found, skip
  if (!musicVideo) return;

  const videoId = musicVideo.id.videoId;

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
  
  // Determine if it's a cover or original
  const title = musicVideo.snippet.title.toLowerCase();
  const isCover = title.includes("cover") || title.includes("カバー") || 
                  title.includes("歌ってみた") || title.includes("vocal cover");
  const emoji = isCover ? "🎵" : "🎶";
  const type = isCover ? "Cover" : "Music Video";
  
  await discordChannel.send(
    `${emoji} **New ${type} from ${channel.name}!**\n**${musicVideo.snippet.title}**\nhttps://youtu.be/${videoId}`
  );
  
  console.log(`✅ Posted new ${type.toLowerCase()} from ${channel.name}: ${musicVideo.snippet.title}`);
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
