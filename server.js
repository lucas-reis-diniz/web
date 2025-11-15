// server.js (painel no Render)
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// pegue essas duas env vars no Render (Settings -> Environment)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configurados!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// helper: carrega todas as submissões
async function fetchSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Erro ao buscar submissões:', error);
    return [];
  }
  return data || [];
}

// rota principal - dashboard
app.get('/', async (req, res) => {
  const submissions = await fetchSubmissions();

  const stats = {
    total: submissions.length,
    today: 0,
    byServer: {},
    byClan: {}
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  for (const sub of submissions) {
    // total hoje
    if (sub.timestamp && sub.timestamp.startsWith(todayStr)) {
      stats.today++;
    }
    // por servidor
    if (sub.server) {
      stats.byServer[sub.server] = (stats.byServer[sub.server] || 0) + 1;
    }
    // por clan
    if (sub.clan) {
      stats.byClan[sub.clan] = (stats.byClan[sub.clan] || 0) + 1;
    }
  }

  res.render('index', { submissions, stats });
});

// rota api stats
app.get('/api/stats', async (req, res) => {
  const submissions = await fetchSubmissions();

  const stats = {
    total: submissions.length,
    byServer: {},
    byClan: {},
    recent: submissions.slice(0, 20)
  };

  for (const sub of submissions) {
    stats.byServer[sub.server] = (stats.byServer[sub.server] || 0) + 1;
    stats.byClan[sub.clan] = (stats.byClan[sub.clan] || 0) + 1;
  }

  res.json(stats);
});

// rota para baixar CSV
app.get('/csv', async (req, res) => {
  const submissions = await fetchSubmissions();

  const header = ['id', 'user_id', 'username', 'nick', 'server', 'clan', 'timestamp'];
  const lines = [header.join(',')];

  for (const sub of submissions) {
    const row = [
      sub.id,
      sub.user_id,
      `"${sub.username || ''}"`,
      `"${sub.nick || ''}"`,
      sub.server || '',
      sub.clan || '',
      sub.timestamp || ''
    ];
    lines.push(row.join(','));
  }

  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  res.send(csv);
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Painel web iniciado na porta ${PORT}`);
});
