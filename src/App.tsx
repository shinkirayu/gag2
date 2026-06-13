import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Coins, Leaf, RefreshCw, Search, Sparkles, Users, WifiOff, LogOut, FileCode, Copy, Check, X } from "lucide-react";
import { AccountStats } from "./types";

const SUPABASE_URL = "https://bmcwuoeaxmhxjihgxzoa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtY3d1b2VheG1oeGppaGd4em9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjk4MDAsImV4cCI6MjA5Njk0NTgwMH0.bjxUSLFVnCJdTzvzx4QW8rnR-5vXbMQ9eBKp_vOQli8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildScript(ownerKey: string) {
  return `-- Grow a Garden 2 Tracker
local OWNER        = "${ownerKey}"
local SUPABASE_URL = "${SUPABASE_URL}"
local SUPABASE_KEY = "${SUPABASE_KEY}"
local TABLE        = "garden_stats"
local ENDPOINT     = SUPABASE_URL .. "/rest/v1/" .. TABLE

local httpRequest = (syn and syn.request)
    or (http and http.request)
    or (request ~= nil and request)
    or (http_request ~= nil and http_request)

local HttpService = game:GetService("HttpService")
local Players     = game:GetService("Players")
local player      = Players.LocalPlayer

local function log(msg)
    print("[GaG2 Tracker] " .. tostring(msg))
end

if not httpRequest then
    log("FATAL: No usable HTTP function found")
    return
end

local function ownerMatch(attr)
    return attr == player.Name
        or attr == tostring(player.UserId)
        or attr == player.UserId
end

local function scan()
    local data = {
        username  = player.Name,
        userid    = player.UserId,
        sheckles  = 0,
        plot_name = "None",
        plants    = {},
        pets      = {},
        owner     = OWNER,
    }
    local ls = player:FindFirstChild("leaderstats")
    if ls then
        local s = ls:FindFirstChild("Sheckles")
        data.sheckles = s and s.Value or 0
    end
    local gardens = workspace:FindFirstChild("Gardens")
    if gardens then
        for _, plot in ipairs(gardens:GetChildren()) do
            if ownerMatch(plot:GetAttribute("Owner")) then
                data.plot_name = plot.Name
                local folder = plot:FindFirstChild("Plants")
                if folder then
                    for _, p in ipairs(folder:GetChildren()) do
                        table.insert(data.plants, {
                            id       = p.Name,
                            seedName = tostring(p:GetAttribute("SeedName") or p.Name),
                            mutation = tostring(p:GetAttribute("Mutation") or "None"),
                        })
                    end
                end
                break
            end
        end
    end
    local petClient = workspace:FindFirstChild("_PetVisualClient")
    local petModels = petClient and petClient:FindFirstChild("Models")
    if petModels then
        for _, pet in ipairs(petModels:GetChildren()) do
            if ownerMatch(pet:GetAttribute("Owner")) then
                table.insert(data.pets, {
                    id     = pet.Name,
                    name   = tostring(pet:GetAttribute("PetName") or pet.Name),
                    rarity = tostring(pet:GetAttribute("Rarity") or "Common"),
                })
            end
        end
    end
    return data
end

local function syncData(data)
    data.updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
    local ok, result = pcall(function()
        return httpRequest({
            Url    = ENDPOINT,
            Method = "POST",
            Headers = {
                ["apikey"]        = SUPABASE_KEY,
                ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                ["Content-Type"]  = "application/json",
                ["Prefer"]        = "resolution=merge-duplicates",
            },
            Body = HttpService:JSONEncode(data),
        })
    end)
    if not ok then
        log("EXCEPTION: " .. tostring(result))
    elseif result.StatusCode == 200 or result.StatusCode == 201 then
        log("Synced: " .. player.Name)
    else
        log("Error " .. tostring(result.StatusCode) .. ": " .. tostring(result.Body))
    end
end

task.spawn(function()
    while true do
        syncData(scan())
        task.wait(15)
    end
end)
`;
}

