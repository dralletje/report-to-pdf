let express = require('express');
let cors = require('cors');

let app = express();

app.use(express.json());
app.use(cors());

let cache = {};

app.get('/html.pdf', async (req, res) => {
  try {
    delete require.cache[require.resolve('./render_pdf.js')]
    let { render_pdf } = require('./render_pdf.js');
    res.end(await render_pdf(`
      <div>Sorry, you need to do a POST request to make this work</div>
    `, {}, cache));
  } catch (require_error) {
    console.error(`Error during \`require('./render_pdf.js')\``);
    console.error(require_error);
  }

})

app.post('/html.pdf', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      delete require.cache[require.resolve('./render_pdf.js')];
    }

    let { render_response } = require('./render_pdf.js');
    await render_response(req, res, cache);
  } catch (require_error) {
    console.error(`Error during \`require('./render_pdf.js')\``);
    console.error(require_error);
  }

})

app.listen(process.env.PORT || 5000, () => {
  console.log('Listening on port 5000');
  console.log();
});

process.on('SIGINT', () => {
  process.exit();
});
