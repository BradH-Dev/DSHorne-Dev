const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const uuidv4 = require('../utils/uuid');

const SQUARE_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const SQUARE_VERSION = '2024-05-15';
const BASE_URL = 'https://connect.squareup.com/v2';

function makeHeaders() {
  return {
    'Square-Version': SQUARE_VERSION,
    'Authorization': `Bearer ${SQUARE_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

exports.searchCatalog = async (body) => {
  const url = `${BASE_URL}/catalog/search`;
  const res = await fetch(url, { method: 'POST', headers: makeHeaders(), body: JSON.stringify(body) });
  return res.json();
};

exports.batchRetrieve = async (objectIds) => {
  const url = `${BASE_URL}/catalog/batch-retrieve`;
  const res = await fetch(url, { method: 'POST', headers: makeHeaders(), body: JSON.stringify({ object_ids: objectIds }) });
  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
  return res.json();
};

exports.getOrderDetails = async (orderId) => {
  const url = `${BASE_URL}/orders/${orderId}`;
  const res = await fetch(url, { method: 'GET', headers: makeHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to fetch order details: ${res.status} ${data.error}`);
  return data;
};

exports.inventoryBatchRetrieve = async (body) => {
  const url = `${BASE_URL}/inventory/counts/batch-retrieve`;
  const res = await fetch(url, { method: 'POST', headers: makeHeaders(), body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to fetch inventory counts: ${data.error}`);
  return data;
};

exports.inventoryChangesBatchCreate = async (changes) => {
  const url = `${BASE_URL}/inventory/changes/batch-create`;
  const res = await fetch(url, { method: 'POST', headers: makeHeaders(), body: JSON.stringify(changes) });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to update inventory: ${res.status} ${JSON.stringify(data)}`);
  return data;
};

exports.getOrder = async (orderId) => {
  return exports.getOrderDetails(orderId);
};
