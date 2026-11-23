// ─────────────────────────────────────────────────────────────────────────────
// THE ONLY PLACE WHERE THE NAME OF THE PRODUCT IS WRITTEN.
// Change `name` here: every page, title, logo and image follows.
// (In the content files, the name is written {name}.)
// ─────────────────────────────────────────────────────────────────────────────
export default {
  // Commercial name of the product.
  name: "Probant",

  // Public address of the site, without a slash at the end. The site is on GitHub Pages, with no domain name.
  // GitHub Pages sets SITE_URL and BASE_PATH by itself (see .github/workflows/deploy.yml).
  url: process.env.SITE_URL || "https://probant-reporting.github.io",
  base: process.env.BASE_PATH || "/",

  // Public addresses of the tool: its repository, its releases and its Docker image.
  repo: "https://github.com/Probant-Reporting/probant",
  dockerImage: "ghcr.io/probant-reporting/probant",
  // Licence of the software (shown in the legal notice and on the "Get" page).
  licence: "AGPL-3.0-or-later",

  // LinkedIn profile that receives the messages. No email address, no postal address, no form.
  linkedin: "https://www.linkedin.com/in/florentliaigre/",

  // Optional email address shown under the contact link. Leave "" to show LinkedIn only.
  contactEmail: "",

  // Language shown at the root of the site (folder name in src/content/).
  defaultLang: "en",

  // Locale of each language of the site, for og:locale (language_COUNTRY). A language without a line uses its code.
  locales: { en: "en_GB", fr: "fr_FR" },

  // Topic shown on the home page (file name in src/content/<language>/, without ".json").
  homeTheme: "esg",

  // Legal notice. A line left "" is not shown.
  publisher: {
    company: "Florent Liaigre",
    address: "",
    registration: "",
    director: "Florent Liaigre",
    host: "GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States)",
  },

  // Languages of the tool itself (fact of the product, used in structured data).
  productLanguages: ["en", "fr", "es", "de", "it", "nl", "pt"],
};
