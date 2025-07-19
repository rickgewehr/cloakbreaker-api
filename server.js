
const express = require('express');
const app = express();
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');

app.use(cors());
app.use('/analyze', analyzeRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