function ScriptModal({ ownerKey, onClose }: { ownerKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const script = buildScript(ownerKey);

  const copy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">tracker.lua</span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">Execute in your Roblox exploit on each account</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                copied
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-white text-black hover:bg-zinc-100"
              }`}
            >
              {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Script</>}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-900 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-zinc-900/50 border-b border-zinc-900 flex items-center gap-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium shrink-0">Your Key</div>
          <code className="text-xs text-emerald-400 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800 truncate">
            {ownerKey}
          </code>
          <span className="text-[10px] text-zinc-700 shrink-0">pre-filled as OWNER</span>
        </div>

        <div className="overflow-y-auto flex-1">
          <pre className="text-[11px] text-zinc-400 font-mono leading-relaxed p-5 whitespace-pre-wrap break-all">
            {script}
          </pre>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (name: string, key: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const name = value.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from("users")
        .select("key")
        .eq("name", name)
        .single();

      if (existing) {
        onLogin(name, existing.key);
        return;
      }

      // Create new user with a random key
      const key = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("users")
        .insert({ name, key });

      if (insertError) throw new Error(insertError.message);

      onLogin(name, key);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-semibold text-sm tracking-tight">GaG2 Tracker</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-5">
          <div>
            <h1 className="text-white font-semibold text-sm">Sign in</h1>
            <p className="text-zinc-600 text-xs mt-1">Enter a name to get your personal tracking key</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Display Name</label>
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="e.g. dfwrizler"
              autoFocus
              className="w-full bg-black border border-zinc-900 focus:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </div>

          <button
            onClick={submit}
            disabled={!value.trim() || loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-900 disabled:text-zinc-700 text-black font-semibold text-sm rounded-lg py-2.5 transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Signing in…" : "Continue"}
          </button>
        </div>

        <p className="text-center text-[10px] text-zinc-800 mt-6 font-mono uppercase tracking-widest">
          TrackStat Studio
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<{ name: string; key: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("gag2_session") || "null"); } catch { return null; }
  });
  const [stats, setStats] = useState<AccountStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState(Date.now());
  const [showScript, setShowScript] = useState(false);

  const handleLogin = (name: string, key: string) => {
    const s = { name, key };
    localStorage.setItem("gag2_session", JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = () => {
    localStorage.removeItem("gag2_session");
    setSession(null);
    setStats([]);
  };

  const fetchStats = async (showLoading = false) => {
    if (!session) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("garden_stats")
        .select("*")
        .eq("owner", session.key)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setStats(data.map((row: any) => ({
          username: row.username,
          userId: row.userid,
          sheckles: row.sheckles,
          plotName: row.plot_name,
          plants: row.plants || [],
          pets: row.pets || [],
          lastUpdated: row.updated_at,
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchStats(true);

    // Realtime: push updates when rows change instead of constant polling
    const channel = supabase
      .channel(`garden:${session.key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "garden_stats", filter: `owner=eq.${session.key}` },
        () => fetchStats(false)
      )
      .subscribe();

    // Fallback poll every 30s (Realtime covers most updates)
    const intervalStats = setInterval(() => fetchStats(false), 30000);
    const intervalNow   = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalStats);
      clearInterval(intervalNow);
    };
  }, [session?.key]);

  const getRelativeTime = (isoString: string) => {
    const diffMs = now - new Date(isoString).getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const isOnline = (isoString: string) =>
    now - new Date(isoString).getTime() < 5 * 60 * 1000;

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const filteredStats = stats.filter(acc =>
    acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.plants.some(p =>
      p.seedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mutation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const onlineCount   = stats.filter(s => isOnline(s.lastUpdated)).length;
  const offlineCount  = stats.length - onlineCount;
  const totalSheckles = stats.reduce((sum, s) => sum + s.sheckles, 0);
  const mutationCount = stats.reduce((sum, s) => sum + s.plants.filter(p => p.mutation && p.mutation !== "None").length, 0);

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col">

      {showScript && <ScriptModal ownerKey={session.key} onClose={() => setShowScript(false)} />}

      <header className="border-b border-zinc-900 bg-black/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white tracking-tight">GaG2 Tracker</span>
            <span className="hidden sm:block text-[10px] text-zinc-700 font-mono">/ live</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-900">
              <div className={`w-1.5 h-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-400" : "bg-zinc-700"}`} />
              <span className="text-xs text-zinc-300 font-medium">{session.name}</span>
              <span className="text-[10px] text-zinc-600 font-mono">{stats.length} accs</span>
            </div>

            <button
              onClick={() => setShowScript(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs transition-all duration-150"
            >
              <FileCode className="w-3 h-3" />
              Get Script
            </button>

            <button
              onClick={() => fetchStats(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs transition-all duration-150"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 transition-all duration-150"
              title="Switch account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-7 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Online",    value: onlineCount,                    icon: <Users className="w-3.5 h-3.5 text-emerald-500" />,  valueClass: "text-emerald-400" },
            { label: "Offline",   value: offlineCount,                   icon: <WifiOff className="w-3.5 h-3.5 text-zinc-600" />,   valueClass: "text-zinc-500"    },
            { label: "Sheckles",  value: totalSheckles.toLocaleString(), icon: <Coins className="w-3.5 h-3.5 text-amber-500" />,    valueClass: "text-amber-400"   },
            { label: "Mutations", value: mutationCount,                  icon: <Sparkles className="w-3.5 h-3.5 text-violet-500" />, valueClass: "text-violet-400"  },
          ].map(card => (
            <div key={card.label} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{card.label}</span>
                {card.icon}
              </div>
              <span className={`text-2xl font-bold tracking-tight ${card.valueClass}`}>{card.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Accounts</span>
              <span className="text-[10px] text-zinc-700 font-mono">{filteredStats.length} shown</span>
            </div>
            <div className="relative">
              <Search className="w-3 h-3 text-zinc-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search username, seed, mutation…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 bg-black text-xs border border-zinc-900 rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-300 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-zinc-700 font-semibold uppercase tracking-widest border-b border-zinc-900">
                  <th className="py-2.5 px-5">Account</th>
                  <th className="py-2.5 px-4">Plot</th>
                  <th className="py-2.5 px-4">Sheckles</th>
                  <th className="py-2.5 px-4">Plants</th>
                  <th className="py-2.5 px-4">Pets</th>
                  <th className="py-2.5 px-5 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-zinc-800 animate-spin" />
                        <span className="text-xs text-zinc-700">Loading…</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Leaf className="w-5 h-5 text-zinc-800" />
                        <span className="text-xs text-zinc-700">No accounts yet</span>
                        <button
                          onClick={() => setShowScript(true)}
                          className="text-[11px] text-emerald-500 hover:text-emerald-400 underline underline-offset-2 mt-1"
                        >
                          Get your script to start tracking
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((account, i) => {
                    const online = isOnline(account.lastUpdated);
                    return (
                      <tr
                        key={account.username}
                        className={`hover:bg-zinc-900/40 transition-colors duration-100 ${
                          i < filteredStats.length - 1 ? "border-b border-zinc-900" : ""
                        }`}
                      >
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0 w-2 h-2">
                              {online && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />}
                              <span className={`relative block w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-zinc-700"}`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{account.username}</div>
                              <div className="text-[10px] text-zinc-600 font-mono">{account.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 text-[11px] font-mono">
                            {account.plotName || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-amber-400">
                            <Coins className="w-3 h-3 text-amber-500/60" />
                            {account.sheckles.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {account.plants.length === 0 ? (
                            <span className="text-xs text-zinc-700">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {Object.values(
                                account.plants.reduce((acc, p) => {
                                  const k = `${p.seedName}|${p.mutation}`;
                                  if (acc[k]) acc[k].count++;
                                  else acc[k] = { seedName: p.seedName, mutation: p.mutation, count: 1 };
                                  return acc;
                                }, {} as Record<string, { seedName: string; mutation: string; count: number }>)
                              ).map((g, idx) => {
                                const mutated = g.mutation && g.mutation !== "None";
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                                      mutated
                                        ? "bg-violet-950/40 border-violet-900 text-violet-300"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    <span className="truncate max-w-[80px]" title={g.seedName}>{g.seedName}</span>
                                    {mutated && (
                                      <span className="shrink-0 text-violet-500/60">
                                        {" · "}<span className="text-violet-400" title={g.mutation}>{g.mutation}</span>
                                      </span>
                                    )}
                                    {g.count > 1 && (
                                      <span className={`shrink-0 font-semibold ${mutated ? "text-violet-500" : "text-zinc-600"}`}>
                                        x{g.count}
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        {/* Pets */}
                        <td className="py-3.5 px-4">
                          {!account.pets || account.pets.length === 0 ? (
                            <span className="text-xs text-zinc-700">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {Object.values(
                                account.pets.reduce((acc, p) => {
                                  const k = `${p.name}|${p.rarity}`;
                                  if (acc[k]) acc[k].count++;
                                  else acc[k] = { name: p.name, rarity: p.rarity, count: 1 };
                                  return acc;
                                }, {} as Record<string, { name: string; rarity: string; count: number }>)
                              ).map((g, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border bg-amber-950/30 border-amber-900/50 text-amber-300"
                                >
                                  <span className="truncate max-w-[80px]" title={g.name}>{g.name}</span>
                                  {g.rarity !== "Common" && (
                                    <span className="text-amber-500/60"> · <span className="text-amber-400">{g.rarity}</span></span>
                                  )}
                                  {g.count > 1 && (
                                    <span className="text-amber-500 font-semibold">x{g.count}</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="text-xs text-zinc-500 font-mono">{getRelativeTime(account.lastUpdated)}</div>
                          <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${online ? "text-emerald-500" : "text-red-600"}`}>
                            {online ? "active" : "offline"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-4 text-center">
        <span className="text-[10px] text-zinc-800 font-mono tracking-widest uppercase">
          TrackStat Studio · Live Roblox telemetry
        </span>
      </footer>
    </div>
  );
}
