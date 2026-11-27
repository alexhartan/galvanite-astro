export const sections = [
  { id: 'intro', label: 'Our Mission' },
  { id: 'work', label: 'Featured Work' },
  { id: 'engagements', label: 'Pricing', dark: true },
  { id: 'testimonials', label: 'Testimonials', dark: true },
  { id: 'why', label: 'Why Galvanite' },
  { id: 'faq', label: 'FAQ', dark: true },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const label = (id: SectionId) =>
  sections.find((section) => section.id === id)!.label;

export const hero = {
  eyebrow: 'AI Native Creative Studio for Data/AI Companies',
  lead: 'We make highly technical products',
  emphasis: 'feel inevitable',
  description:
    'A lean creative studio focused on making technical products clear, compelling and easy to choose.',
};

export const mission = {
  statement: [
    { text: 'Brands and websites for deeply technical products that ' },
    { text: 'outgrew their story', strong: true },
    { text: '.' },
  ],
};

export const results = {
  lead: 'Others ship deliverables.',
  emphasis: 'We deliver results.',
  stats: [
    {
      value: '120M+',
      label: 'In total client acquisitions\nover the past 2 years',
      href: '#',
    },
    {
      value: '60 days',
      label: 'From rebrand and launch\nto successful exit',
      href: '#',
    },
    {
      value: '3.62x',
      label: 'Boost in organic search traffic,\nwithin the first two months',
      href: '#',
    },
  ],
};

export const pricing = { heading: 'How we', emphasis: 'work together' };

export const testimonials = { heading: 'Don’t take our word for it' };

export const why = {
  heading: 'Built with intent',
  contact: {
    heading: 'One point of contact',
    text: 'From the kick-off call to launch, you’ll work directly with me. Depending on the needs of the project, I may bring in vetted specialists, but I’ll remain your main point of contact, managing communication, quality, and timelines.',
    alt: 'Alex Hartan, founder of Galvanite',
  },
};

export const check = {
  heading: 'Assess your brand & website',
  description:
    'Select everything that rings true, and enter your company’s website to get started.',
};

export const faq = { heading: 'Common Questions' };

export const closing = {
  lead: 'It’s time to build a brand',
  emphasis: 'worthy of your product',
  description:
    'Book a 30-minute discovery call. We look at your site together, find where the value gets lost, and agree on the first steps.',
};
