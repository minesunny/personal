import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResumeHome } from "@/components/resume-home";
import { isLocale, type Locale } from "@/i18n/config";
import { getResumeData } from "@/lib/resume";

interface LocalePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLocale(rawLocale: string): Locale {
  if (!isLocale(rawLocale)) {
    notFound();
  }

  return rawLocale;
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = parseLocale(rawLocale);
  const resumeData = await getResumeData(locale);

  return {
    title: {
      absolute: resumeData.site.title,
    },
    description: resumeData.site.description,
    alternates: {
      languages: {
        zh: "/zh",
        en: "/en",
      },
    },
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale: rawLocale } = await params;
  const locale = parseLocale(rawLocale);
  const resumeData = await getResumeData(locale);

  return <ResumeHome data={resumeData} locale={locale} />;
}
