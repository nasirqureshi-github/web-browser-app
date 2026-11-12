import { Router } from "express";
import { Person } from "../models/Person";
import { Site } from "../models/Site";
import { Visit } from "../models/Visit";
import { cleanHtml, normalizeAddress, toPlainText } from "../utils/html";

const router = Router();

router.get("/health", (_req, res) =>
  res.json({ success: true, message: "Small Web API online" }),
);

router.get("/people", async (_req, res, next) => {
  try {
    const people = await Person.find()
      .sort({ name: 1 })
      .select("personId name -_id");
    res.json({ success: true, data: people });
  } catch (e) {
    next(e);
  }
});

router.get("/sites/:address", async (req, res, next) => {
  try {
    const address = normalizeAddress(req.params.address);
    const site = await Site.findOne({ address }).lean();
    if (!site)
      return res
        .status(404)
        .json({
          success: false,
          message: "No site exists at this address.",
          address,
        });
    res.json({ success: true, data: site });
  } catch (e) {
    next(e);
  }
});

router.post("/sites", async (req, res, next) => {
  try {
    const { address: rawAddress, title, html, authorId } = req.body || {};
    const address = normalizeAddress(String(rawAddress || ""));
    if (!/^[a-z0-9][a-z0-9-]*\.zz$/.test(address)) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Address must look like mysite.zz (letters, numbers and hyphens).",
        });
    }
    if (!title || String(title).trim().length < 2)
      return res
        .status(400)
        .json({
          success: false,
          message: "A title of at least 2 characters is required.",
        });
    if (!html || typeof html !== "string" || html.length > 30000)
      return res
        .status(400)
        .json({
          success: false,
          message: "HTML is required and must be under 30,000 characters.",
        });
    const author = await Person.findOne({ personId: authorId });
    if (!author)
      return res
        .status(400)
        .json({ success: false, message: "Please select a valid author." });
    if (await Site.exists({ address }))
      return res
        .status(409)
        .json({ success: false, message: "That address is already taken." });
    const safeHtml = cleanHtml(html);
    const site = await Site.create({
      address,
      title: String(title).trim(),
      html: safeHtml,
      authorId,
      authorName: author.name,
      plainText: toPlainText(safeHtml),
    });
    res.status(201).json({ success: true, data: site });
  } catch (e) {
    next(e);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ success: true, data: [] });
    if (q.length > 120)
      return res
        .status(400)
        .json({ success: false, message: "Search query is too long." });
    const terms = q
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(terms.join("|"), "i");
    const sites = await Site.find({ plainText: regex })
      .select("address title authorName plainText")
      .limit(50)
      .lean();
    const results = sites.map((site) => {
      const lower = site.plainText.toLowerCase();
      const index = lower.indexOf(q.toLowerCase());
      const start = Math.max(0, index >= 0 ? index - 65 : 0);
      return {
        address: site.address,
        title: site.title,
        authorName: site.authorName,
        snippet: site.plainText.slice(start, start + 180),
      };
    });
    res.json({ success: true, data: results });
  } catch (e) {
    next(e);
  }
});

router.post("/visits", async (req, res, next) => {
  try {
    const { personId, address: rawAddress, source = "typed" } = req.body || {};
    const address = normalizeAddress(String(rawAddress || ""));
    const person = await Person.findOne({ personId });
    if (!person)
      return res
        .status(400)
        .json({ success: false, message: "Select a valid person." });
    const site = await Site.findOne({ address }).select("title").lean();
    const allowedSources = [
      "typed",
      "link",
      "history",
      "back",
      "forward",
      "seed",
    ];
    const visit = await Visit.create({
      personId,
      address,
      title: site?.title || "Nowhere",
      visitedAt: new Date(),
      source: allowedSources.includes(source) ? source : "typed",
    });
    res.status(201).json({ success: true, data: visit, found: Boolean(site) });
  } catch (e) {
    next(e);
  }
});

router.get("/visits/:personId", async (req, res, next) => {
  try {
    const visits = await Visit.find({ personId: req.params.personId })
      .sort({ visitedAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, data: visits });
  } catch (e) {
    next(e);
  }
});

export default router;
