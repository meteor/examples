import { z } from 'zod';

export const REPORT_CATEGORIES = [
  'Pothole',
  'Streetlight',
  'Sidewalk',
  'Graffiti',
  'Blocked lane',
  'Other',
];

export const REPORT_STATUSES = ['draft', 'submitted', 'in review', 'fixed'];

const OwnerIdSchema = z.string().min(1).max(100);
const ReportIdSchema = z.string().min(1);
const ReportCategorySchema = z.enum(REPORT_CATEGORIES).default('Other');

const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000).optional(),
});

export const CreateReportSchema = z.object({
  ownerId: OwnerIdSchema,
  category: ReportCategorySchema,
});

export const UpdateReportSchema = z.object({
  ownerId: OwnerIdSchema,
  reportId: ReportIdSchema,
  patch: z.object({
    title: z.string().min(1).max(80).optional(),
    description: z.string().max(500).optional(),
    category: ReportCategorySchema.optional(),
    photoDataUrl: z.string().max(400000).optional(),
    location: LocationSchema.optional(),
  }),
});

export const SubmitReportSchema = z.object({
  ownerId: OwnerIdSchema,
  reportId: ReportIdSchema,
});

export const SetStatusSchema = z.object({
  ownerId: OwnerIdSchema,
  reportId: ReportIdSchema,
  status: z.enum(REPORT_STATUSES),
});
