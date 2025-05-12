const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const multer = require('multer');
const upload = multer();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <dir>', 'Cache directory');

program.parse(process.argv);
const options = program.opts();
const cacheDir = options.cache; // <-- тепер правильне місце

const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

// GET /notes/:name
app.get('/notes/:name', (req, res) => {
  const filePath = path.join(cacheDir, req.params.name + '.txt');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  const content = fs.readFileSync(filePath, 'utf-8');
  res.send(content);
});

// PUT /notes/:name
app.put('/notes/:name', express.text(), (req, res) => {
  const filePath = path.join(cacheDir, req.params.name + '.txt');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  fs.writeFileSync(filePath, req.body);
  res.sendStatus(200);
});

// DELETE /notes/:name
app.delete('/notes/:name', (req, res) => {
  const filePath = path.join(cacheDir, req.params.name + '.txt');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  fs.unlinkSync(filePath);
  res.sendStatus(200);
});

// GET /notes
app.get('/notes', (req, res) => {
  const files = fs.readdirSync(cacheDir);
  const notes = files.map(filename => {
    const name = path.basename(filename, '.txt');
    const text = fs.readFileSync(path.join(cacheDir, filename), 'utf-8');
    return { name, text };
  });
  res.json(notes);
});

// POST /write — multipart/form-data
app.post('/write', upload.none(), (req, res) => {
  const { note_name, note } = req.body;
  const filePath = path.join(cacheDir, note_name + '.txt');
  if (fs.existsSync(filePath)) return res.sendStatus(400);
  fs.writeFileSync(filePath, note);
  res.sendStatus(201);
});

// GET /UploadForm.html
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
