export const profile = {
  name: 'Bathsheba Omidiora',
  role: 'Full stack software engineer',
  location: 'Chicago, IL',
  email: 'sheesprint@gmail.com',
  github: 'https://github.com/bathsheba1st',
  linkedin: 'https://www.linkedin.com/in/bathsheba-omidiora-622a05178',
  repo: 'https://github.com/bathsheba1st/swe-portfolio',

  headline:
    'I build web features end to end: the interface, the API, the data model, and the tests.',
  intro:
    'Software engineer with four years of experience. I like work that crosses the whole stack, ' +
    'and I care about the parts that keep software dependable after launch: clear data models, ' +
    'tests, accessibility, security, and knowing how a system behaves in production.',

  about: [
    'I am a software engineer with four years of professional experience. The work I enjoy most is taking a feature from an idea to something people can rely on, which means thinking about the database and the failure cases as much as the screen.',
    'The three projects here are small on purpose. Each one is a complete slice of a product, front to back, that can be read in one sitting: a React interface, a Node.js API, a SQL schema, and a test suite that explains what the code is meant to do.',
  ],

  experience: [
    {
      company: 'JPMorgan Chase',
      title: 'Software Engineer',
      period: 'Oct 2022 to present',
      summary:
        'I work on building and maintaining scalable systems at JPMorgan Chase. I focus on ensuring reliability, performance, and security across the stack.',
    },
  ],
};

export const skills = [
  {
    group: 'Front end',
    items: ['React', 'JavaScript', 'HTML', 'CSS', 'Vite'],
  },
  {
    group: 'Back end',
    items: [
      'Node.js',
      'Express',
      'REST APIs',
      'Authentication and sessions',
      'Web security',
    ],
  },
  {
    group: 'Data',
    items: [
      'SQL',
      'Relational schema design',
      'SQLite',
      'Indexes and transactions',
    ],
  },
  {
    group: 'Practice',
    items: [
      'Automated testing',
      'AI model APIs',
      'Monitoring and performance',
      'CI with GitHub Actions',
      'Git',
    ],
  },
];

export const projects = [
  {
    slug: 'newsdesk',
    // The address of the running app. Leave empty ('') to hide the button.
    demo: 'https://swe-portfolio-fpem.onrender.com/',
    name: 'Newsdesk',
    tagline: 'A newsroom CMS with sign-in, roles and a review workflow',
    summary:
      'Reporters write stories and send them for review; editors publish them. Every rule about ' +
      'who may do what lives in one small file of plain functions that the API enforces and the ' +
      'interface reads, so the two can never disagree.',
    shots: [
      {
        file: 'newsdesk-story.webp',
        alt: 'Newsdesk story page: an edit form on the left, with Publish and other actions and the story history on the right.',
      },
      {
        file: 'newsdesk-list.webp',
        alt: 'Newsdesk story list with status filters and a table of stories showing status, topic, author and last update.',
      },
    ],
    highlights: [
      {
        label: 'Authentication',
        text: 'Passwords hashed with scrypt. Sessions stored in the database as token hashes, so signing out ends a session at once.',
      },
      {
        label: 'Web security',
        text: 'HttpOnly, SameSite=Strict cookies, JSON-only writes against CSRF, login rate limiting, and parameterized SQL throughout.',
      },
      {
        label: 'Schema design',
        text: 'Four tables with foreign keys, CHECK constraints, indexes on the filtered columns, and a transaction around each status change.',
      },
      {
        label: 'Testing',
        text: '31 tests: the permission rules as unit tests, and the API tested over real HTTP against an in-memory database.',
      },
      {
        label: 'Accessibility',
        text: 'Labelled fields, errors tied to their inputs and announced, keyboard focus managed on page change.',
      },
    ],
    stack: ['React', 'Node.js', 'Express', 'SQLite', 'node:test'],
  },
  {
    slug: 'briefing',
    // The address of the running app. Leave empty ('') to hide the button.
    demo: 'https://swe-portfolio-1.onrender.com/',
    name: 'The Brief',
    tagline: 'A reader-facing news site with AI summaries that always work',
    summary:
      'Readers browse, filter and search stories, and can ask for three key points on any of them. ' +
      'The points come from an AI model when one is configured. If there is no key, the call fails, ' +
      'or the reply is the wrong shape, a built-in summarizer takes over and the reader is told which one they got.',
    shots: [
      {
        file: 'briefing-story.webp',
        alt: 'A story page on The Brief with a highlighted box of three key points above the article text.',
      },
      {
        file: 'briefing-home.webp',
        alt: 'The Brief home page: a search box, topic filters with counts, and a list of stories.',
      },
    ],
    highlights: [
      {
        label: 'AI feature',
        text: 'A model API call with a timeout, a strict check on the output, a saved result so each story is summarized once, and a rate limit on cost.',
      },
      {
        label: 'Evaluating AI output',
        text: 'Tests swap the network for a fake model and cover an error status, a wrong-shaped reply and a network failure.',
      },
      {
        label: 'API design',
        text: 'Search, topic filters and pagination done in SQL, with wildcard escaping and page numbers corrected on the server.',
      },
      {
        label: 'State in the address',
        text: 'Filters live in the URL, so a search can be shared and the back button works. Slow, stale responses are dropped.',
      },
      {
        label: 'Testing',
        text: '33 tests across the summarizer, the model wrapper and the HTTP API.',
      },
    ],
    stack: [
      'React',
      'Node.js',
      'Express',
      'SQLite',
      'Anthropic API',
      'node:test',
    ],
  },
  {
    slug: 'pulse',
    // The address of the running app. Leave empty ('') to hide the button.
    demo: 'https://swe-portfolio-2.onrender.com/',
    name: 'Pulse',
    tagline:
      'A monitoring dashboard for API traffic, errors and response times',
    summary:
      'A piece of Express middleware times every request and saves it. The dashboard turns those rows ' +
      'into totals, three charts and a per-endpoint table with the 95th percentile, and refreshes ' +
      'itself every five seconds. The charts are hand-written SVG in one small component.',
    shots: [
      {
        file: 'pulse-dashboard.webp',
        height: 900,
        alt: 'Pulse dashboard: four summary numbers, charts of requests, error rate and response time with a visible spike, and a table of endpoints.',
      },
    ],
    highlights: [
      {
        label: 'Observability',
        text: 'Request timing middleware, error rates, and the 95th percentile beside the average, because the average hides slow requests.',
      },
      {
        label: 'SQL',
        text: 'Grouping into time buckets, counting and averaging in SQL, with an index on the time column and old rows deleted on a schedule.',
      },
      {
        label: 'Performance thinking',
        text: 'Routes stored as patterns, not raw addresses, so the data stays small. The README names what would change at larger scale.',
      },
      {
        label: 'Data visualization',
        text: 'Bar and line charts in plain SVG with hover details, a data table for the same numbers, and status shown in words as well as color.',
      },
      {
        label: 'Testing',
        text: '20 tests, including a fixed clock so time-based results are the same every day.',
      },
    ],
    stack: ['React', 'Node.js', 'Express', 'SQLite', 'SVG', 'node:test'],
  },
];
