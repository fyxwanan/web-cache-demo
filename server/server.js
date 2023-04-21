const http = require('http');
const url = require('url');
const path = require('path');
const { stat, readFile } = require('fs/promises');
const crypto = require('crypto');


http.createServer(async (req, res) => {
  let { pathname } = url.parse(req.url);
  let fileName = pathname === '/'
  ? path.join(__dirname, '../', pathname, 'client/index.html')
  : path.join(__dirname, '../', pathname);

  // 测试强缓存
  // res.setHeader('Expires', new Date(new Date().getTime() + 1000 * 10).toGMTString())
  // 新版本
  // Cache-Control 的值有很多
  // res.setHeader('Cache-Control', 'max-age=10')

  // 测试协商缓存
  // statObj有一些值
  /*
    dev: 16777233,
    mode: 33188,
    nlink: 1,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 6516444,
    size: 380,
    blocks: 8,
    atimeMs: 1682065192741.365,
    mtimeMs: 1682065192708.5417,
    ctimeMs: 1682065192708.5417,
    birthtimeMs: 1682063553877.8542,
    atime: 2023-04-21T08:19:52.741Z,
    mtime: 2023-04-21T08:19:52.709Z,
    ctime: 2023-04-21T08:19:52.709Z,   // 最后更新时间
    birthtime: 2023-04-21T07:52:33.878Z
  */

  try {
    const statObj = await stat(fileName);

    // Last-Modified 方式
    const ctime = statObj.ctime.toGMTString();
    res.setHeader('Last-Modified', ctime)
    if (req.headers['if-modified-since'] === ctime) {
      return (res.statusCode === 200) && res.end();
    }
    
    // 开始处理
    if (statObj.isFile()) {
      let result = await readFile(fileName);
      // Etag
      let hash = crypto.createHash('md5').update(result).digest('base64');
      res.setHeader('Etag', hash);
      if (req.headers['if-none-match'] === hash) {
        return (res.statusCode === 200) && res.end();
      }

      res.end(result);

    } else {
      res.statusCode = 400;
      res.end('NOT FOUND');
    }

  } catch(err) {
    console.log(err)
    res.statusCode = 400;
    res.end('NOT FOUND');
  }

  

}).listen(3001);