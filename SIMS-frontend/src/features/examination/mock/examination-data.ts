import type { ExaminationSession } from '../types/examination.types';

export const mockExaminationSessions: ExaminationSession[] = [
  {
    examId: 'data-structures-midterm',
    examTitle: 'Mid-Semester Examination',
    course: 'Data Structures & Algorithms',
    courseCode: 'CSC 220',
    lecturer: 'Dr. Samuel Otieno',
    durationSeconds: 5400, // 90 minutes
    totalMarks: 50,
    passingScore: 60,
    allowedAttempts: 1,
    attemptNumber: 1,
    instructions: [
      'Ensure a stable network connection throughout the duration of the exam.',
      'Answer all required questions before submitting your response.',
      'You can flag questions to revisit them using the sidebar navigator.',
      'Your answers are saved automatically every few seconds.',
      'Once submitted, answers cannot be edited or resubmitted.',
    ],
    academicIntegrityNotice:
      'By starting this examination, you affirm on your honor that all submitted work is purely your own, executed without unauthorized collaboration, external assistance, or prohibited references.',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        prompt: 'Which data structure follows the Last In, First Out (LIFO) principle?',
        marks: 5,
        required: true,
        options: [
          { id: 'a', text: 'Queue' },
          { id: 'b', text: 'Stack' },
          { id: 'c', text: 'Singly Linked List' },
          { id: 'd', text: 'Binary Search Tree' },
        ],
      },
      {
        id: 'q2',
        type: 'multiple_select',
        prompt: 'Select all operations that have an average time complexity of O(log n) in a balanced Binary Search Tree (BST).',
        marks: 10,
        required: true,
        options: [
          { id: 'a', text: 'Element Search' },
          { id: 'b', text: 'Element Insertion' },
          { id: 'c', text: 'Element Deletion' },
          { id: 'd', text: 'In-order Traversal of all nodes' },
        ],
      },
      {
        id: 'q3',
        type: 'true_false',
        prompt: 'A Queue data structure can be effectively implemented using two Stacks without exceeding O(1) amortized cost per operation.',
        marks: 5,
        required: true,
      },
      {
        id: 'q4',
        type: 'short_answer',
        prompt: 'What is the worst-case time complexity of Quick Sort algorithm when choosing a naive pivot (e.g. first element) on an already sorted array? Express using Big-O notation.',
        marks: 10,
        required: true,
        maxCharacters: 50,
      },
      {
        id: 'q5',
        type: 'essay',
        prompt: 'Compare Singly Linked Lists and Dynamic Arrays in terms of memory allocation, cache locality, and element retrieval performance. Provide a concrete scenario where a Linked List is superior to a Dynamic Array.',
        marks: 20,
        required: true,
        maxCharacters: 1500,
      },
    ],
  },
  {
    examId: 'software-engineering-final',
    examTitle: 'End-of-Semester Final Examination',
    course: 'Software Engineering Architecture',
    courseCode: 'CSC 310',
    lecturer: 'Prof. Grace Wanjiku',
    durationSeconds: 7200, // 120 minutes
    totalMarks: 100,
    passingScore: 65,
    allowedAttempts: 1,
    attemptNumber: 1,
    instructions: [
      'Read each scenario carefully before providing architectural recommendations.',
      'Ensure essay answers clearly state principles, trade-offs, and design patterns.',
      'Use the question navigator to monitor answered and unanswered items.',
      'Answers are auto-saved in the background every 5 seconds.',
    ],
    academicIntegrityNotice:
      'All responses must reflect your independent work. Plagiarism or consultation with external AI services will result in immediate disqualification.',
    questions: [
      {
        id: 'se1',
        type: 'multiple_choice',
        prompt: 'Which SOLID principle states that high-level modules should not depend on low-level modules, but both should depend on abstractions?',
        marks: 15,
        required: true,
        options: [
          { id: 's1', text: 'Single Responsibility Principle' },
          { id: 's2', text: 'Open/Closed Principle' },
          { id: 's3', text: 'Liskov Substitution Principle' },
          { id: 's4', text: 'Dependency Inversion Principle' },
        ],
      },
      {
        id: 'se2',
        type: 'true_false',
        prompt: 'Microservices architecture always reduces system latency compared to a well-structured Monolithic architecture.',
        marks: 10,
        required: true,
      },
      {
        id: 'se3',
        type: 'short_answer',
        prompt: 'State the name of the design pattern used to encapsulate a request as an object, thereby letting you parameterize clients with different requests.',
        marks: 15,
        required: true,
        maxCharacters: 100,
      },
      {
        id: 'se4',
        type: 'essay',
        prompt: 'Discuss the trade-offs between Event-Driven Architecture and Synchronous RESTful APIs in a distributed healthcare system. Consider data consistency, failure isolation, and complexity.',
        marks: 60,
        required: true,
        maxCharacters: 2000,
      },
    ],
  },
];