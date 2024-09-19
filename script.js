const EDITOR_SELECTOR = '[data-testid="loki-editor"]';
const REFRESH_BUTTON_SELECTOR =
  '[data-testid="data-testid RefreshPicker interval button"]';
const SHORT_URL_TESTID = 'short-url-button';
const SHORT_URL_SELECTOR = `[data-testid="${SHORT_URL_TESTID}"]`;
const MESSAGE_CELL_SELECTOR = '[class*=logs-row__message] div:not(.added)';
const SAMPLE_LINK_SELECTOR = '.log-row-context';

async function shortenURL(url) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    url,
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  const res = await (await fetch('https://cheq.io/shorten', requestOptions)).json();

  return res.shortened_url;
}

function addCopyButton() {
  const existingCopyButton = document.querySelector(SHORT_URL_SELECTOR);
  if (existingCopyButton) return;

  const editor = document.querySelector(EDITOR_SELECTOR);
  const refreshButton = document.querySelector(REFRESH_BUTTON_SELECTOR);

  if (!editor) return;

  const copyButton = document.createElement('button');
  copyButton.dataset.testid = SHORT_URL_TESTID;
  copyButton.innerText = 'Short URL';
  refreshButton.classList.forEach(c => copyButton.classList.add(c));
  copyButton.style.marginLeft = '8px';

  copyButton.addEventListener('click', async () => {
    copyButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    const shortUrl = await shortenURL(window.location.href);
    await navigator.clipboard.writeText(shortUrl);
    copyButton.innerText = 'Copied!';
  });

  editor.appendChild(copyButton);
}

function addReqTabButton() {
  const messageCells = document.querySelectorAll(MESSAGE_CELL_SELECTOR);

  const sampleLink = document.querySelector(SAMPLE_LINK_SELECTOR);

  const url = new URL(window.location.href);

  const left = JSON.parse(url.searchParams.get('left'));
  const [expr] = left?.queries[0]?.expr?.match(/{.*}/) ?? [];

  console.log(`number of new messages: ${messageCells.length}`);

  for (const messageCell of messageCells) {
    messageCell.classList.add('added');

    const [, requestId] = messageCell.innerText.match(/(requestId|reqId)":"(.*?)"/) ?? [];

    if (!requestId) continue;

    const newTabLink = document.createElement('a');

    left.queries[0].expr = `${expr} |~ "${requestId}"`;
    url.searchParams.set('left', JSON.stringify(left));

    newTabLink.innerText = 'New Tab';
    newTabLink.style.marginLeft = '8px';
    newTabLink.href = url.toString();
    newTabLink.target = '_blank';
    sampleLink?.classList.forEach(c => newTabLink.classList.add(c));

    messageCell.appendChild(newTabLink);

    return;
  }
}

async function main() {
  addCopyButton();

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type !== 'childList') return;

      addCopyButton();

      addReqTabButton();
    });
  });

  observer.observe(document.querySelector('body'), {
    childList: true,
    subtree: true,
  });
}

window.setTimeout(main, 2000);
