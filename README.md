# Discord Hololive Music YouTube Bot

A Discord bot that monitors Hololive member YouTube channels and automatically posts notifications when they upload new music videos or covers.

## Features

- 🎵 **Music Detection**: Automatically filters and detects only music videos and covers (ignores streams, gaming videos, etc.)
- 🌐 **Multi-language Support**: Recognizes music keywords in both English and Japanese
- ⏰ **Automatic Monitoring**: Checks for new uploads every 5 minutes
- 🎶 **Smart Filtering**: Distinguishes between covers and original music videos
- 📝 **Duplicate Prevention**: Prevents spam by tracking already posted videos

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

3. **Get a Discord Bot Token:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the token and add it to `dev.env`

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

1. The bot checks the 10 most recent videos from each configured channel
2. Filters videos to find only music-related content (covers, original songs, etc.)
3. Compares with previously posted videos to avoid duplicates
4. Posts a notification to your Discord channel with:
   - 🎵 for covers
   - 🎶 for original music videos
   - Video title and link

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
- Non-music videos (streams, gaming, etc.) are automatically filtered out

## Troubleshooting

- **Bot not posting**: Check that the bot has permission to send messages in the channel
- **Missing videos**: Ensure the YouTube API key has proper quotas and permissions
- **Duplicate posts**: Delete `bot/lastVideos.json` to reset tracking (will repost recent videos)

## License

MIT
