export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // --- NEW: JURY DATA HANDLERS ---
        if (request.method === "GET") {
            // Get jury manifest
            if (url.pathname === "/juries") {
                const manifest = await env.JURY_DATA.get("manifest");
                return new Response(manifest || "[]", {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Get specific jury CSV
            if (url.pathname.startsWith("/jury/")) {
                const juryName = decodeURIComponent(url.pathname.replace("/jury/", ""));
                const csv = await env.JURY_DATA.get(`jury:${juryName}`);
                if (!csv) return new Response(`Not found: jury:${juryName}`, { status: 404, headers: corsHeaders });

                return new Response(csv, {
                    headers: { ...corsHeaders, "Content-Type": "text/csv; charset=utf-8" }
                });
            }

            // Get main data
            if (url.pathname === "/main-data") {
                const csv = await env.JURY_DATA.get("main_data");
                return new Response(csv || "", {
                    headers: { ...corsHeaders, "Content-Type": "text/csv; charset=utf-8" }
                });
            }

            // Get results lock status
            if (url.pathname === "/results-lock") {
                const status = await env.JURY_DATA.get("results_lock");
                return new Response(JSON.stringify({ locked: status === "true" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // --- EXISTING: PROXY FOR OPENROUTER ---
        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405, headers: corsHeaders });
        }

        try {
            const api_url = "https://openrouter.ai/api/v1/chat/completions";
            const body = await request.json();

            const response = await fetch(api_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://yulduz-awards.pages.dev",
                    "X-Title": "Yulduz Awards Dashboard",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }
    },
};
