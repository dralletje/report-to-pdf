let fetch = require('node-fetch');
let fs = require('fs');

let REPORT_TO_PDF_URL = 'http://localhost:5000'; // For testing locally
// let REPORT_TO_PDF_URL = 'https://report-to-pdf.herokuapp.com';

let mkdir_promise = (path) => {
  return new Promise((yell) => {
    fs.mkdir(path, () => {
      yell();
    });
  });
}

let writefile_promise = (path, buffer) => {
  return new Promise((yell) => {
    fs.writeFile(path, buffer, () => {
      yell();
    });
  });
}

let download_pdf_from_url = async ({ url, pdf_options }) => {
  let resp = await fetch(`${REPORT_TO_PDF_URL}/html_from_url.pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, pdf_options }),
  });
  return await resp.buffer();
}

// Wrap in an async function so we can use await
(async () => {
  console.time('Downloading pdf...');
  let pdf_buffer = await download_pdf_from_url({ url: 'http://google.com', pdf_options: {} });
  console.timeEnd('Downloading pdf...');

  console.log(`pdf_buffer:`, pdf_buffer.length)

  console.log(`Creating './download' folder...`)
  await mkdir_promise('./download');

  console.time('Writing pdf...');
  await writefile_promise('./download/my-report.pdf', pdf_buffer);
  console.timeEnd('Writing pdf...');
})();
