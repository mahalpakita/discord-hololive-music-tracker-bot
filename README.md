# Discord Hololive Music YouTube Bot!

A Discord bot that monitors Hololive member YouTube channels and automatically posts notifications when they upload new music videos or covers.

## Features

- 🎵 **Music Detection**: Automatically filters and detects only music videos and covers (ignores streams, gaming videos, shorts, and live streams)
- 🌐 **Multi-language Support**: Recognizes music keywords in both English and Japanese
- ⏰ **Automatic Monitoring**: Checks for new uploads every 5 minutes
- 🎶 **Smart Filtering**: Distinguishes between covers and original music videos
- 📝 **Duplicate Prevention**: Prevents spam by tracking already posted videos
- 🎬 **Playable Videos**: Videos are playable directly in Discord
- 📬 **Catch-up Mode**: Automatically catches up on missed videos when the bot restarts
- 🎨 **Beautiful Embeds**: Rich Discord embeds with thumbnails, descriptions, and metadata

## Prerequisites

- Node.js (v14 or higher)
- Discord Bot Token
- YouTube Data API v3 Key
- Discord Channel ID

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `dev.env` file in the root directory with the following:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   YOUTUBE_API_KEY=your_youtube_api_key
   DISCORD_CHANNEL_ID=your_discord_channel_id
   ```

4. **Get a YouTube API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "YouTube Data API v3"
   - Create credentials (API Key)
   - Copy the key and add it to `dev.env`

5. **Get Discord Channel ID:**
   - Enable Developer Mode in Discord (Settings > Advanced > Developer Mode)
   - Right-click on the channel where you want notifications
   - Click "Copy ID"
   - Add it to `dev.env`

6. **Add Hololive Channels:**
   Edit `bot/youtubeBot.js` and add channels to the `YOUTUBE_CHANNELS` array:
   ```javascript
   const YOUTUBE_CHANNELS = [
     { name: "Channel Name", channelId: "UCxxxxxxxxxxxxxxxxxxxxx" },
   ];
   ```

## Running the Bot

```bash
node bot/youtubeBot.js
```

The bot will:
- Log in to Discord
- Run an initial check for new videos
- Start monitoring every 5 minutes

## How It Works

1. The bot checks the 50 most recent videos from each configured channel
2. Filters out live streams, shorts, and non-music content
3. Identifies music videos using:
   - Keyword matching (title/description)
   - YouTube Music category detection
4. Compares with previously posted videos to avoid duplicates
5. Posts notifications to your Discord channel with:
   - 🎵 Playable YouTube embed (click to play in Discord)
   - 🎨 Rich embed with thumbnail, description, and metadata
   - 🎵 Pink color for covers
   - 🎶 Cyan color for original music videos
6. **Catch-up Mode**: When the bot restarts, it automatically finds and posts all missed videos in chronological order

## Music Detection Keywords

The bot recognizes music videos using these keywords:

**English:** cover, song, music, original song, mv, music video, singing, vocal, vocal cover, cover song, karaoke

**Japanese:** カバー, 歌ってみた, 歌, 音楽, オリジナル曲, MV, ミュージックビデオ, 歌唱, ボーカル, カバーソング, オリジナル, 曲

## File Structure

```
├── bot/
│   ├── youtubeBot.js      # Main bot script
│   └── lastVideos.json     # Tracks posted videos (auto-generated)
├── dev.env                 # Environment variables (not in git)
└── README.md
```

## Notes

- The `dev.env` file is gitignored for security
- `lastVideos.json` is automatically created to track posted videos
- The bot checks every 5 minutes (configurable in the cron schedule)
- Non-music videos (streams, gaming, shorts, live streams) are automatically filtered out
- Videos are posted with playable embeds - click the video to play directly in Discord
- On first run, the bot only posts the most recent music video to establish a baseline
- Subsequent runs will catch up on any missed videos automatically

## Troubleshooting

- **Bot not posting**: 
  - Check that the bot has permission to send messages in the channel
  - Verify the bot is online (check the member list in Discord)
  - Ensure the `DISCORD_CHANNEL_ID` is correct
  
- **403 Forbidden Error**: 
  - Your YouTube API quota may be exceeded (free tier: 10,000 units/day)
  - Check your API key is valid and not restricted
  - Verify API key restrictions in Google Cloud Console
  - With 60 channels checking every 5 minutes, you may need to increase quota or reduce check frequency
  
- **Missing videos**: 
  - Ensure the YouTube API key has proper quotas and permissions
  - Check console logs for error messages
  - Videos must be longer than 60 seconds (shorts are filtered out)
  
- **Duplicate posts**: 
  - Delete `bot/lastVideos.json` to reset tracking (will repost recent videos on next check)
  
- **Videos not playable**: 
  - Ensure the bot has "Embed Links" permission
  - The YouTube URL is sent first to create the playable embed



