/***************************************************************
 *  KETSU CHECKER — PAINEL WEB PREMIUM (Render + Supabase)
 *  Autor: Lucas
 *  Stack: Node.js + Express + EJS + Chart.js + Supabase
 ***************************************************************/

const express = require("express");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 10000;

// ============================
// 🔥 CONFIGURAÇÃO DO SUPABASE
// ============================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltando variáveis SUPABASE_URL ou SUPABASE_ANON_KEY!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// 🔧 EXPRESS SETUP
// ============================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ============================
// 📌 ROTA PRINCIPAL — DASHBOARD
// ============================

app.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("submissions")
            .select("*")
            .order("timestamp", { ascending: false });

        if (error) throw error;

        const submissions = data || [];

        // Estatísticas
        let stats = {
            total: submissions.length,
            today: 0,
            byServer: {},
            byClan: {}
        };

        const today = new Date().toISOString().split("T")[0];

        for (const sub of submissions) {
            // hoje
            if (sub.timestamp.startsWith(today)) stats.today++;

            // servidor
            stats.byServer[sub.server] = (stats.byServer[sub.server] || 0) + 1;

            // clan
            stats.byClan[sub.clan] = (stats.byClan[sub.clan] || 0) + 1;
        }

        const recent = submissions.slice(0, 10);

        res.render("index", { stats, recent });

    } catch (err) {
        console.error("Erro no dashboard:", err);
        res.status(500).send("Erro Interno");
    }
});

// ============================
// 📄 PÁGINA DE SUBMISSÕES
// ============================

app.get("/submissions", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("submissions")
            .select("*")
            .order("timestamp", { ascending: false });

        if (error) throw error;

        res.render("submissions", { submissions: data || [] });

    } catch (err) {
        console.error("Erro ao carregar submissões:", err);
        res.status(500).send("Erro Interno");
    }
});

// ============================
// 📁 EXPORTAR CSV
// ============================

app.get("/csv", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("submissions")
            .select("*");

        if (error) throw error;

        const rows = data || [];

        const csv =
            "nick,server,clan,username,timestamp\n" +
            rows
                .map(s =>
                    `${s.nick},${s.server},${s.clan},${s.username},${s.timestamp}`
                )
                .join("\n");

        res.setHeader("Content-Disposition", "attachment; filename=submissions.csv");
        res.setHeader("Content-Type", "text/csv");
        return res.send(csv);

    } catch (err) {
        console.error("Erro ao gerar CSV:", err);
        res.status(500).send("Erro ao gerar CSV");
    }
});

// ============================
// 🚀 INICIAR SERVIDOR
// ============================

app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});
