import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';

// Demo content. Every story, name and place here is invented.
const STORIES = [
  {
    slug: 'riverside-bike-lanes-open', topic: 'city', author: 'Dana Whitfield',
    title: 'Riverside bike lanes open two months early',
    dek: 'The protected lanes link the east side to downtown without crossing a main road.',
    body: 'The riverside bike lanes opened to riders on Monday, two months ahead of schedule. The route runs for three miles along the east bank and connects to the downtown path at the old rail bridge.\n\nCity engineers said a dry summer let crews pour concrete without the usual delays. The lanes are separated from traffic by a raised curb, and every junction has its own bike signal.\n\nThe project cost less than planned, and the city says the savings will pay for lighting along the route. Counters at the rail bridge recorded more than two thousand trips on the first day.',
  },
  {
    slug: 'library-late-hours-trial', topic: 'city', author: 'Dana Whitfield',
    title: 'Central library to stay open until midnight in trial',
    dek: 'The six-week trial starts next month and covers Monday to Thursday.',
    body: 'The central library will stay open until midnight on weekdays during a six-week trial. The change follows a survey in which students and shift workers asked for later hours.\n\nOnly the ground floor and the study rooms will open late. Staff say the extra hours will be covered by two new part-time posts rather than overtime.\n\nThe library will count visitors each night and publish the numbers when the trial ends. If the late hours are popular, the board will vote on making them permanent in the spring.',
  },
  {
    slug: 'corner-bakery-cooperative', topic: 'business', author: 'Luis Ferrand',
    title: 'Bakery staff buy the business from retiring owner',
    dek: 'Eleven employees formed a cooperative to keep the forty-year-old shop open.',
    body: 'The staff of a forty-year-old corner bakery have bought the business from its retiring owner. Eleven employees formed a cooperative and now own equal shares.\n\nThe owner said she turned down a higher offer from a chain because she wanted the recipes and the jobs to stay. A local credit union lent the cooperative most of the purchase price.\n\nThe bakery will keep its name and its opening hours. The new owners plan to add a second oven next year so they can supply nearby cafes.',
  },
  {
    slug: 'market-hall-rents-frozen', topic: 'business', author: 'Luis Ferrand',
    title: 'Market hall freezes stall rents for a second year',
    dek: 'Traders say the freeze gives them room to plan after a slow winter.',
    body: 'The market hall will freeze stall rents for a second year, its managers announced on Thursday. The decision covers all sixty stalls, including the food court.\n\nTraders said the freeze gives them room to plan after a slow winter. Several stalls changed hands last year, and three remain empty.\n\nThe managers hope steady rents will attract new traders to the empty stalls. They also plan to extend Saturday opening by two hours during the summer.',
  },
  {
    slug: 'school-garden-soil-study', topic: 'science', author: 'Priya Nandakumar',
    title: 'School gardens help students map city soil',
    dek: 'Pupils at twelve schools collected samples for a university soil survey.',
    body: 'Pupils at twelve schools have collected soil samples for a university survey of the city. Each class dug samples from its school garden and recorded the depth, color and texture.\n\nThe university tested the samples for nutrients and compared the results across neighborhoods. Researchers found that soil near the river holds more water and needs less feeding.\n\nThe results will be published as a free map that gardeners can search by street. Teachers said the project gave students a reason to care about careful measurement.',
  },
  {
    slug: 'night-sky-count', topic: 'science', author: 'Priya Nandakumar',
    title: 'Volunteers count stars to measure light pollution',
    dek: 'More than four hundred people took part in the annual night sky count.',
    body: 'More than four hundred volunteers counted stars last weekend to measure light pollution across the region. Each person counted the stars visible inside one constellation and sent in the number.\n\nFewer visible stars means a brighter night sky. Organizers said the count found the darkest skies in the hills to the north and the brightest above the retail park.\n\nThe figures go to a national survey that has tracked night sky brightness for more than a decade. The town council has asked for the local results before it replaces street lights next year.',
  },
  {
    slug: 'bus-arrival-screens', topic: 'technology', author: 'Marcus Lindqvist',
    title: 'Bus stops get live arrival screens that work in sunlight',
    dek: 'The low-power screens run on a small solar panel and update every thirty seconds.',
    body: 'Fifty bus stops now have live arrival screens that can be read in direct sunlight. The screens use the same kind of display as an e-reader and run on a small solar panel.\n\nEach screen updates every thirty seconds with data from trackers on the buses. A button on the pole reads the arrivals aloud for riders who cannot see the screen.\n\nThe transit agency chose the low-power screens because they need no mains wiring, which cut the cost of each stop by more than half. Another hundred stops will get screens by the end of the year.',
  },
  {
    slug: 'repair-cafe-phones', topic: 'technology', author: 'Marcus Lindqvist',
    title: 'Repair cafe fixes two hundred phones in its first year',
    dek: 'Volunteers replace screens and batteries for the cost of the parts.',
    body: 'A volunteer repair cafe has fixed more than two hundred phones in its first year. Volunteers replace cracked screens and worn batteries for the cost of the parts.\n\nThe cafe meets twice a month in a community hall. Organizers say most phones that come in are less than four years old and need only a new battery.\n\nThe group also runs short classes on backing up photos and removing old accounts before selling a phone. It is looking for more volunteers who are comfortable with a small screwdriver.',
  },
  {
    slug: 'open-data-potholes', topic: 'technology', author: 'Marcus Lindqvist',
    title: 'City publishes pothole reports as open data',
    dek: 'Anyone can now see where reports were filed and how long repairs took.',
    body: 'The city has published three years of pothole reports as open data. The files show where each report was filed, when it was fixed and how long the repair took.\n\nOfficials said publishing the data cost little because the reports were already stored in one system. A student group used the files to build a map within a week of the release.\n\nThe map shows that repairs on main roads take four days on average, while side streets wait almost three weeks. The public works department says it will use the same data to plan next year\'s resurfacing.',
  },
  {
    slug: 'community-choir-record', topic: 'culture', author: 'Helen Abara',
    title: 'Community choir fills the concert hall for the first time',
    dek: 'The eighty-voice choir sold every seat for its tenth anniversary concert.',
    body: 'A community choir sold every seat in the concert hall for its tenth anniversary on Saturday. The choir has eighty singers and no auditions.\n\nThe program mixed folk songs with a new piece written by a local teacher. The choir\'s director said the group began with nine people in a church hall.\n\nMoney from the concert will pay for sheet music and for a bus so the choir can perform in nearby towns. Rehearsals for the winter season begin next week and new singers are welcome.',
  },
  {
    slug: 'mural-underpass', topic: 'culture', author: 'Helen Abara',
    title: 'Students paint a mural along the station underpass',
    dek: 'The design shows a year of local weather, one panel for each month.',
    body: 'Art students have painted a mural along the station underpass. The design shows a year of local weather, with one panel for each month.\n\nThe students spent the spring sketching and the summer painting. The rail company paid for the paint and for brighter lights in the underpass.\n\nCommuters said the walk to the platforms feels safer with the new lights. The students have been asked to design a second mural for the bus station.',
  },
  {
    slug: 'allotment-waiting-list', topic: 'city', author: 'Dana Whitfield',
    title: 'New allotment site cuts the waiting list in half',
    dek: 'Sixty plots on a former depot will be ready for planting in spring.',
    body: 'A new allotment site on a former bus depot will cut the waiting list for garden plots in half. The site has sixty plots, a shared tool shed and a water tap for every row.\n\nThe council tested the ground and brought in fresh topsoil before marking out the plots. People who have waited longest will be offered a plot first.\n\nPlot holders pay a small yearly fee that covers water and maintenance. The council says two more sites are being considered for next year.',
  },
];

/** Empties the tables and fills them with the demo stories. */
export function seed(db) {
  db.exec('DELETE FROM summaries; DELETE FROM subscribers; DELETE FROM stories;');

  const insert = db.prepare(`
    INSERT INTO stories (slug, title, dek, body, topic, author, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  STORIES.forEach((story, index) => {
    // The first story is the newest; each one after is five hours older.
    const publishedAt = new Date(now - index * 5 * 60 * 60 * 1000).toISOString();
    insert.run(story.slug, story.title, story.dek, story.body, story.topic, story.author, publishedAt);
  });
}

// `npm run seed` runs this file directly and resets the real database.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'briefing.db');
  seed(openDatabase(file));
  console.log(`Reset ${file} with demo stories.`);
}
