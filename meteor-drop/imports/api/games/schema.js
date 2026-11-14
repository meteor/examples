import { Meteor } from 'meteor/meteor';
import { z } from 'zod';
import { BOARD_COLUMNS, BOARD_ROWS } from './engine';

const IdSchema = z.string().trim().min(1).max(64);
const GameIdSchema = z.string().trim().min(1);
const ModeSchema = z.enum(['solo', 'live']);
const StatusSchema = z.enum(['waiting', 'playing', 'won', 'draw']);
const MarkerSchema = z.enum(['player', 'rival']);
const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, 'Enter a six-character room code');

const PlayerSchema = z
  .object({
    id: IdSchema,
    ownerId: IdSchema.nullable(),
    role: MarkerSchema,
    type: z.enum(['human', 'cpu']),
  })
  .strict()
  .superRefine((player, context) => {
    if (player.type === 'human' && player.ownerId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Human players require ownerId',
      });
    }

    if (player.type === 'cpu' && player.ownerId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPU players cannot carry ownerId',
      });
    }
  });

const LastMoveSchema = z
  .object({
    actorId: IdSchema,
    marker: MarkerSchema,
    column: z.number().int().min(0).max(BOARD_COLUMNS - 1),
    row: z.number().int().min(0).max(BOARD_ROWS - 1),
    index: z.number().int().min(0).max(BOARD_ROWS * BOARD_COLUMNS - 1),
    now: z.number().int().nonnegative(),
  })
  .strict();

export const StartSoloSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    testMode: z.boolean().optional().default(false),
  })
  .strict();

export const DropMeteorSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    gameId: GameIdSchema,
    column: z.number().int().min(0).max(BOARD_COLUMNS - 1),
  })
  .strict();

export const CreateLiveMatchSchema = StartSoloSchema;

export const JoinLiveMatchSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    roomCode: RoomCodeSchema,
  })
  .strict();

export const RematchSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    gameId: GameIdSchema,
    testMode: z.boolean().optional().default(false),
  })
  .strict();

export const GameDocumentSchema = z
  .object({
    mode: ModeSchema,
    ownerId: IdSchema,
    ownerIds: z.array(IdSchema).min(1).max(2),
    playerId: IdSchema,
    rivalId: IdSchema.nullable(),
    participantIds: z.array(IdSchema).max(2),
    players: z.array(PlayerSchema).min(1).max(2),
    roomCode: RoomCodeSchema.nullable(),
    status: StatusSchema,
    board: z
      .array(MarkerSchema.nullable())
      .length(BOARD_ROWS * BOARD_COLUMNS),
    turn: MarkerSchema,
    winner: MarkerSchema.nullable(),
    winningCells: z
      .array(z.number().int().min(0).max(BOARD_ROWS * BOARD_COLUMNS - 1))
      .max(4),
    moveCount: z.number().int().min(0).max(BOARD_ROWS * BOARD_COLUMNS),
    lastMove: LastMoveSchema.nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  throw new Meteor.Error(
    'validation-error',
    result.error.issues.map((issue) => issue.message).join(', ')
  );
}

export function parseGameDocument(value) {
  return parseOrThrow(GameDocumentSchema, value);
}
