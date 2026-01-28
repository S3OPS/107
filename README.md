# DxD Academy: FAA Part 107 Rating Game 🎮

A gamified quiz application for FAA Part 107 Remote Pilot Certificate preparation, themed with High School DxD aesthetics.

## 🚀 Quick Start

1. Open `src/index.html` in a web browser (use a local server for ES modules)
2. Click "ENTER THE ACADEMY" to begin
3. Answer questions to earn Demonic Power and increase your rank!

### Running Locally
```bash
# Using Python
cd src && python -m http.server 8080

# Using Node.js
npx serve src

# Using PHP
cd src && php -S localhost:8080
```

## 📁 Project Structure

```
├── src/
│   ├── game.js          # Main game orchestrator
│   ├── modules/
│   │   ├── config.js    # Game configuration
│   │   ├── state.js     # State management
│   │   ├── quiz.js      # Quiz logic
│   │   └── ui.js        # DOM rendering
│   ├── index.html       # Entry point
│   └── style.css        # Styling
├── data/
│   └── questions.json   # Quiz questions
├── assets/
│   ├── images/          # Mentor images
│   └── audio/           # Sound effects
└── docs/
    └── THE_ONE_RING.md  # Strategic roadmap
```

## 🎯 Features

- 60 FAA Part 107 practice questions
- Combo scoring system
- Rank progression (Lower → Middle → High → Ultimate Class Devil)
- Progress tracking
- Animated feedback effects

## 📖 Documentation

See [The One Ring](docs/THE_ONE_RING.md) for the complete project roadmap and next steps.

## 🛡️ Security

- XSS protection via input sanitization
- Path traversal prevention
- Frozen configuration objects
- Input validation on quiz data

## License

MIT