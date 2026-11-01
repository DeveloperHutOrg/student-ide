import { SurveyDefinition } from './types';

export const DEFAULT_SURVEY_ID = 'student-feedback-v1';
export const DEFAULT_SURVEY_VERSION = '1.0.0';

export const INITIAL_SURVEY: SurveyDefinition = {
  id: DEFAULT_SURVEY_ID,
  title: 'Student IDE Student Feedback Survey',
  version: DEFAULT_SURVEY_VERSION,
  description: 'Help us understand how students use Student IDE and how we can improve programming education.',
  isActive: true,
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      text: 'How easy is Student IDE to use?',
      type: 'single_choice',
      required: true,
      options: [
        'Very Easy',
        'Easy',
        'Average',
        'Difficult',
        'Very Difficult',
      ],
    },
    {
      id: 'q2',
      questionNumber: 2,
      text: 'Which programming language do you use most?',
      type: 'single_choice',
      required: true,
      options: [
        'Python',
        'C++',
        'JavaScript',
        'HTML and CSS',
        'SQL',
        'PHP',
      ],
    },
    {
      id: 'q3',
      questionNumber: 3,
      text: 'How often do you use Student IDE?',
      type: 'single_choice',
      required: true,
      options: [
        'Daily',
        'Several times a week',
        'Once a week',
        'Occasionally',
      ],
    },
    {
      id: 'q4',
      questionNumber: 4,
      text: 'Which features do you find most useful?',
      type: 'multiple_choice',
      required: true,
      options: [
        'Code Editor',
        'File Explorer',
        'Code Execution',
        'Output Terminal',
        'Live Web Preview',
      ],
    },
    {
      id: 'q5',
      questionNumber: 5,
      text: 'What improvements would you like to see?',
      type: 'multiple_choice',
      required: true,
      options: [
        'Tutorials',
        'More programming languages',
        'Coding exercises',
        'Better error explanations',
        'More project examples',
      ],
    },
    {
      id: 'q6',
      questionNumber: 6,
      text: 'Additional suggestions:',
      type: 'text',
      required: false,
      placeholder: 'Tell us anything else that could make your programming experience better (optional)...',
    },
  ],
};
