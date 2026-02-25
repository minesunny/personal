export interface SiteData {
  title: string;
  description: string;
  subtitle: string;
  filing: FilingData;
}

export interface FilingData {
  text: string;
  url?: string;
}

export interface UiTextData {
  sectionLabels: [string, string, string];
  socialPanelDescription: string;
  websitesPanelDescription: string;
  scrollHint: string;
}

export interface ProfileStat {
  label: string;
  value: number;
  suffix?: string;
}

export interface ProfileData {
  name: string;
  role: string;
  location: string;
  email: string;
  summary: string;
  highlights: string[];
  stats: ProfileStat[];
}

export interface SocialLink {
  name: string;
  handle: string;
  url: string;
  description: string;
}

export interface WebsiteLink {
  name: string;
  url: string;
  description: string;
  tags: string[];
}

export interface ResumeData {
  site: SiteData;
  ui: UiTextData;
  profile: ProfileData;
  socials: SocialLink[];
  websites: WebsiteLink[];
}
