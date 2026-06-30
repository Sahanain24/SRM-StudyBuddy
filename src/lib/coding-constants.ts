export const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++'] as const;
export type Language = typeof LANGUAGES[number];
