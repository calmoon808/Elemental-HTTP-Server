const fs = require('fs');

req.on('end', () => {
  console.log('poop');
  // figure out newElement.html string data
  // using the contents of the request

  // write the newElement.html file
  fs.writeFile('./newElement.html', (err, data) => {
    if (err) {
      return console.log(err);
    }

    // read contents of the public dir
    fs.readdir('./', (err, dir) => {
      if (err) {
        return console.log(err);
      }

      // figure out new index.html
      const index = '<html></html>';

      // write new index.html
      fs.writeFile('./index.html', index, (err) => {
        if (err) {
          return console.log(err);
        }

        res.end();
      });
    });
  });
});

// fs.readFile('./test.txt', (err, data) => {
//   if (err) {
//     return console.log('could not write the file');
//   }
//   console.log(data);
// });