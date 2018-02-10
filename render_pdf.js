let puppeteer = require('puppeteer');

let check_options = () => {

}

let fallback_html = `
  <div>No <pre>{ html_body }</pre> provided!</div>
`

let render_pdf = async (html_body = fallback_html, options = {}, cache) => {
  await check_options(options);

  console.time('retrieve browser and page');
  cache.browser = cache.browser || await puppeteer.launch();
  cache.pages = cache.pages || [await cache.browser.newPage()];
  console.timeEnd('retrieve browser and page');

  let page = cache.pages[0];

  await page.setJavaScriptEnabled(false);
  await page.setOfflineMode(true);

  console.time('loadpage');
  await page.setContent(`<html>${html_body}</html>`);
  // await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle2' });
  console.timeEnd('loadpage');

  console.time('pdf');
  console.log(`options:`, options)
  let default_margin = { top: '50px', bottom: '50px', left: '50px', right: '50px' };
  let pdf_buffer = await page.pdf({ pageRanges: '1', format: 'A4', ...options, margin: { ...default_margin, ...options.margin } });
  console.timeEnd('pdf');

  return pdf_buffer;
}

let render_response = async (req, res, cache) => {
  try {
    console.time('FULL RENDER');
    let { html_body = fallback_html, pdf_options } = req.body;

    res.end(await render_pdf(html_body, pdf_options, cache));
    console.timeEnd('FULL RENDER');
  } catch (render_err) {
    console.error(`Error during \`render_pdf(req, res)\``);
    console.error(render_err);
    res.end('Sorry')
  }
}

module.exports = { render_response, render_pdf };
