import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://bmcwuoeaxmhxjihgxzoa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtY3d1b2VheG1oeGppaGd4em9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjk4MDAsImV4cCI6MjA5Njk0NTgwMH0.bjxUSLFVnCJdTzvzx4QW8rnR-5vXbMQ9eBKp_vOQli8";
const TABLE       = "garden_stats";
const USERS_TABLE = "users";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Login — returns existing key for name or creates a new one
  app.post("/api/auth/login", async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, error: "Name required" });
    }

    const trimmed = name.trim();

    const { data: existing } = await supabase
      .from(USERS_TABLE)
      .select("key")
      .eq("name", trimmed)
      .single();

    if (existing) {
      return res.json({ success: true, name: trimmed, key: existing.key });
    }

    const key = randomUUID();
    const { error } = await supabase.from(USERS_TABLE).insert({ name: trimmed, key });

    if (error) {
      return res.json({ success: false, error: error.message });
    }

    res.json({ success: true, name: trimmed, key });
  });

  // Read accounts from Supabase, filtered by owner if provided
  app.get("/api/stats", async (req, res) => {
    const owner = req.query.owner as string | undefined;
    let query = supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
    if (owner) query = query.eq("owner", owner);
    const { data, error } = await query;

    if (error) {
      return res.json({ success: false, error: error.message });
    }

    const mapped = (data || []).map((row: any) => ({
      username: row.username,
      userId: row.userid,
      sheckles: row.sheckles,
      plotName: row.plot_name,
      plants: row.plants || [],
      lastUpdated: row.updated_at,
    }));

    res.json({ success: true, data: mapped });
  });

  // Receive stats from simulator buttons (upserts to Supabase)
  app.post("/api/track", async (req, res) => {
    const { username, userId, sheckles, plotName, plants } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: "Missing username" });
    }

    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          username,
          userid: Number(userId || 0),
          sheckles: Number(sheckles || 0),
          plot_name: String(plotName || "None"),
          plants: Array.isArray(plants) ? plants : [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      );

    if (error) {
      return res.json({ success: false, error: error.message });
    }

    res.json({ success: true });
  });

  // Serve static files / Vite HMR
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
