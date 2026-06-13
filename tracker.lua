-- Grow a Garden 2 Tracker — direct Supabase sync
-- OWNER: set this to your site login name so accounts are grouped under you
local OWNER = "dfwrizler"

local SUPABASE_URL = "https://bmcwuoeaxmhxjihgxzoa.supabase.co"
local SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtY3d1b2VheG1oeGppaGd4em9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjk4MDAsImV4cCI6MjA5Njk0NTgwMH0.bjxUSLFVnCJdTzvzx4QW8rnR-5vXbMQ9eBKp_vOQli8"
local TABLE    = "garden_stats"
local ENDPOINT = SUPABASE_URL .. "/rest/v1/" .. TABLE

-- Detect exploit HTTP function (RequestAsync is blacklisted)
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
    log("FATAL: No usable HTTP function found (tried syn.request, http.request, request, http_request)")
    return
end
log("HTTP function: OK")

-- Scan data immediately — runs before any HTTP call
local function scan()
    local data = {
        username  = player.Name,
        userid    = player.UserId,
        sheckles  = 0,
        plot_name = "None",
        plants    = {},
        owner     = OWNER,
    }

    -- Sheckles
    local ls = player:FindFirstChild("leaderstats")
    if ls then
        local s = ls:FindFirstChild("Sheckles")
        data.sheckles = s and s.Value or 0
        log("Sheckles: " .. data.sheckles)
    else
        log("WARNING: leaderstats not found")
    end

    -- Plot
    local gardens = workspace:FindFirstChild("Gardens")
    if not gardens then
        log("ERROR: workspace.Gardens not found")
        return data
    end

    local allPlots = gardens:GetChildren()
    log("Scanning " .. #allPlots .. " plots for: " .. player.Name)

    for _, plot in ipairs(allPlots) do
        local owner = plot:GetAttribute("Owner")
        if owner == player.Name
            or owner == tostring(player.UserId)
            or owner == player.UserId then
            data.plot_name = plot.Name
            log("Matched: " .. plot.Name)

            local folder = plot:FindFirstChild("Plants")
            if folder then
                for _, p in ipairs(folder:GetChildren()) do
                    local seedName = tostring(p:GetAttribute("SeedName") or p.Name)
                    local mutation = tostring(p:GetAttribute("Mutation") or "None")
                    log("  Plant: " .. seedName .. " | " .. mutation)
                    table.insert(data.plants, {
                        id       = p.Name,
                        seedName = seedName,
                        mutation = mutation,
                    })
                end
            else
                log("No Plants folder in " .. plot.Name)
            end
            break
        end
    end

    if data.plot_name == "None" then
        log("WARNING: No plot matched this player")
    end

    return data
end

local function syncData(data)
    data.updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
    local body = HttpService:JSONEncode(data)
    log("Sending payload: " .. body)

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
            Body = body,
        })
    end)

    if not ok then
        log("EXCEPTION during request: " .. tostring(result))
        return
    end

    log("Status: " .. tostring(result.StatusCode))
    log("Body:   " .. tostring(result.Body))

    if result.StatusCode == 200 or result.StatusCode == 201 then
        log("SUCCESS: synced to Supabase")
    else
        log("ERROR: status " .. tostring(result.StatusCode))
    end
end

log("Tracker loaded for: " .. player.Name .. " (UserId: " .. player.UserId .. ")")

task.spawn(function()
    while true do
        log("--- Scan start ---")
        local data = scan()
        log("--- Sync start ---")
        syncData(data)
        log("--- Done, waiting 15s ---")
        task.wait(15)
    end
end)
