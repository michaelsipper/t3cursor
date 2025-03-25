// lib/constants.ts
export const MAX_PHOTOS = 6;
export const MAX_PROMPTS = 4;
export const DEFAULT_STATUS_OPTIONS = [
  "Down to hangout",
  "Busy week",
  "Out of town",
  "Looking to explore"
] as const;

export const DEFAULT_PHOTO_REGIONS = {
  BANNER: 'banner',
  AVATAR: 'avatar',
  MAIN: 'main',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary'
} as const;

export type PhotoRegion = typeof DEFAULT_PHOTO_REGIONS[keyof typeof DEFAULT_PHOTO_REGIONS];