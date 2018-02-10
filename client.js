let REPORT_TO_PDF_URL = 'http://localhost:5000';
let download_pdf_from_html = async ({ html_body, pdf_options, filename }) => {
  let resp = await fetch(`${REPORT_TO_PDF_URL}/request_pdf_path`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html_body, pdf_options, filename }),
  });
  let { pdf_path } = await resp.json();
  window.location.href = `${REPORT_TO_PDF_URL}${pdf_path}`;
}
