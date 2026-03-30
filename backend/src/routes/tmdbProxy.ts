/**
 * Public read-only proxy to TMDb API v3. Injects TMDB_API_KEY server-side so the browser never holds it.
 * Front calls: GET /api/v1/tmdb/search/movie?query=... → upstream https://api.themoviedb.org/3/search/movie?...
 */

import { Router } from 'express';
import { env } from '../config/env.js';

export const tmdbProxyRouter = Router();

tmdbProxyRouter.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = env.TMDB_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'TMDb is not configured on the server' });
      return;
    }

    const path = req.path || '/';
    if (path.includes('..') || path.includes('//')) {
      res.status(400).json({ success: false, error: 'Invalid path' });
      return;
    }

    const q = req.url.indexOf('?');
    const queryString = q >= 0 ? req.url.slice(q) : '';
    const base = env.TMDB_BASE_URL.replace(/\/$/, '');
    const upstream = new URL(`${base}${path === '/' ? '' : path}${queryString}`);
    if (!upstream.searchParams.has('api_key')) {
      upstream.searchParams.set('api_key', apiKey);
    }

    const r = await fetch(upstream.toString(), {
      method: req.method,
      headers: { Accept: 'application/json' },
    });

    const body = await r.text();
    const ct = r.headers.get('content-type');
    res.status(r.status);
    if (ct) res.setHeader('Content-Type', ct);
    res.send(body);
  } catch (err) {
    next(err);
  }
});
