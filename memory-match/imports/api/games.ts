import { Mongo } from 'meteor/mongo';

import type { GameState } from '../game/types';

export interface GameDocument {
  _id?: string;
  playerName: string;
  seed: string;
  state: GameState;
  score?: number;
  createdAt: number;
  updatedAt: number;
  revision?: number;
}

export const Games = new Mongo.Collection<GameDocument>('memory_games');
