let express = require('express');
let cors = require('cors');

let app = express();

app.use(express.json());
app.use(cors());

let generate_uuid = () => {
  let S4 = () => {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

let cache = {};
let options_cache = {};

app.use(express.static('public'));

app.post('/html_from_url.pdf', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      delete require.cache[require.resolve('./render_pdf.js')];
    }

    let pdf_request = req.body;

    let { render_from_url } = require('./render_pdf.js');
    await render_from_url(req, res, cache);
  } catch (require_error) {
    console.error(`Error during \`require('./render_pdf.js')\``);
    console.error(require_error);
    res.end(JSON.stringify({
      error: require_error.message,
    }))
  }
});

app.get('/html.pdf', async (req, res) => {

  try {
    if (process.env.NODE_ENV === 'development') {
      delete require.cache[require.resolve('./render_pdf.js')];
    }

    let pdf_request = options_cache[req.query.id];
    delete options_cache[req.query.id];

    if (pdf_request.type === 'by_html') {
      req.body = pdf_request.options;
      let { render_response } = require('./render_pdf.js');
      await render_response(req, res, cache);
    }
    else if (pdf_request.type === 'by_url') {
      req.body = pdf_request.options;
      let { render_from_url } = require('./render_pdf.js');
      await render_from_url(req, res, cache);
    }
    else {
      throw new Error(`Really really weird`);
    }
  } catch (require_error) {
    console.error(`Error during \`require('./render_pdf.js')\``);
    console.error(require_error);
    res.end(JSON.stringify({
      error: require_error.message,
    }))
  }
})

app.post('/request_pdf_path', async (req, res) => {
  let body = req.body;
  let uuid = generate_uuid();
  options_cache[uuid] = {
    type: 'by_html',
    options: body,
  };

  res.end(JSON.stringify({
    pdf_path: `/html.pdf?id=${uuid}`,
  }));
});

app.post('/request_pdf_path_by_url', async (req, res) => {
  let body = req.body;

  if (!body.url) {
    return res.end(`No url given...`);
  }

  let uuid = generate_uuid();
  options_cache[uuid] = {
    type: 'by_url',
    options: body,
  };

  res.end(JSON.stringify({
    pdf_path: `/html.pdf?id=${uuid}`,
  }));
})

app.listen(process.env.PORT || 5000, () => {
  console.log('Listening on port 5000');
  console.log();
});

process.on('SIGINT', () => {
  process.exit();
});
