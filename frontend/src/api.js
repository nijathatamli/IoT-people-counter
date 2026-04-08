import { API_BASE } from "./constants";
import {
  mockGetStations,
  mockGetNetwork,
  mockGetLive,
  mockGetPredict,
  mockGetPredictDay,
  mockGetRecommend,
  mockGetDirections,
  mockGetStationsRanked,
  mockGetScraperStatus,
  mockGetPredictTravel,
} from "./mock";

let apiAvailable = null; // null = unknown, true/false after first check

async function fetchJSON(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || res.statusText), {
      status: res.status,
      body,
    });
  }
  return res.json();
}

async function tryApi(path, params) {
  if (apiAvailable === false) return null;
  try {
    const result = await fetchJSON(path, params);
    apiAvailable = true;
    return result;
  } catch {
    apiAvailable = false;
    return null;
  }
}

export async function getStations() {
  const real = await tryApi(`${API_BASE}/stations`);
  return real || mockGetStations();
}

export async function getNetwork() {
  const real = await tryApi(`${API_BASE}/network`);
  return real || mockGetNetwork();
}

export async function getLive(stationId, zone) {
  const real = await tryApi(`${API_BASE}/live/${stationId}`, { zone });
  return real || mockGetLive(stationId, zone);
}

export async function getPredict(stationId, hour, day) {
  const real = await tryApi(`${API_BASE}/predict`, { station_id: stationId, hour, day });
  return real || mockGetPredict(stationId, hour, day);
}

export async function getPredictDay(stationId, day) {
  const real = await tryApi(`${API_BASE}/predict/day`, { station_id: stationId, day });
  return real || mockGetPredictDay(stationId, day);
}

export async function getRecommend(origin, dest, day) {
  const real = await tryApi(`${API_BASE}/recommend`, { origin, dest, day });
  return real || mockGetRecommend(origin, dest, day);
}

export async function getDirections(origin, dest, mode, hour, day) {
  const real = await tryApi(`${API_BASE}/directions`, { origin, dest, mode, hour, day });
  return real || mockGetDirections(origin, dest, mode, hour, day);
}

export async function getStationsRanked(hour, day) {
  const real = await tryApi(`${API_BASE}/stations/ranked`, { hour, day });
  return real || mockGetStationsRanked(hour, day);
}

export async function getScraperStatus() {
  const real = await tryApi(`${API_BASE}/scraper/status`);
  return real || mockGetScraperStatus();
}

export async function getPredictTravel(origin, dest, hour, day) {
  const real = await tryApi(`${API_BASE}/predict/travel`, { origin, dest, hour, day });
  return real || mockGetPredictTravel(origin, dest, hour, day);
}
