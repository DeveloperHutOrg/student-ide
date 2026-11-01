import { z } from 'zod';

export const Q1_OPTIONS = ['Very Easy', 'Easy', 'Average', 'Difficult', 'Very Difficult'] as const;
export const Q2_OPTIONS = ['Python', 'C++', 'JavaScript', 'HTML and CSS', 'SQL', 'PHP'] as const;
export const Q3_OPTIONS = ['Daily', 'Several times a week', 'Once a week', 'Occasionally'] as const;
export const Q4_OPTIONS = [
  'Code Editor',
  'File Explorer',
  'Code Execution',
  'Output Terminal',
  'Live Web Preview',
] as const;
export const Q5_OPTIONS = [
  'Tutorials',
  'More programming languages',
  'Coding exercises',
  'Better error explanations',
  'More project examples',
] as const;

export const SubmitSurveySchema = z.object({
  surveyId: z.string().min(1, 'Survey ID is required'),
  answers: z.object({
    q1: z.enum(Q1_OPTIONS, {
      message: 'Please answer Question 1: How easy is Student IDE to use?',
    }),
    q2: z.enum(Q2_OPTIONS, {
      message: 'Please answer Question 2: Which programming language do you use most?',
    }),
    q3: z.enum(Q3_OPTIONS, {
      message: 'Please answer Question 3: How often do you use Student IDE?',
    }),
    q4: z
      .union([
        z.enum(Q4_OPTIONS),
        z.array(z.enum(Q4_OPTIONS)).min(1, 'Please select at least one useful feature'),
      ]),
    q5: z
      .union([
        z.enum(Q5_OPTIONS),
        z.array(z.enum(Q5_OPTIONS)).min(1, 'Please select at least one improvement you would like to see'),
      ]),
    q6: z
      .string()
      .max(2000, 'Additional suggestions must not exceed 2000 characters')
      .optional()
      .default(''),
  }),
});

export type ValidatedSubmitPayload = z.infer<typeof SubmitSurveySchema>;

/**
 * Validates survey submission payload using Zod.
 * Returns parsed payload or throws descriptive validation error.
 */
export function validateSurveySubmission(payload: unknown): ValidatedSubmitPayload {
  const parseResult = SubmitSurveySchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Validation failed: ${errorDetails}`);
  }
  return parseResult.data;
}
