import type { GuideSection as Section } from "@/lib/guides";

type Props = { sections: Section[]; title: string };

export function GuideSection({ sections, title }: Props) {
  return (
    <section id="guide" className="lt-prose" aria-labelledby="guide-title">
      <h2 id="guide-title">{title}</h2>
      {sections.map((section) => (
        <div key={section.heading} style={{ marginTop: 24 }}>
          <h3>{section.heading}</h3>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} style={{ marginTop: 8 }}>
              {paragraph}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
