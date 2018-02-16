let puppeteer = require('puppeteer');

let check_options = () => {

}

let fallback_html = `
  <div>No <pre>{ html_body }</pre> provided!</div>
`

let create_browser = async () => {
  return await puppeteer.launch({
    // No sandbox: living on the (heroku) edge
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

let create_page = async (browser) => {
  let page = await browser.newPage();

  page.on('pageerror', (err) => {
    console.log('Error on page:', err)
  });

  return page;
}

let render_pdf = async (load_page, options = {}, cache) => {
  await check_options(options);

  console.log('\n\n>> NEW REQUEST');

  console.time('retrieve browser and page');
  cache.pages = null;
  cache.browser = cache.browser || await create_browser();
  // cache.pages = cache.pages || [await create_page(cache.browser)];
  // let page = cache.pages[0];
  let page = await create_page(cache.browser);
  console.timeEnd('retrieve browser and page');

  try {
    // NOTE This suddenly stopped working... ?
    if (page.setJavascriptEnabled) {
      await page.setJavascriptEnabled(false);
    } else {
      console.log('WARN: setJavascriptEnabled not found (huh)... insecure!');
    }
    if (page.setCacheEnabled) {
      await page.setCacheEnabled(false);
    } else {
      console.log('WARN: setCacheEnabled not found (huh)... insecure!');
    }

    console.time('loadpage');
    // await page.reload({ waitUntil: 'networkidle0' });
    await load_page(page);
    console.timeEnd('loadpage');

    console.time('pdf');
    console.log(`options:`, options)
    let default_margin = { top: '50px', bottom: '50px', left: '50px', right: '50px' };
    let pdf_buffer = await page.pdf({
      printBackground: true,
      pageRanges: '1',
      format: 'A4',
      ...options,
      margin: { ...default_margin, ...options.margin },
    });
    console.timeEnd('pdf');

    return pdf_buffer;
  } finally {
    page.close();
  }
}

let load_html = (html_body) => async (page) => {
  await page.goto(`data:text/html,<html>${html_body}</html>`, {
    timeout: 5000,
  });
}

let load_url = (url) => async (page) => {
  await page.goto(url, {
    timeout: 5000,
  });
}

let render_from_url = async (req, res, cache) => {
  try {
    console.time('FULL RENDER');
    let { url, pdf_options, filename } = req.body;

    res.set({
      "Content-Transfer-Encoding": "Binary",
      'Content-Type': 'application/octet-stream',
      "Content-disposition": `attachment; filename="${filename || 'report.pdf'}"`
    });

    res.end(await render_pdf(load_url(url), pdf_options, cache));
    console.timeEnd('FULL RENDER');
  } catch (render_err) {
    console.error(`Error during \`render_pdf(req, res)\``);
    console.error(render_err);
    res.end('Sorry')
  }
}

let render_response = async (req, res, cache) => {
  try {
    console.time('FULL RENDER');
    let { html_body = fallback_html, pdf_options, filename } = req.body;

    res.set({
      "Content-Transfer-Encoding": "Binary",
      'Content-Type': 'application/octet-stream',
      "Content-disposition": `attachment; filename="${filename || 'report.pdf'}"`
    });

    res.end(await render_pdf(load_html(html_body), pdf_options, cache));
    console.timeEnd('FULL RENDER');
  } catch (render_err) {
    console.error(`Error during \`render_pdf(req, res)\``);
    console.error(render_err);
    res.end('Sorry')
  }
}

module.exports = { render_response, render_pdf, render_from_url };
