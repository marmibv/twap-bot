const nodeFetch = require('node-fetch');

const fetch = async ({ url, method, headers }) => {
  const res = await nodeFetch(url, {
    headers,
    method,
  });

  if (!res.ok) {
    const data = await res.json();
    throw data;
  }

  return res.json();
};

module.exports = fetch;
