import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

import { defaultLocale, type Locale } from "@/i18n/config";
import type { ResumeData } from "@/types/resume";

function getResumeFilePath(locale: Locale): string {
  return path.join(process.cwd(), `src/data/resume.${locale}.yaml`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function ensureString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid YAML schema: ${field} should be a non-empty string.`);
  }

  return value;
}

function ensureNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid YAML schema: ${field} should be a valid number.`);
  }

  return value;
}

function ensureStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid YAML schema: ${field} should be a string array.`);
  }

  return value;
}

function ensureSectionLabels(value: unknown): [string, string, string] {
  const labels = ensureStringArray(value, "ui.sectionLabels");

  if (labels.length !== 3) {
    throw new Error("Invalid YAML schema: ui.sectionLabels must contain 3 items.");
  }

  return [labels[0], labels[1], labels[2]];
}

function ensureResumeData(value: unknown): ResumeData {
  if (!isRecord(value)) {
    throw new Error("Invalid YAML format: root should be an object.");
  }

  if (
    !isRecord(value.site) ||
    !isRecord(value.ui) ||
    !isRecord(value.profile) ||
    !Array.isArray(value.socials) ||
    !Array.isArray(value.websites)
  ) {
    throw new Error(
      "Invalid YAML schema: expected site, ui, profile, socials, and websites sections."
    );
  }

  const site = value.site;
  const ui = value.ui;
  const profile = value.profile;

  const socials = value.socials.map((social, index) => {
    if (!isRecord(social)) {
      throw new Error(`Invalid YAML schema: socials[${index}] should be an object.`);
    }

    return {
      name: ensureString(social.name, `socials[${index}].name`),
      handle: ensureString(social.handle, `socials[${index}].handle`),
      url: ensureString(social.url, `socials[${index}].url`),
      description: ensureString(
        social.description,
        `socials[${index}].description`
      ),
    };
  });

  const websites = value.websites.map((website, index) => {
    if (!isRecord(website)) {
      throw new Error(
        `Invalid YAML schema: websites[${index}] should be an object.`
      );
    }

    return {
      name: ensureString(website.name, `websites[${index}].name`),
      url: ensureString(website.url, `websites[${index}].url`),
      description: ensureString(
        website.description,
        `websites[${index}].description`
      ),
      tags: ensureStringArray(website.tags, `websites[${index}].tags`),
    };
  });

  if (!Array.isArray(profile.stats)) {
    throw new Error("Invalid YAML schema: profile.stats should be an array.");
  }

  const stats = profile.stats.map((stat, index) => {
    if (!isRecord(stat)) {
      throw new Error(`Invalid YAML schema: profile.stats[${index}] should be an object.`);
    }

    const suffix = stat.suffix;
    if (suffix !== undefined && typeof suffix !== "string") {
      throw new Error(
        `Invalid YAML schema: profile.stats[${index}].suffix should be a string.`
      );
    }

    return {
      label: ensureString(stat.label, `profile.stats[${index}].label`),
      value: ensureNumber(stat.value, `profile.stats[${index}].value`),
      ...(suffix !== undefined ? { suffix } : {}),
    };
  });

  return {
    site: {
      title: ensureString(site.title, "site.title"),
      description: ensureString(site.description, "site.description"),
      subtitle: ensureString(site.subtitle, "site.subtitle"),
      filing: ensureFiling(site.filing),
    },
    ui: {
      sectionLabels: ensureSectionLabels(ui.sectionLabels),
      socialPanelDescription: ensureString(
        ui.socialPanelDescription,
        "ui.socialPanelDescription"
      ),
      websitesPanelDescription: ensureString(
        ui.websitesPanelDescription,
        "ui.websitesPanelDescription"
      ),
      scrollHint: ensureString(ui.scrollHint, "ui.scrollHint"),
    },
    profile: {
      name: ensureString(profile.name, "profile.name"),
      role: ensureString(profile.role, "profile.role"),
      location: ensureString(profile.location, "profile.location"),
      email: ensureString(profile.email, "profile.email"),
      summary: ensureString(profile.summary, "profile.summary"),
      highlights: ensureStringArray(profile.highlights, "profile.highlights"),
      stats,
    },
    socials,
    websites,
  };
}

function ensureFiling(value: unknown): { text: string; url?: string } {
  if (!isRecord(value)) {
    throw new Error("Invalid YAML schema: site.filing should be an object.");
  }

  const text = ensureString(value.text, "site.filing.text");
  const urlValue = value.url;

  if (urlValue === undefined) {
    return { text };
  }

  if (typeof urlValue !== "string" || urlValue.trim().length === 0) {
    throw new Error("Invalid YAML schema: site.filing.url should be a non-empty string.");
  }

  return { text, url: urlValue };
}

async function loadYamlByLocale(locale: Locale): Promise<unknown> {
  const yamlText = await readFile(getResumeFilePath(locale), "utf8");
  return yaml.load(yamlText);
}

export async function getResumeData(locale: Locale = defaultLocale): Promise<ResumeData> {
  const parsed = await loadYamlByLocale(locale);
  return ensureResumeData(parsed);
}
