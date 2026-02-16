import { DifficultyLevel } from '@/types/quiz.types';

export interface SeedQuestion {
  difficulty: DifficultyLevel;
  prompt: string;
  choices: string[];
  correctAnswer: number;
  tags: string[];
}

export const seedQuestions: SeedQuestion[] = [
  // Difficulty 1 - Very Easy
  {
    difficulty: 1,
    prompt: 'What is 2 + 2?',
    choices: ['3', '4', '5', '6'],
    correctAnswer: 1,
    tags: ['math', 'basic'],
  },
  {
    difficulty: 1,
    prompt: 'What color is the sky on a clear day?',
    choices: ['Green', 'Blue', 'Red', 'Yellow'],
    correctAnswer: 1,
    tags: ['general', 'nature'],
  },
  {
    difficulty: 1,
    prompt: 'How many days are in a week?',
    choices: ['5', '6', '7', '8'],
    correctAnswer: 2,
    tags: ['general', 'time'],
  },

  // Difficulty 2 - Easy
  {
    difficulty: 2,
    prompt: 'What is the capital of France?',
    choices: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    tags: ['geography', 'europe'],
  },
  {
    difficulty: 2,
    prompt: 'What is 15 × 3?',
    choices: ['35', '45', '55', '65'],
    correctAnswer: 1,
    tags: ['math', 'multiplication'],
  },
  {
    difficulty: 2,
    prompt: 'Which planet is known as the Red Planet?',
    choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    tags: ['science', 'astronomy'],
  },

  // Difficulty 3 - Easy-Medium
  {
    difficulty: 3,
    prompt: 'Who wrote "Romeo and Juliet"?',
    choices: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'],
    correctAnswer: 1,
    tags: ['literature', 'classic'],
  },
  {
    difficulty: 3,
    prompt: 'What is the square root of 144?',
    choices: ['10', '11', '12', '13'],
    correctAnswer: 2,
    tags: ['math', 'algebra'],
  },
  {
    difficulty: 3,
    prompt: 'In which year did World War II end?',
    choices: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2,
    tags: ['history', 'war'],
  },

  // Difficulty 4 - Medium
  {
    difficulty: 4,
    prompt: 'What is the chemical symbol for gold?',
    choices: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    tags: ['science', 'chemistry'],
  },
  {
    difficulty: 4,
    prompt: 'Which programming language is known for its use in data science?',
    choices: ['JavaScript', 'Python', 'C++', 'Ruby'],
    correctAnswer: 1,
    tags: ['technology', 'programming'],
  },
  {
    difficulty: 4,
    prompt: 'What is the smallest prime number?',
    choices: ['0', '1', '2', '3'],
    correctAnswer: 2,
    tags: ['math', 'number-theory'],
  },

  // Difficulty 5 - Medium
  {
    difficulty: 5,
    prompt: 'What is the capital of Australia?',
    choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctAnswer: 2,
    tags: ['geography', 'oceania'],
  },
  {
    difficulty: 5,
    prompt: 'In computing, what does CPU stand for?',
    choices: [
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Program Utility',
      'Computed Processing Utility',
    ],
    correctAnswer: 0,
    tags: ['technology', 'hardware'],
  },
  {
    difficulty: 5,
    prompt: 'What is 7³ (7 cubed)?',
    choices: ['243', '343', '443', '543'],
    correctAnswer: 1,
    tags: ['math', 'exponents'],
  },

  // Difficulty 6 - Medium-Hard
  {
    difficulty: 6,
    prompt: 'Which Nobel Prize category was added in 1968?',
    choices: ['Peace', 'Literature', 'Economics', 'Medicine'],
    correctAnswer: 2,
    tags: ['history', 'awards'],
  },
  {
    difficulty: 6,
    prompt: 'What is the time complexity of binary search?',
    choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
    correctAnswer: 1,
    tags: ['computer-science', 'algorithms'],
  },
  {
    difficulty: 6,
    prompt: 'In which ocean is the Mariana Trench located?',
    choices: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 3,
    tags: ['geography', 'oceans'],
  },

  // Difficulty 7 - Hard
  {
    difficulty: 7,
    prompt: 'What is the derivative of x² with respect to x?',
    choices: ['x', '2x', 'x²', '2x²'],
    correctAnswer: 1,
    tags: ['math', 'calculus'],
  },
  {
    difficulty: 7,
    prompt: 'Which element has the atomic number 79?',
    choices: ['Silver', 'Gold', 'Platinum', 'Mercury'],
    correctAnswer: 1,
    tags: ['science', 'chemistry'],
  },
  {
    difficulty: 7,
    prompt: 'In which year was the first iPhone released?',
    choices: ['2005', '2006', '2007', '2008'],
    correctAnswer: 2,
    tags: ['technology', 'history'],
  },

  // Difficulty 8 - Hard
  {
    difficulty: 8,
    prompt: 'What is the Planck constant approximately equal to?',
    choices: [
      '6.626 × 10⁻³⁴ J·s',
      '6.626 × 10⁻²⁴ J·s',
      '9.109 × 10⁻³¹ J·s',
      '1.602 × 10⁻¹⁹ J·s',
    ],
    correctAnswer: 0,
    tags: ['physics', 'quantum'],
  },
  {
    difficulty: 8,
    prompt: 'Which sorting algorithm has the best average-case time complexity?',
    choices: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Both Quick and Merge Sort'],
    correctAnswer: 3,
    tags: ['computer-science', 'algorithms'],
  },
  {
    difficulty: 8,
    prompt: 'In which year did the Byzantine Empire fall?',
    choices: ['1204', '1453', '1492', '1517'],
    correctAnswer: 1,
    tags: ['history', 'medieval'],
  },

  // Difficulty 9 - Very Hard
  {
    difficulty: 9,
    prompt: 'What is the value of Euler\'s number (e) to 4 decimal places?',
    choices: ['2.7183', '2.7128', '3.1416', '1.6180'],
    correctAnswer: 0,
    tags: ['math', 'constants'],
  },
  {
    difficulty: 9,
    prompt: 'Which theorem states that NP-complete problems are polynomial-time reducible?',
    choices: [
      'Church-Turing Thesis',
      'Cook-Levin Theorem',
      'Gödel\'s Incompleteness Theorem',
      'Halting Problem',
    ],
    correctAnswer: 1,
    tags: ['computer-science', 'theory'],
  },
  {
    difficulty: 9,
    prompt: 'What is the half-life of Carbon-14?',
    choices: ['5,730 years', '10,460 years', '2,865 years', '11,460 years'],
    correctAnswer: 0,
    tags: ['science', 'physics'],
  },

  // Difficulty 10 - Expert
  {
    difficulty: 10,
    prompt: 'What is the chromatic number of a complete graph K₇?',
    choices: ['5', '6', '7', '8'],
    correctAnswer: 2,
    tags: ['math', 'graph-theory'],
  },
  {
    difficulty: 10,
    prompt: 'In quantum mechanics, what does the Heisenberg Uncertainty Principle relate?',
    choices: [
      'Energy and time',
      'Position and momentum',
      'Both energy-time and position-momentum',
      'Wave and particle nature',
    ],
    correctAnswer: 2,
    tags: ['physics', 'quantum'],
  },
  {
    difficulty: 10,
    prompt: 'What is the computational complexity class of the Graph Isomorphism problem?',
    choices: ['P', 'NP-complete', 'NP-intermediate', 'PSPACE-complete'],
    correctAnswer: 2,
    tags: ['computer-science', 'complexity'],
  },
];