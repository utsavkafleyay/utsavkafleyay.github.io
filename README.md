# Vocabulary Explorer

A dynamic vocabulary app powered by Merriam-Webster Dictionary API.

## Features

- 🔍 Look up any word with comprehensive definitions
- 📚 Etymology and word origins
- 🔊 Audio pronunciations
- 🔗 Synonyms and antonyms (clickable)
- ⭐ Save favorite words
- 📝 Search history
- 🎲 Random word from your favorites/history

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Your Merriam-Webster API key is already configured in `src/config/api.js`.

**Note:** The `src/config/api.js` file is gitignored to protect your API key. If you need to share the project:
- Use `src/config/api.example.js` as a template
- Add your key to `api.js` locally

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173/usage` to use the vocabulary explorer.

## Usage

- **Search**: Type any word and press Enter or click Search
- **Favorites**: Click the ★ to save words
- **History**: Access recent searches from the bottom bar
- **Related Words**: Click any synonym/antonym to explore
- **Audio**: Click 🔊 to hear pronunciation
- **Random**: Get a random word from your collection

## API Information

This app uses the Merriam-Webster Collegiate Dictionary API:
- **Documentation**: https://dictionaryapi.com
- **Free tier**: Available for non-commercial use
- **Data**: Definitions, etymology, synonyms, antonyms, pronunciations

## Project Structure

```
src/
├── App.jsx              # Router setup
├── pages/
│   └── Home.jsx         # Landing page
├── components/
│   └── UsageDictLayer.jsx  # Main vocabulary interface
├── services/
│   └── dictionaryApi.js    # Merriam-Webster API client
├── utils/
│   └── storage.js          # LocalStorage for favorites/history
└── config/
    └── api.js              # API configuration (gitignored)
```

## Technologies

- React 18
- React Router v6
- Vite
- Merriam-Webster Dictionary API
