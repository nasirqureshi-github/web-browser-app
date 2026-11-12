import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { Person } from "./models/Person";
import { Site } from "./models/Site";
import { Visit } from "./models/Visit";
import { cleanHtml, toPlainText } from "./utils/html";

const people = [
  { personId: "nasir", name: "Nasir Hussain" },
  { personId: "ayesha", name: "Ayesha Khan" },
  { personId: "omar", name: "Omar Farooq" },
  { personId: "sara", name: "Sara Ahmed" },
  { personId: "hamza", name: "Hamza Ali" },
];

const sites = [
  [
    "ocean.zz",
    "Ocean Conservation",
    "nasir",
    "<h1>Ocean Conservation</h1><p>Healthy oceans support life across our planet. Coral reefs, sea grass and open water ecosystems protect biodiversity and help regulate the climate.</p><h2>Why oceans matter</h2><p>Marine habitats provide food, livelihoods and oxygen. Communities can reduce plastic waste, protect coastlines and support responsible fishing.</p><p>Explore <a href='tidepool.zz'>Tidepool Journal</a>, read about <a href='climate.zz'>Climate Notes</a>, or visit the missing <a href='deepsea.zz'>Deep Sea Archive</a>.</p>",
  ],
  [
    "tidepool.zz",
    "Tidepool Journal",
    "ayesha",
    "<h1>Tidepool Journal</h1><p>A tidepool is a small world shaped by the rhythm of the sea. At low tide, crabs, anemones and tiny fish remain in pools among the rocks.</p><p>Observe gently and leave every creature where you found it. Read <a href='ocean.zz'>Ocean Conservation</a> and discover <a href='coast.zz'>Coastal Living</a>.</p>",
  ],
  [
    "forest.zz",
    "Forest Life",
    "omar",
    "<h1>Forest Life</h1><p>Forests store carbon, shelter wildlife and keep watersheds healthy. Old trees create habitats that can take centuries to replace.</p><h2>Care for local forests</h2><p>Choose native plants, reduce waste and support restoration led by local communities. Continue to <a href='mountain.zz'>Mountain Paths</a> or <a href='climate.zz'>Climate Notes</a>.</p>",
  ],
  [
    "mountain.zz",
    "Mountain Paths",
    "sara",
    "<h1>Mountain Paths</h1><p>Mountain landscapes shape rivers and weather far beyond their peaks. Responsible travel protects fragile trails and the people who call these places home.</p><p>Pack out everything you bring in, stay on marked routes and respect wildlife. See <a href='forest.zz'>Forest Life</a> and <a href='river.zz'>River Stories</a>.</p>",
  ],
  [
    "climate.zz",
    "Climate Notes",
    "nasir",
    "<h1>Climate Notes</h1><p>Climate change affects rainfall, heat, oceans and ecosystems. Understanding local evidence helps communities plan practical responses.</p><p>Energy efficiency, public transport and resilient green spaces all contribute to healthier towns. Start with <a href='ocean.zz'>Ocean Conservation</a> or <a href='future.zz'>Future City</a>.</p>",
  ],
  [
    "coast.zz",
    "Coastal Living",
    "ayesha",
    "<h1>Coastal Living</h1><p>Coastal communities depend on clean beaches, healthy wetlands and safe harbours. Mangroves reduce erosion and provide nurseries for fish.</p><p>Learn from <a href='tidepool.zz'>Tidepool Journal</a> and <a href='ocean.zz'>Ocean Conservation</a>.</p>",
  ],
  [
    "river.zz",
    "River Stories",
    "omar",
    "<h1>River Stories</h1><p>Rivers connect mountains, forests, farms and cities. Clean freshwater is essential for people and wildlife.</p><p>Protect riverbanks, avoid dumping waste and use water thoughtfully. Follow the route to <a href='mountain.zz'>Mountain Paths</a> or <a href='future.zz'>Future City</a>.</p>",
  ],
  [
    "future.zz",
    "Future City",
    "sara",
    "<h1>Future City</h1><p>A liveable city makes room for people, trees, safe streets and reliable public transport. Small design choices can make daily life healthier.</p><p>Explore <a href='climate.zz'>Climate Notes</a>, <a href='river.zz'>River Stories</a> and the unavailable <a href='skyline.zz'>Skyline Project</a>.</p>",
  ],
  [
    "garden.zz",
    "The Community Garden",
    "hamza",
    "<h1>The Community Garden</h1><p>Community gardens turn unused spaces into places to grow food, share knowledge and meet neighbours. Composting returns nutrients to the soil.</p><p>Find ideas in <a href='forest.zz'>Forest Life</a> and <a href='future.zz'>Future City</a>.</p>",
  ],
  [
    "fieldnotes.zz",
    "Field Notes",
    "hamza",
    "<h1>Field Notes</h1><p>Good observation begins with curiosity. Keep notes about seasonal changes, local birds, plants and the weather.</p><p>Compare your observations with <a href='garden.zz'>The Community Garden</a>, <a href='tidepool.zz'>Tidepool Journal</a> and <a href='nowhere.zz'>an address that does not exist</a>.</p>",
  ],
] as const;

async function seed() {
  await connectDB();
  for (const person of people)
    await Person.updateOne(
      { personId: person.personId },
      { $set: person },
      { upsert: true },
    );
  for (const [address, title, authorId, html] of sites) {
    const author = people.find((p) => p.personId === authorId)!;
    const safe = cleanHtml(html);
    await Site.updateOne(
      { address },
      {
        $set: {
          address,
          title,
          authorId,
          authorName: author.name,
          html: safe,
          plainText: toPlainText(safe),
        },
      },
      { upsert: true },
    );
  }

  // Deterministic 60-minute trail. Re-running replaces only the seeded trail.
  await Visit.deleteMany({ source: "seed" });
  const trails: Record<string, string[]> = {
    nasir: [
      "ocean.zz",
      "tidepool.zz",
      "coast.zz",
      "ocean.zz",
      "climate.zz",
      "future.zz",
      "river.zz",
      "mountain.zz",
      "forest.zz",
      "ocean.zz",
      "deepsea.zz",
    ],
    ayesha: [
      "tidepool.zz",
      "ocean.zz",
      "coast.zz",
      "garden.zz",
      "fieldnotes.zz",
      "forest.zz",
      "tidepool.zz",
    ],
    omar: [
      "forest.zz",
      "mountain.zz",
      "river.zz",
      "future.zz",
      "climate.zz",
      "forest.zz",
    ],
    sara: ["mountain.zz", "forest.zz", "climate.zz", "ocean.zz", "future.zz"],
    hamza: ["garden.zz", "fieldnotes.zz", "forest.zz", "tidepool.zz"],
  };
  const base = new Date("2026-11-12T10:00:00.000Z").getTime();
  for (const [personId, addresses] of Object.entries(trails)) {
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const site = await Site.findOne({ address }).select("title").lean();
      await Visit.create({
        personId,
        address,
        title: site?.title || "Nowhere",
        visitedAt: new Date(base + i * 5 * 60 * 1000),
        source: "seed",
      });
    }
  }
  console.log(
    `Seed complete: ${people.length} people, ${sites.length} sites, deterministic visit trails.`,
  );
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
