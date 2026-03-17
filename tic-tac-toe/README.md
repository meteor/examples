# Tic-Tac-Toe

Simple multiplayer game with multi-room support, built with [Meteor](https://www.meteor.com/), [React](https://react.dev/), and [MUI (Material UI)](https://mui.com/).

## Tech Stack

- **Meteor 3.4**: Full-stack framework with real-time data via publications/subscriptions
- **React 18**: UI components with hooks
- **MUI v6**: Material Design component library (AppBar, Cards, Dialogs, Icons, etc.)
- **React Router v5**: Client-side routing
- **Rspack**: Rust-based bundler

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Running

```bash
meteor
```

## How to play

This is a two-player game. Open the app in **two separate browser tabs** at `http://localhost:3000`:

1. In the first tab, click **Create Room**
2. Click **Join Room** from both tabs on the same room
3. Players alternate turns: one plays as X, the other as O
4. The game announces the winner via a dialog when three in a row is achieved

## Demo

![MUI Tic-Tac-Toe](https://github-production-user-asset-6210df.s3.amazonaws.com/2581993/564637741-c9e13036-4d67-4dfc-b9b6-fed5588d4490.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20260317%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260317T084448Z&X-Amz-Expires=300&X-Amz-Signature=a40ed6342ea5a3c43f6f59f89e44ba4699ad58d7caa5966a6e6f14eb72ecdb60&X-Amz-SignedHeaders=host)
