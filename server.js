const express = require("express");
const supabase = require("./supabase");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


// ========= HOME =========
app.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("timestamp", { ascending: false });

    if (error) return res.send("Erro ao puxar dados.");

    // Estatísticas
    const stats = {
        total: data.length,
        byServer: {},
        byClan: {}
    };

    data.forEach(s => {
        stats.byServer[s.server] = (stats.byServer[s.server] || 0) + 1;
        stats.byClan[s.clan] = (stats.byClan[s.clan] || 0) + 1;
    });

    res.render("index", { stats, recent: data.slice(0, 10) });
});


// ========= LISTAGEM COMPLETA =========
app.get("/submissions", async (req, res) => {
    const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("timestamp", { ascending: false });

    res.render("submissions", { submissions: data });
});


// ========= API =========
app.get("/api/submissions", async (req, res) => {
    const { data } = await supabase
        .from("submissions")
        .select("*")
        .order("timestamp", { ascending: false });

    res.json(data);
});


// ========= SERVER ONLINE =========
app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});
