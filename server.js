const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

const PORT = 8080;

const server = http.createServer((req, res) => {
  let method = req.method;
  let URL = req.url;
  let headers = req.headers;
      if (method === 'GET'){
        if (URL === '/'){
          URL = '/index.html';
        }
        splitURL = URL.split('.');
        let type = splitURL[1];
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        fs.readdir('./public', (err, dir) => {
          if (err){return console.log(err);}
          if (dir.includes(URL.slice(1)) === false){URL = '/notFound.html'}
          fs.readFile(`./public${URL}`, (err, data) => {
            if (err) {return console.log('could not read the file');}
            let dataStr = data.toString('utf8');
            if (URL === '/notFound.html'){
              dataStr = dataStr.slice(1, dataStr.length - 1);
            }
            req.on('end', () => {
              res.writeHead(200, {
                'content-type': `text/${type}`,
                'content-length': dataStr.length,
                'Connection': 'keep-alive'
              });
            });
            res.write(dataStr);
            res.end(); 
          });
       });
      } else if (method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          let bodyParse = querystring.parse(body);
          let html = `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>The Elements - ${bodyParse.elementName}</title>
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body>
            <h1>${bodyParse.elementName}</h1>
            <h2>${bodyParse.elementSymbol}</h2>
            <h3>Atomic number ${bodyParse.elementAtomicNumber}</h3>
            <p>${bodyParse.elementDescription}</p>
            <p><a href="/">back</a></p>
          </body>
          </html>`;
          let htmlFileName = bodyParse.elementName.charAt(0).toLowerCase() + bodyParse.elementName.slice(1);
          fs.writeFile(`./public/${htmlFileName}.html`, html, (err, data) => {
            if (err){return console.log(err);}
            fs.readdir('./public', (err, dir) => {
              if (err){return console.log(err);}
              let dirHtml = dir.filter(url => url.includes('.html') && !url.includes('index') && !url.includes('notFound'));
              let orderedList = ``;
              for (let i in dirHtml){
                orderedList += `
                <li>
                  <a href="/${dirHtml[i]}">${dirHtml[i].charAt(0).toUpperCase() + dirHtml[i].slice(1, -5)}</a>
                </li>`
              }
              fs.readFile('./public/index.html', (err, data) => {
                if (err) {return console.log('could not write the file');}
                let index = `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <title>The Elements</title>
                  <link rel="stylesheet" href="/styles.css">
                </head>
                <body>
                  <h1>The Elements</h1>
                  <h2>These are all the known elements.</h2>
                  <h3>These are ${dirHtml.length }</h3>
                  <ol>
                   ${orderedList}
                  </ol>
                </body>
                </html>`;
                fs.writeFile('./public/index.html', index, (err) => {
                  if (err){return console.log(err);}
                });
                req.on('end', () => {
                  res.writeHead(200, {
                    'content-type': 'application/json'
                  });
                });
                res.write('{"success" : true}');
                res.end();
              });
            });
          });
        });
      } else if (method === 'PUT'){
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          let bodyParse = querystring.parse(body);
          fs.readdir('./public', (err, dir) => {
            if (err){return console.log("couldn't read directory");}
            if (!dir.includes(URL.slice(1)) || URL === '/index.html'){
              req.on('end', () => {
                res.writeHead(500, {
                  'content-type': 'application/json'
                });
              });
              res.write("{'error' : true}");
              res.end();
            } else {
              fs.readFile('./public/index.html', (err, data) => {
                if (err){return console.log("couldn't read file")};
                let noSlash = URL.slice(1);
                let indexData = data.toString();
                indexData = indexData.replace(URL, `/${bodyParse.elementName}.html`);
                indexData = indexData.replace((noSlash.charAt(0).toUpperCase() + noSlash.slice(1, -5)), (bodyParse.elementName.charAt(0).toUpperCase() + bodyParse.elementName.slice(1)));
                fs.writeFile('./public/index.html', indexData, (err) => {
                  if (err){return console.log(err)};
                  fs.rename(`./public${URL}`, `./public/${bodyParse.elementName}.html`, (err) => {
                    if (err){return console.log("couldn't rename file")};
                  });
                })
                fs.readFile(`./public${URL}`, (err, data) => {
                  if (err){return console.log("couldn't read file")};
                  let newData = data.toString();
                  if (bodyParse.elementName){
                    newData = newData.replace(newData.slice(newData.indexOf(`<title>`), newData.indexOf(`</title>`)), `<title>The Elements - ${bodyParse.elementName}`);
                    newData = newData.replace(newData.slice(newData.indexOf(`<h1>`), newData.indexOf(`</h1>`)), `<h1>${bodyParse.elementName}`);
                  }
                  if (bodyParse.elementSymbol){
                    newData = newData.replace(newData.slice(newData.indexOf(`<h2>`), newData.indexOf(`</h2>`)), `<h2>${bodyParse.elementSymbol}`);
                  }
                  if (bodyParse.elementAtomicNumber){
                    newData = newData.replace(newData.slice(newData.indexOf(`<h3>`), newData.indexOf(`</h3>`)), `<h3>${bodyParse.elementAtomicNumber}`);
                  }
                  if (bodyParse.elementDescription){
                    newData = newData.replace(newData.slice(newData.indexOf(`<p>`), newData.indexOf(`</p>`)), `<p>${bodyParse.elementDescription}`);
                  }
    
                  fs.writeFile(`./public${URL}`, newData, (err) => {
                    if (err){return console.log(err);}
                  });
                  req.on('end', () => {
                    res.writeHead(200, {
                      'content-type': 'application/json'
                    });
                  });
                  res.write("{'success' : true}");
                  res.end();
                });
              });
            };
          });
        });
      } else if (method === 'DELETE'){
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          fs.readdir('./public', (err, dir) => {
            let dirHtml = dir.filter(url => url.includes('.html') && !url.includes('index') && !url.includes('notFound'));
            if (err){return console.log("couldn't read directory")};
            console.log(dirHtml);
            if (!dirHtml.includes(URL.slice(1))){
              res.writeHead(500, {
                'content-type' : 'application/json'
              })
              res.write(`{'error' : 'resource ${URL} does not exist'}`);
              res.end();
            } else {
              fs.unlink(`./public${URL}`, (err) => {
                if (err){return console.log(err)};
                fs.readdir('./public', (err, dir) => {
                  if (err){return console.log("couldn't read directory")};
                  dirHtml = dir.filter(url => url.includes('.html') && !url.includes('index') && !url.includes('notFound'));
                  let orderedList = ``;
                  for (let i in dirHtml){
                    orderedList += `
                    <li>
                      <a href="/${dirHtml[i]}">${dirHtml[i].charAt(0).toUpperCase() + dirHtml[i].slice(1, -5)}</a>
                    </li>`
                  }
                  fs.readFile('./public/index.html', (err, data) => {
                    if (err) {return console.log('could not write the file');}
                    let indexaaa = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <title>The Elements</title>
                      <link rel="stylesheet" href="/styles.css">
                    </head>
                    <body>
                      <h1>The Elements</h1>
                      <h2>These are all the known elements.</h2>
                      <h3>These are ${dirHtml.length}</h3>
                      <ol>
                       ${orderedList}
                      </ol>
                    </body>
                    </html>`;
                    // console.log(index);
                    fs.writeFile('./public/index.html', indexaaa, (err) => {
                      if (err){return console.log(err);}
                      res.writeHead(200, {
                        'content-type' : 'application/json'
                      })
                      res.write(`{'success' : 'true'}`);
                      res.end();
                    });
                  });
                });
              });
            };
          });
        });
      };
});

server.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
