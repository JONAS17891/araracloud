/*
 * API DE AVALIAÇÕES — Vercel Serverless Function
 * Rota: /api/reviews   (GET lista · POST cria · DELETE remove, só admin)
 *
 * Guarda tudo no Upstash Redis (grátis) via REST, sem instalar nenhum pacote.
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   UPSTASH_REDIS_REST_URL  e  UPSTASH_REDIS_REST_TOKEN
 *   (ou KV_REST_API_URL e KV_REST_API_TOKEN, nomes que a integração da Vercel cria)
 *   ADMIN_KEY  → uma senha longa sua, usada para apagar avaliações
 */
const crypto = require("crypto");

const KEY = "araracloud:reviews";
const MAX_STORED = 500;      // guarda as 500 mais recentes
const MAX_RETURNED = 100;    // devolve as 100 mais recentes ao site
const COOLDOWN_SECONDS = 1800; // 1 avaliação por IP a cada 30 min

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "Erro no Redis");
  return j.result;
}

const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const clean = (v, max) =>
  String(v == null ? "" : v)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function calcStats(reviews) {
  const dist = [0, 0, 0, 0, 0]; // índice 0 = 1 estrela ... 4 = 5 estrelas
  let sum = 0;
  reviews.forEach((r) => { dist[r.rating - 1]++; sum += r.rating; });
  const count = reviews.length;
  return { count, avg: count ? Math.round((sum / count) * 10) / 10 : 0, dist };
}

async function loadAll() {
  const raw = await redis(["LRANGE", KEY, 0, MAX_STORED - 1]);
  return (raw || []).map(parse).filter((r) => r && r.id && r.rating >= 1 && r.rating <= 5);
}

const sha = (s) => crypto.createHash("sha256").update(s).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: "O armazenamento das avaliações ainda não foi configurado." });
  }

  try {
    /* ---------- LISTAR ---------- */
    if (req.method === "GET") {
      const all = await loadAll();
      return res.status(200).json({ reviews: all.slice(0, MAX_RETURNED), stats: calcStats(all) });
    }

    /* ---------- CRIAR ---------- */
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? parse(req.body) || {} : req.body || {};

      if (body.website) return res.status(400).json({ error: "Envio inválido." }); // honeypot anti-robô

      const name = clean(body.name, 40);
      const text = clean(body.text, 500);
      const rating = Number(body.rating);
      const plan = ["Easy", "Fast"].includes(body.plan) ? body.plan : "";

      if (name.length < 2) return res.status(400).json({ error: "Informe seu nome (mínimo 2 letras)." });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        return res.status(400).json({ error: "Escolha de 1 a 5 estrelas." });
      if (text.length < 10) return res.status(400).json({ error: "Conte um pouco mais (mínimo 10 caracteres)." });

      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
        (req.socket && req.socket.remoteAddress) || "desconhecido";
      const who = crypto.createHash("sha256").update(ip + (process.env.ADMIN_KEY || "arara")).digest("hex").slice(0, 32);
      const allowed = await redis(["SET", `araracloud:rl:${who}`, "1", "EX", COOLDOWN_SECONDS, "NX"]);
      if (allowed !== "OK") {
        return res.status(429).json({ error: "Você já enviou uma avaliação há pouco. Tente de novo em alguns minutos." });
      }

      const review = { id: crypto.randomUUID(), name, rating, text, plan, date: new Date().toISOString() };
      await redis(["LPUSH", KEY, JSON.stringify(review)]);
      await redis(["LTRIM", KEY, 0, MAX_STORED - 1]);

      const all = await loadAll();
      return res.status(201).json({ review, stats: calcStats(all) });
    }

    /* ---------- APAGAR (só admin) ---------- */
    if (req.method === "DELETE") {
      const adminKey = process.env.ADMIN_KEY;
      const given = String(req.headers["x-admin-key"] || "");
      if (!adminKey || !safeEqual(given, adminKey)) return res.status(401).json({ error: "Não autorizado." });

      const body = typeof req.body === "string" ? parse(req.body) || {} : req.body || {};
      const id = clean(body.id || (req.query && req.query.id), 80);
      if (!id) return res.status(400).json({ error: "Informe o id." });

      const raw = await redis(["LRANGE", KEY, 0, MAX_STORED - 1]);
      const item = (raw || []).find((s) => (parse(s) || {}).id === id);
      if (!item) return res.status(404).json({ error: "Avaliação não encontrada." });
      await redis(["LREM", KEY, 1, item]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    console.error("reviews api:", err);
    return res.status(500).json({ error: "Erro no servidor. Tente novamente em instantes." });
  }
};
