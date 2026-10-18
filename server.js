const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server-Sent Events (SSE) to stream bash terminal logs live to the browser window
app.get('/api/stream-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const action = req.query.action;
    let cmd = '';

    if (action === 'open') {
        cmd = `cd ~ && rm -rf Interstellar && git clone https://github.com/UseInterstellar/Interstellar && cd Interstellar && npm cache clean --force && npm install --ignore-scripts --legacy-peer-deps && npm install pm2 -g && pm2 start npm --no-daemon --name "proxy" -- run start`;
    } else if (action === 'refresh') {
        cmd = `pkill -9 -f node 2>/dev/null || true; pkill -9 -f npm 2>/dev/null || true; fuser -k 8080/tcp 2>/dev/null || true; cd ~/Interstellar && rm -rf node_modules package-lock.json pnpm-lock.yaml && npm install --legacy-peer-deps && npm run start`;
    } else if (action === 'redeploy') {
        cmd = `cd ~/Interstellar && npm run start`;
    } else {
        res.write("data: ❌ Unknown action script requested.\n\n");
        return res.end();
    }

    // Spawns native Windows 11 bash environment to execute the sequence
    const child = spawn('bash', ['-c', cmd]);

    child.stdout.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
    });

    child.stderr.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
    });

    child.on('close', (code) => {
        res.write(`data: [PROCESS_EXITED_WITH_CODE_${code}]\n\n`);
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`Control panel running locally at http://localhost:${PORT}`);
});
