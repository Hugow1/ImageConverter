import express from "express";
import multer from "multer";
import sharp from "sharp";

const app = express();

// Upload in memory, max 10MB (pas aan naar wens)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Eenvoudige allowlist input formats
const ALLOWED_INPUT = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_OUTPUT = new Set(["webp", "jpeg", "png", "avif"]);

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * POST /convert?format=webp&quality=80&lossless=false&width=&height=&fit=cover
 * form-data: file=<binary>
 */
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file (field: file)" });
    if (!ALLOWED_INPUT.has(req.file.mimetype)) {
      return res.status(400).json({ error: `Unsupported input type: ${req.file.mimetype}` });
    }

    const format = (req.query.format ?? "webp").toString().toLowerCase();
    if (!ALLOWED_OUTPUT.has(format)) {
      return res.status(400).json({ error: `Unsupported output format: ${format}` });
    }

    const quality = clampInt(req.query.quality, 1, 100, 80);
    const lossless = toBool(req.query.lossless, false);

    const width = req.query.width ? clampInt(req.query.width, 1, 10000, undefined) : undefined;
    const height = req.query.height ? clampInt(req.query.height, 1, 10000, undefined) : undefined;
    const fit = (req.query.fit ?? "cover").toString(); // cover, contain, fill, inside, outside

    let img = sharp(req.file.buffer, { failOn: "error" });

    // Auto-rotate op basis van EXIF (handig bij foto's)
    img = img.rotate();

    if (width || height) {
      img = img.resize({ width, height, fit });
    }

    if (format === "webp") img = img.webp({ quality, lossless });
    if (format === "jpeg") img = img.jpeg({ quality });
    if (format === "png") img = img.png({ compressionLevel: 9 });
    if (format === "avif") img = img.avif({ quality });

    const out = await img.toBuffer();

    res.setHeader("Content-Type", `image/${format === "jpeg" ? "jpeg" : format}`);
    res.setHeader("X-Original-Bytes", String(req.file.size));
    res.setHeader("X-Output-Bytes", String(out.length));
    return res.status(200).send(out);
  } catch (e) {
    const msg = e?.message ?? "Unknown error";
    // decode errors etc.
    return res.status(422).json({ error: msg });
  }
});

function clampInt(v, min, max, defVal) {
  if (v === undefined || v === null || v === "") return defVal;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return defVal;
  return Math.min(max, Math.max(min, n));
}

function toBool(v, defVal) {
  if (v === undefined || v === null) return defVal;
  const s = v.toString().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(s)) return true;
  if (["0", "false", "no", "n", "off"].includes(s)) return false;
  return defVal;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`listening on ${PORT}`));
