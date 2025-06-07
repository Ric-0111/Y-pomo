const express = require('express');
const app = express();

// 静的ファイルのホスト設定を削除（publicフォルダは使用しないため）

// APIキーを返すエンドポイント
app.get('/api/config', (req, res) => {
  res.json({
    youtubeApiKey: process.env.YOUTUBE_API_KEY
  });
});

// ルートURLへのアクセス時にindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// style.cssを返すエンドポイント
app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/style.css');
});

// script.jsを返すエンドポイント
app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js');
});

// サーバーを起動
const PORT = process.env.PORT || 3000; // Netlifyの環境変数PORTに対応
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});