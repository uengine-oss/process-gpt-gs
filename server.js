const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// 빌드된 파일이 있는 디렉토리를 정적 파일로 제공
app.use(express.static(path.join(__dirname, 'dist')));

// 정적 파일이 아닌 경우에만 index.html로 리디렉션
app.get('*', (req, res) => {
  // 정적 파일 확장자가 있는 경우 404 처리
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('File not found');
  }
  // 그 외의 경우에만 index.html 제공
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});