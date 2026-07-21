import { Meteor } from 'meteor/meteor';
import { z } from 'zod';

const IdSchema = z.string().trim().min(1).max(64);
const GameIdSchema = z.string().trim().min(1);
const ActionSchema = z.enum(['shield', 'cool', 'boost']);
const ModeSchema = z.enum(['solo', 'crew']);
const StatusSchema = z.enum(['waiting', 'playing', 'won', 'lost']);
const TurnSchema = z.enum(['player', 'copilot']);
const EmergencySchema = z.enum(['meteor', 'overheat', 'path']);
const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, 'Enter a six-character room code');

const PlayerSchema = z
  .object({
    id: IdSchema,
    ownerId: IdSchema.nullable(),
    role: TurnSchema,
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

const EventSchema = z
  .object({
    type: z.enum(['action', 'timeout']),
    actorId: z.string().optional(),
    action: ActionSchema.optional(),
    now: z.number().int().nonnegative(),
    emergency: EmergencySchema,
    outcome: z.string().min(1).max(32),
  })
  .strict();

export const StartSoloSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    testMode: z.boolean().optional().default(false),
  })
  .strict();

export const AnswerSchema = z
  .object({
    ownerId: IdSchema,
    playerId: IdSchema,
    gameId: GameIdSchema,
    action: ActionSchema,
  })
  .strict();

export const CreateCrewSchema = StartSoloSchema;

export const JoinCrewSchema = z
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
    copilotId: IdSchema.nullable(),
    participantIds: z.array(IdSchema).max(2),
    players: z.array(PlayerSchema).min(1).max(2),
    roomCode: RoomCodeSchema.nullable(),
    status: StatusSchema,
    emergency: EmergencySchema,
    turn: TurnSchema,
    shield: z.number().int().min(0).max(100),
    warp: z.number().int().min(0).max(100),
    score: z.number().int().min(0),
    streak: z.number().int().min(0),
    bestStreak: z.number().int().min(0),
    endsAt: z.number().int().nonnegative().nullable(),
    turnEndsAt: z.number().int().nonnegative().nullable(),
    events: z.array(EventSchema).max(5),
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
