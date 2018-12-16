const {
  AmalgamParser
} = require('../lib/index');
const entities = require('entities');
const fs = require('fs');
const path = require('path');

// Perf tests
let start = process.hrtime();
const elapsed_time = function (note) {
  var precision = 3; // 3 decimal places
  var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
  console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
  start = process.hrtime(); // reset the timer
}


// Sanitize and html before parsing
// Since there might be issues with how the data is parsed add custom sanitizer.
function templateSanitizer(template) {
  const replacer = (_match, _p1, p2) => {
    return `data-json="${entities.encode(`{${p2}}`)}"`;
  };
  const regex = new RegExp(/data-json=("{)+(.*)?(}")+/, 'ig');
  let result = template.replace(regex, replacer);
  return result;
}

// Some async function to resolve components could be react render to string
function componentHandler(node, _matchedHtml, _headStylesScripts, _bodyStylesScripts) {
  return new Promise(resolve => {
    const attrs = {};
    node.attrs.forEach(attr => {
      attrs[attr.name] = attr.value;
    });
    resolve(`
            ${attrs['data-json'] ? `<script>var output = ${entities.decode(attrs['data-json'])}</script>` : ''}
            <div class="hello">${attrs['data-component']}</div>
        `);
  });
}
fs.readFile(path.join(__dirname, 'sample.html'), 'utf8', (err, html) => {
  if (err) {
    throw new Error(err);
  }
  const parser = new AmalgamParser({
    componentHandler,
    templateSanitizer,
  });
  parser.parse(html).then(data => {
    // console.log(data);
    elapsed_time('custom parser');
    fs.writeFileSync(path.join(__dirname, '..', 'dist', 'output.html'), data, 'utf8');
  });
});
