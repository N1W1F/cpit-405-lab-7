const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const button = form.querySelector('button');

function errorFor(code) {
  if (code === 401) return new Error('Check your Unsplash Access Key.');
  if (code === 403 || code === 429) return new Error('Unsplash denied this request or the request limit was reached.');
  return new Error('Unsplash returned HTTP ' + code + '.');
}

function xhrSearch(url, authorization) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', authorization);
    xhr.responseType = 'json';
    xhr.timeout = 12000;
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve(xhr.response) : reject(errorFor(xhr.status));
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Unable to reach Unsplash.'));
    xhr.send();
  });
}

function promiseSearch(url, authorization) {
  return fetch(url, { headers: { Authorization: authorization } }).then(response => {
    if (!response.ok) throw errorFor(response.status);
    return response.json();
  });
}

async function asyncSearch(url, authorization) {
  const response = await fetch(url, { headers: { Authorization: authorization } });
  if (!response.ok) throw errorFor(response.status);
  return await response.json();
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
  const key = data.get('key').trim();
  if (!query || !key) { status.textContent = 'Enter a search term and an Access Key.'; return; }
  const url = new URL('https://api.unsplash.com/search/photos');
  url.search = new URLSearchParams({ query, per_page: '12' });
  results.replaceChildren();
  status.textContent = 'Searching…';
  button.disabled = true;
  try {
    const data = await methods[form.elements.method.value](url, 'Client-ID ' + key);
    if (!Array.isArray(data?.results)) throw new Error('Unsplash returned an unexpected response.');
    results.replaceChildren(...data.results.map(photoCard));
    status.textContent = data.results.length ? data.results.length + ' photos found.' : 'No photos found.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
