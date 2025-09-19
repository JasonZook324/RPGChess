# Chess RPG Battle

## Overview

A chess game with RPG mechanics built using React Three Fiber and Express. Players can engage in traditional chess gameplay enhanced with level-up systems, attribute allocation, and battle mechanics. The game features both player vs player and player vs computer modes with different AI difficulty levels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Core UI framework using functional components and hooks
- **React Three Fiber**: 3D chess board rendering and game visualization
- **Zustand**: State management for game logic, audio, and UI state
- **Tailwind CSS + Radix UI**: Styling system with pre-built component library
- **Vite**: Build tool and development server with hot module replacement

### Backend Architecture
- **Express.js**: Minimal REST API server
- **Node.js ESM**: Modern module system for server-side code
- **Storage Interface**: Abstracted data layer with in-memory implementation
- **TypeScript**: Full-stack type safety

### Game Logic
- **Chess Engine**: Complete rule validation, move generation, and check/checkmate detection
- **RPG System**: Level progression, attribute allocation (attack, defense, health), and XP calculation
- **Battle System**: Dice-based combat resolution when pieces capture each other
- **AI Implementation**: Three difficulty levels with different strategic approaches

### Data Storage
- **Drizzle ORM**: Database schema definition and migration management
- **Neon PostgreSQL**: Connected to user's Neon database for persistent data storage
- **Session Management**: Express sessions with PostgreSQL store using Neon connection
- **Real-time Storage**: All user accounts, game states, and multiplayer sessions persisted in Neon database

### State Management Pattern
- **Zustand Stores**: Separate stores for game state, audio controls, and UI state
- **Subscription Pattern**: Reactive updates using zustand's subscribeWithSelector
- **Immutable Updates**: Proper state mutations for complex game state

### 3D Rendering
- **Three.js Integration**: Custom chess piece models and board rendering
- **Animation System**: Smooth piece movements, selection feedback, and battle effects
- **Shader Support**: GLSL shader loading for advanced visual effects
- **Asset Management**: Support for 3D models (GLTF/GLB) and audio files

### Development Workflow
- **Hot Reload**: Vite development server with error overlay
- **Type Checking**: Strict TypeScript configuration across frontend and backend
- **Path Aliases**: Simplified imports using @ and @shared prefixes
- **Build Process**: Separate client and server build outputs

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React Three Fiber, React Three Drei for 3D components
- **Three.js**: WebGL rendering engine for 3D graphics
- **Express.js**: Web server framework

### UI and Styling
- **Radix UI**: Comprehensive headless component library for modals, buttons, cards
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for UI elements

### State and Data Management
- **Zustand**: Lightweight state management with TypeScript support
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: Serverless PostgreSQL hosting

### Development Tools
- **Vite**: Build tool with plugin ecosystem
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

### Game-Specific Libraries
- **UUID**: Unique identifier generation for game pieces
- **Class Variance Authority**: Type-safe styling variants
- **React Hook Form**: Form state management for game settings

### Audio and Assets
- **Web Audio API**: Browser audio playback (no external audio libraries)
- **GLTF/GLB Support**: 3D model loading through Three.js loaders
- **Font Loading**: Inter font family via Fontsource