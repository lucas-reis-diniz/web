const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", {
        title: "KETSU Checker - Painel Web",
        message: "Seu painel está funcionando no Render!"
    });
});

app.get("/ping", (req, res) => {
    res.json({ status: "online", time: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 Painel web rodando em ${PORT}`);
});
