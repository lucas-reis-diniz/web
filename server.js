const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateAllCSVs, getCSVFiles } = require('../utils/csvGenerator');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.WEB_PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsing JSON
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
    const submissionsDir = path.join(__dirname, '..', 'submissions');
    let submissions = [];
    let stats = {
        total: 0,
        byServer: {},
        byClan: {},
        today: 0
    };

    if (fs.existsSync(submissionsDir)) {
        const files = fs.readdirSync(submissionsDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(submissionsDir, file), 'utf8'));
                if (Array.isArray(data)) {
                    submissions = [...submissions, ...data];
                }
            } catch (error) {
                logger.error(`Erro ao ler arquivo ${file}:`, error);
            }
        });
    }

    // Calcular estatísticas
    stats.total = submissions.length;
    const today = new Date().toISOString().split('T')[0];
    
    submissions.forEach(sub => {
        // Por servidor
        stats.byServer[sub.server] = (stats.byServer[sub.server] || 0) + 1;
        
        // Por clan
        stats.byClan[sub.clan] = (stats.byClan[sub.clan] || 0) + 1;
        
        // Hoje
        if (sub.timestamp && sub.timestamp.startsWith(today)) {
            stats.today++;
        }
    });

    // Ordenar por data (mais recente primeiro)
    submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render('index', { submissions, stats });
});

// Rota para logs
app.get('/logs', (req, res) => {
    const logFiles = logger.getLogFiles();
    const selectedDate = req.query.date || null;
    let logContent = null;

    if (selectedDate) {
        logContent = logger.getLogs(selectedDate);
    } else {
        logContent = logger.getLogs();
    }

    res.render('logs', { logFiles, logContent, selectedDate });
});

// Rota para CSV
app.get('/csv', (req, res) => {
    const csvFiles = getCSVFiles();
    res.render('csv', { csvFiles });
});

// Rota para gerar CSV
app.post('/csv/generate', (req, res) => {
    try {
        const generated = generateAllCSVs();
        res.json({ success: true, generated: generated.length, files: generated });
    } catch (error) {
        logger.error('Erro ao gerar CSVs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para baixar CSV
app.get('/csv/download/:filename', (req, res) => {
    const csvDir = path.join(__dirname, '..', 'csv');
    const filePath = path.join(csvDir, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('Arquivo não encontrado');
    }
});

// Rota para API de estatísticas
app.get('/api/stats', (req, res) => {
    const submissionsDir = path.join(__dirname, '..', 'submissions');
    let submissions = [];

    if (fs.existsSync(submissionsDir)) {
        const files = fs.readdirSync(submissionsDir).filter(f => f.endsWith('.json'));
        files.forEach(file => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(submissionsDir, file), 'utf8'));
                if (Array.isArray(data)) {
                    submissions = [...submissions, ...data];
                }
            } catch (error) {
                logger.error(`Erro ao ler arquivo ${file}:`, error);
            }
        });
    }

    const stats = {
        total: submissions.length,
        byServer: {},
        byClan: {},
        recent: submissions.slice(0, 10)
    };

    submissions.forEach(sub => {
        stats.byServer[sub.server] = (stats.byServer[sub.server] || 0) + 1;
        stats.byClan[sub.clan] = (stats.byClan[sub.clan] || 0) + 1;
    });

    res.json(stats);
});

function startWebServer() {
    app.listen(PORT, () => {
        logger.info(`🌐 Painel web iniciado na porta ${PORT}`);
        logger.info(`📊 Acesse: http://localhost:${PORT}`);
    });
}

module.exports = { startWebServer, app };



