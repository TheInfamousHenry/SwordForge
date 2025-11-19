# ⚔️ SwordForge - Multiplayer Battle Arena

A real-time multiplayer battle game with crafting, trading, and dueling systems. Built with React, Phaser 3, Node.js, Socket.io, and MongoDB.

![Game Status](https://img.shields.io/badge/status-Phase%202%20Complete-success)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎮 Features

### ✅ Phase 1 - Core Multiplayer (Complete)
- **Real-time multiplayer** with Socket.io - Multiple players in a shared world
- **Server-authoritative architecture** - All game logic validated server-side
- **Combat system** - Melee attacks with damage, knockback, and cooldowns
- **Enemy AI** - Server-controlled enemies that chase and attack players
- **Resource collection** - Gather resources from defeated enemies
- **Player synchronization** - Smooth position and action updates
- **Auto-respawn system** - Automatic respawn after death
- **Minimap** - Track players, enemies, and world boundaries
- **Danger zones** - Red border areas that damage players

### ✅ Phase 2 - Progression & Crafting (Complete)
- **Authentication system** - Secure user accounts with JWT
- **Crafting system** - Forge swords at The Forge
  - 4 sword tiers: Basic, Refined, Enhanced, Masterwork
  - Level requirements and resource costs
  - Persistent inventory across sessions
- **Resource system** - 6 resource types (Iron, Steel, Stone, Wood, Crystal, Mythril)
- **Experience & Leveling** - Gain XP from crafting and combat
- **Equipment system** - Equip and repair swords
- **Trading Post** - Player-to-player resource trading
  - Create sell offers
  - Browse and purchase from other players
  - Cancel your active offers
- **Duel system** - Challenge other players to 1v1 battles
  - Wager resources on the outcome
  - Win/loss tracking
  - Real-time challenge notifications

### 🎯 New Game Mechanics
- **Sword throwing** - Press C or click to throw your equipped sword
- **Dash system** - Hold SHIFT to charge, release to dash
  - 3 dash charges that recharge over time
  - Charge for up to 2 seconds for maximum speed and damage
  - Visual charge indicator and trail effects
- **Enhanced combat** - Equipped swords provide attack bonuses
- **Resource drops** - Different drop rates for each resource type

## 🎮 Controls

| Key | Action |
|-----|--------|
| **WASD** or **Arrow Keys** | Move your character |
| **SPACE** | Attack nearby enemies |
| **C** or **Mouse Click** | Throw equipped sword (2s cooldown) |
| **SHIFT** | Hold to charge dash, release to dash |
| Walk over resources | Collect them |

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework with hooks
- **Phaser 3** - 2D game engine for rendering and physics
- **Socket.io Client** - Real-time WebSocket communication
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Socket.io** - WebSocket server for multiplayer
- **MongoDB** - NoSQL database for user data
- **Mongoose** - MongoDB object modeling
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing

## 📁 Project Structure

```
swordforge/
├── client/                 # React + Phaser frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── crafting/  # ForgeInterface
│   │   │   ├── duel/      # DuelInterface
│   │   │   ├── game/      # PhaserGame, GameUI, Minimap
│   │   │   ├── inventory/ # InventoryInterface
│   │   │   ├── layout/    # Header, Footer
│   │   │   ├── trading/   # ShopInterface
│   │   │   └── ui/        # Button, ConnectionStatus
│   │   ├── game/
│   │   │   ├── entities/  # Entity class (players, enemies)
│   │   │   ├── scenes/    # GameScene (Phaser scene)
│   │   │   └── config.js  # Game configuration
│   │   ├── pages/         # LoginPage, RegisterPage, HomePage, GamePage
│   │   ├── services/      # AuthService, SocketService
│   │   ├── hooks/         # useSocket custom hook
│   │   ├── App.jsx        # Main app component with routing
│   │   └── main.jsx       # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Node.js + Socket.io backend
│   ├── src/
│   │   └── server.js      # Express + Socket.io + MongoDB
│   └── package.json
│
├── package.json           # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** - Running locally on port 27017 (or update connection string)
- **npm** or **yarn**

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swordforge.git
   cd swordforge
   ```

2. **Install MongoDB** (if not installed)
   ```bash
   # macOS (Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community

   # Ubuntu
   sudo apt-get install mongodb
   sudo systemctl start mongodb

   # Windows - Download from mongodb.com
   ```

3. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongosh  # Test connection
   ```

5. **Start the server** (in server directory)
   ```bash
   cd server
   npm start
   ```
   
   Server will start on `http://localhost:3000`

6. **Start the client** (in new terminal, in client directory)
   ```bash
   cd client
   npm run dev
   ```
   
   Client will start on `http://localhost:5173`

7. **Play the game!**
   - Open `http://localhost:5173` in your browser
   - Create an account or login
   - Open multiple tabs to test multiplayer

### Building for Production

```bash
# Build the client
cd client
npm run build

# Built files will be in client/dist/

# Start production server
cd ../server
NODE_ENV=production npm start
```

## 🌐 Deployment

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/swordforge
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=production
```

### Deploy to Railway / Render

1. **Push your code to GitHub**

2. **Deploy the server**:
   - Connect your GitHub repository
   - Set environment variables (PORT, MONGODB_URI, JWT_SECRET)
   - Railway/Render will automatically detect Node.js
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Update client Socket.io URL**:
   ```javascript
   // In client/src/pages files, update:
   const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://your-server.railway.app';
   ```

4. **Deploy!**

### MongoDB Atlas (Cloud Database)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create cluster and get connection string
3. Update `MONGODB_URI` environment variable
4. Whitelist server IP or use `0.0.0.0/0` for development

## 🎮 Game Mechanics

### Combat System
- **Melee Attack**: 20 base damage + equipped sword bonus
- **Thrown Sword**: 30 base damage + equipped sword bonus
- **Attack Range**: 50 units (melee), unlimited (thrown)
- **Attack Cooldown**: Instant (melee), 2 seconds (thrown)
- **Knockback**: Enemies pushed back when hit

### Dash System
- **Charges**: 3 maximum, recharge every 5 seconds
- **Charge Time**: Hold SHIFT up to 2 seconds
- **Speed**: 500-1000 units/sec (based on charge)
- **Damage Boost**: 1x-2x (based on charge)
- **Duration**: 200ms

### Enemy AI
- **Health**: 100 HP
- **Levels**: 1-3 (affects damage and drops)
- **Chase Range**: 300 units
- **Attack Range**: 40 units
- **Attack Damage**: 15 HP
- **Attack Cooldown**: 1 second
- **Respawn**: 3 seconds after death

### Crafting System

#### Sword Tiers
1. **Basic Iron Sword** (Level 1)
   - Cost: 5 Iron, 2 Wood
   - Stats: +5 Attack, 100 Durability
   - XP: 50

2. **Refined Steel Sword** (Level 5)
   - Cost: 8 Steel, 10 Iron, 3 Wood
   - Stats: +15 Attack, 200 Durability
   - XP: 150

3. **Enhanced Crystal Sword** (Level 10)
   - Cost: 3 Crystal, 15 Steel, 10 Stone
   - Stats: +30 Attack, 350 Durability
   - XP: 400

4. **Masterwork Mythril Sword** (Level 20)
   - Cost: 5 Mythril, 8 Crystal, 20 Steel
   - Stats: +50 Attack, 500 Durability
   - XP: 1000

#### Resources
- **Iron** ⚙️ - Common (80% drop rate)
- **Wood** 🪵 - Common (60% drop rate)
- **Stone** 🪨 - Common (50% drop rate)
- **Steel** 🔩 - Uncommon (30% drop rate)
- **Crystal** 💎 - Rare (10% drop rate)
- **Mythril** ✨ - Very Rare (2% drop rate)

### Leveling System
- **XP Sources**: Crafting, collecting resources, defeating enemies
- **Level Formula**: XP Required = Level × 100 + Level² × 50
- **Benefits**: Unlock higher tier recipes

### Trading System
- **Currency**: Iron (⚙️)
- **Create Offers**: Sell any resource type
- **Price**: Set your own price per unit
- **Browse**: View all active offers from other players
- **Commission**: None (player-to-player trading)

### Duel System
- **Challenge**: Any online player
- **Wager**: Bet resources (both players wager equally)
- **Prize**: Winner takes both wagers
- **Stats**: Win/loss record tracked
- **Timeout**: Challenges expire after 1 minute

### World Layout
- **World Size**: 3000 × 3000 units
- **Safe Zone**: 2600 × 2600 units (center)
- **Danger Zone**: 200-unit red border (1 HP/tick damage)
- **Movement Speed**: 160 units/sec

## 🛠️ Development

### Running Tests
```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test
```

### Code Style
```bash
# Lint frontend
cd client
npm run lint

# Lint backend
cd server
npm run lint
```

### Database Management

```bash
# Connect to MongoDB
mongosh

# View databases
show dbs

# Use SwordForge database
use swordforge

# View collections
show collections

# View users
db.users.find()

# Clear all users (development only!)
db.users.deleteMany({})
```

## 📝 API Documentation

### REST Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request:**
```json
{
  "username": "player123",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "player123",
    "level": 1,
    "resources": { "IRON": 20, "WOOD": 15, ... }
  }
}
```

#### POST `/api/auth/login`
Login to existing account.

**Request:**
```json
{
  "username": "player123",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": { ... }
}
```

### Socket Events

#### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `playerMove` | `{velocityX, velocityY, facingAngle}` | Update player movement |
| `playerAttack` | - | Attack nearby enemies |
| `throwSword` | `{angle}` | Throw equipped sword |
| `playerDash` | `{velocityX, velocityY, damageBoost, duration}` | Execute dash |
| `collectResource` | `resourceId` | Collect nearby resource |
| `respawn` | - | Request respawn after death |
| `craftSword` | `{recipeKey}` | Craft a sword |
| `equipSword` | `{swordId}` | Equip sword from inventory |
| `repairSword` | `{swordId}` | Repair damaged sword |
| `createOffer` | `{resourceType, amount, pricePerUnit}` | Create trade offer |
| `buyOffer` | `{offerId}` | Purchase trade offer |
| `cancelOffer` | `{offerId}` | Cancel your trade offer |
| `challengeDuel` | `{targetId, wager}` | Challenge player to duel |
| `acceptDuel` | `{challengeId}` | Accept duel challenge |
| `declineDuel` | `{challengeId}` | Decline duel challenge |

#### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `init` | `{playerId, worldSize, players, enemies, resources}` | Initial game state |
| `gameState` | `{players, enemies}` | Regular state updates (60/sec) |
| `playerJoined` | `{id, username, x, y, health}` | New player connected |
| `playerLeft` | `playerId` | Player disconnected |
| `playerAttacked` | `{playerId, enemyId, enemyHealth, enemyAlive}` | Player attacked enemy |
| `enemyAttack` | `{enemyId, targetId, damage}` | Enemy attacked player |
| `swordThrown` | `{id, playerId, x, y, angle}` | Sword thrown |
| `swordUpdate` | `[{id, x, y, angle}, ...]` | Thrown sword positions |
| `swordHit` | `{swordId, enemyId, enemyHealth, enemyAlive}` | Sword hit enemy |
| `swordRemoved` | `swordId` | Sword expired |
| `resourceDropped` | `{id, x, y, type, amount}` | Resource spawned |
| `resourceCollected` | `{resourceId, playerId}` | Resource picked up |
| `enemySpawned` | `{id, x, y, health, level}` | Enemy spawned |
| `enemyRemoved` | `enemyId` | Enemy despawned |
| `playerRespawned` | `{id, x, y}` | Player respawned |
| `progressUpdate` | `{level, experience, resources, ...}` | Player progress updated |
| `shopOffersUpdate` | `[offers]` | Trade offers updated |
| `onlinePlayersUpdate` | `[players]` | Online players list |
| `duelChallenge` | `{id, challengerName, wager}` | Received duel challenge |
| `duelAccepted` | `{duel}` | Challenge accepted |
| `duelDeclined` | `{targetName}` | Challenge declined |

## 🗺️ Roadmap

### Phase 3 - Enhanced Combat (Next)
- [ ] Multiple weapon types (spear, axe, bow)
- [ ] Special abilities and skills
- [ ] Combo system
- [ ] Critical hits
- [ ] Status effects (poison, stun, etc.)

### Phase 4 - World Expansion
- [ ] Larger maps with multiple biomes
- [ ] Environmental hazards
- [ ] NPCs and quests
- [ ] Boss enemies
- [ ] Dungeons

### Phase 5 - Social Features
- [ ] Guilds/clans
- [ ] Party system
- [ ] Chat system
- [ ] Friend list
- [ ] Leaderboards

### Phase 6 - Polish & Features
- [ ] Mobile support
- [ ] Better graphics and animations
- [ ] Sound effects and music
- [ ] Achievement system
- [ ] Daily rewards
- [ ] Seasonal events

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongodb           # Linux
```

### Socket.io Connection Error
```
Error: Connection failed: Authentication required
```
**Solution**: Clear localStorage and login again
```javascript
localStorage.clear()
```

### Client Can't Connect to Server
**Solution**: Check that server is running on port 3000 and client is pointing to correct URL

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf client/.vite
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Coding Standards
- Use ESLint configuration provided
- Follow existing code style
- Add comments for complex logic
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**itHuRTZ (Henry Tunguz)**
- GitHub: [@TheInfamousHenry](https://github.com/TheInfamousHenry)
- Twitter: [@yourusername](https://twitter.com/yourusername)

## ⭐ Acknowledgments

- Built with ❤️ using React, Phaser, Node.js, and Socket.io
- Inspired by classic multiplayer arena games
- Thanks to the open-source community

## 🎯 Show Your Support

Give a ⭐️ if you like this project!

---

**Last Updated**: November 2024
**Current Version**: 2.0.0 (Phase 2 Complete)