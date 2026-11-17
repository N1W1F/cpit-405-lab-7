const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const button = form.querySelector('button');

function errorFor(code, body) {
  if (body?.error) return new Error(body.error);
  if (code === 429) return new Error('The photo search limit was reached. Try again later.');
  return new Error('Photo search is temporarily unavailable.');
}

function xhrSearch(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.timeout = 12000;
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve(xhr.response) : reject(errorFor(xhr.status, xhr.response));
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Unable to reach photo search.'));
    xhr.send();
  });
}

function promiseSearch(url) {
  return fetch(url).then(response =>
    response.json().then(data => {
      if (!response.ok) throw errorFor(response.status, data);
      return data;
    })
  );
}

async function asyncSearch(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw errorFor(response.status, data);
  return data;
}

const methods = { xhr: xhrSearch, promise: promiseSearch, async: asyncSearch };

function creditLink(url, text) {
  const link = document.createElement('a');
  const creditedUrl = new URL(url);
  creditedUrl.searchParams.set('utm_source', 'cpit405_lab7');
  creditedUrl.searchParams.set('utm_medium', 'referral');
  link.href = creditedUrl.href;
  link.textContent = text;
  return link;
}

function photoCard(photo) {
  const figure = document.createElement('article');
  figure.className = 'card';
  const photoLink = creditLink(photo.links.html, '');
  const image = document.createElement('img');
  image.src = photo.urls.small;
  image.alt = photo.alt_description || photo.description || 'Unsplash photo';
  image.loading = 'lazy';
  photoLink.append(image);
  const caption = document.createElement('p');
  caption.className = 'body';
  caption.append('Photo by ', creditLink(photo.user.links.html, photo.user.name), ' on ',
    creditLink('https://unsplash.com/', 'Unsplash'));
  figure.append(photoLink, caption);
  return figure;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const query = data.get('query').trim();
  if (!query) { status.textContent = 'Enter a search term.'; return; }
  const apiOrigin = document.querySelector('meta[name="api-origin"]')?.content || location.origin;
  const url = new URL('/api/photos', apiOrigin);
  url.search = new URLSearchParams({ query });
  results.replaceChildren();
  status.textContent = 'Searching…';
  button.disabled = true;
  try {
    const data = await methods[form.elements.method.value](url);
    if (!Array.isArray(data?.results)) throw new Error('Unsplash returned an unexpected response.');
    results.replaceChildren(...data.results.map(photoCard));
    status.textContent = data.results.length ? data.results.length + ' photos found.' : 'No photos found.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
