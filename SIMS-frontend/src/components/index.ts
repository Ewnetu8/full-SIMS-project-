// ─── Component Library — Top-Level Barrel Export ──────────────────────────────
// Re-exports every component sub-directory so consumers can import from
// '@/components' or directly from the sub-barrel (e.g., '@/components/ui').

export { ThemeToggle }                  from './common/theme-toggle';

// Layout
export * from './layout';

// Navigation
export * from './navigation';

// UI primitives
export * from './ui';

// Forms
export {
  FormWrapper, FormField, HelperText, ErrorMessage,
  FileUpload, DatePicker, MultiSelect,
} from './forms';
export type {
  FormWrapperProps, FormFieldProps, FileUploadProps,
  DatePickerProps, MultiSelectProps,
} from './forms';

// Feedback
export * from './feedback';

// Data Display
export * from './data-display';

// Charts
export {
  AppLineChart, AppBarChart, AppPieChart, AppAreaChart,
  ChartContainer, CHART_COLORS,
}                                       from './charts';
export type {
  LineChartProps, BarChartProps, PieChartProps, AreaChartProps,
}                                       from './charts';

// AI Components
export {
  AIInsightCard, AIFeedbackCard, AILoader,
  RecommendationCard, ConfidenceBadge,
}                                       from './ai';
export type {
  AIInsightCardProps, AIFeedbackCardProps, AILoaderProps,
  RecommendationCardProps, RecommendationItem, ConfidenceBadgeProps,
}                                       from './ai';

// Examination Components
export {
  QuestionCard, ExamTimer, ExamProgressBar,
  QuestionNavigator, ExamStatusBadge, ExamNavButtons,
}                                       from './examination';
export type {
  QuestionCardProps, ExamTimerProps, ExamProgressBarProps,
  QuestionNavigatorProps, ExamStatusBadgeProps, ExamNavButtonsProps,
  QuestionType, QuestionOption, QuestionStatus, ExamStatus,
}                                       from './examination';
