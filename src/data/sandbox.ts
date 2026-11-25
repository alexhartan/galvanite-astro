export const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'What We Do' },
  { id: 'process', label: 'How It Works' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const label = (id: SectionId) =>
  sections.find((section) => section.id === id)!.label;

export const hero = {
  crumbs: [
    { label: 'Home', href: import.meta.env.BASE_URL },
    { label: 'Services' },
  ],
  lead: 'Brand and web work for',
  emphasis: 'technical products',
  description:
    'Positioning, identity and websites for data and AI companies, delivered by a senior team in focused sprints.',
};

export const overview = {
  statement: [
    { text: 'We turn complex products into brands that are easy to ' },
    { text: 'understand', strong: true },
    { text: ', easy to ' },
    { text: 'trust', strong: true },
    { text: ' and easy to ' },
    { text: 'choose', strong: true },
    { text: '.' },
  ],
};

export const services = {
  heading: 'Three ways we help',
  items: [
    {
      title: 'Positioning\nand messaging',
      summary:
        'We define who the product is for, what it replaces and why it matters, then turn that into copy your whole team can use.',
    },
    {
      title: 'Identity\nand design system',
      summary:
        'A visual language built for technical audiences: type, color, illustration and components that scale from slides to product.',
    },
    {
      title: 'Website\ndesign and build',
      summary:
        'A fast, accessible site in Astro or Next.js, with a CMS your marketing team can update without a developer.',
    },
  ],
};

export const process = {
  heading: 'From first call to launch',
};
