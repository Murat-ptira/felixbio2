// Everything a visitor reads lives here — edit copy and links in one place.

export const links = {
  // Replace with your own Lava.top product / donation page and Boosty profile.
  lavaPay: "https://lava.top/",
  boosty: "https://boosty.to/",
};

export const bio = {
  eyebrow: "Bio",
  title: "Hello, I'm Felix, 19",
  paragraphs: [
    "I make things for the web — interfaces, small tools and visual experiments like this page, where the scene above the water is just the tip of what's underneath.",
    "I care about the details: motion that feels physical, layouts that stay calm, and code that's easy to live with. Open for commissions and collaborations.",
  ],
  facts: ["19 y.o.", "Web & motion", "Open for commissions"],
};

export type Project = {
  title: string;
  blurb: string;
  tags: string[];
  href?: string;
};

export const projects: Project[] = [
  {
    title: "Iceberg Portfolio",
    blurb:
      "This site: a single illustrated scene with a polar bear that watches your cursor, an owl that dives and turns into a fish, and a school swimming under frosted glass.",
    tags: ["React", "Canvas", "Motion"],
  },
  {
    title: "Your project here",
    blurb:
      "Have an idea that needs a site, a landing page or an interactive piece? Order it through Boosty and it can be the next card on this list.",
    tags: ["Commission"],
    href: links.boosty,
  },
];

export const payment = {
  eyebrow: "Payment",
  title: "Support or order work",
  lava: {
    name: "Lava Pay",
    host: "Lava.top",
    text: "Pay by card in a couple of clicks — for finished work, tips or one-off support.",
    cta: "Pay via Lava Pay",
  },
  boosty: {
    name: "Boosty",
    host: "boosty.to",
    text: "Order a custom project or subscribe to follow new work as it's being built.",
    cta: "Order via Boosty",
  },
};
