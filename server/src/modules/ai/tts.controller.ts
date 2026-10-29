import { Request, Response } from 'express';

// In-memory LRU cache for synthesized neural MP3 chunks
const AUDIO_CHUNK_CACHE = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 250;

function setCachedChunk(key: string, buf: Buffer) {
  if (AUDIO_CHUNK_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = AUDIO_CHUNK_CACHE.keys().next().value;
    if (oldestKey) AUDIO_CHUNK_CACHE.delete(oldestKey);
  }
  AUDIO_CHUNK_CACHE.set(key, buf);
}

/**
 * Splits long Indonesian text into natural clause/sentence chunks <= 180 chars
 * so the neural TTS engine maintains natural intonation without truncating.
 */
function splitIntoNaturalChunks(text: string, maxLen = 180): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const rawClauses = cleaned.match(/[^.!?;,\n]+[.!?;,\n]*/g) || [cleaned];
  const chunks: string[] = [];
  let current = '';

  for (const clause of rawClauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= maxLen) {
        current = trimmed;
      } else {
        const words = trimmed.split(/\s+/);
        current = '';
        for (const word of words) {
          if ((current + ' ' + word).trim().length <= maxLen) {
            current = (current + ' ' + word).trim();
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function fetchNeuralChunkMp3(chunk: string, lang = 'id'): Promise<Buffer> {
  const cacheKey = `${lang}:${chunk}`;
  const cached = AUDIO_CHUNK_CACHE.get(cacheKey);
  if (cached) return cached;

  // 1. Primary Engine: Studio Human Neural Indonesian Voice (id_001)
  if (lang.startsWith('id')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('https://ottsy.weilbyte.dev/api/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          text: chunk,
          voice: 'id_001',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json: any = await response.json();
        if (json && json.data) {
          const buf = Buffer.from(json.data, 'base64');
          if (buf.length > 200) {
            setCachedChunk(cacheKey, buf);
            return buf;
          }
        }
      }
    } catch (_) {
      // Proceed to secondary neural stream if primary times out
    }
  }

  // 2. Secondary Fallback Stream
  const encoded = encodeURIComponent(chunk);
  const urls = [
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=gtx&ttsspeed=1`,
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=1`,
  ];

  let lastError: any = null;
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Accept: 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
          Referer: 'https://translate.google.com/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (buf.length > 100) {
          setCachedChunk(cacheKey, buf);
          return buf;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to synthesize neural TTS audio chunk');
}

export const synthesizeSpeech = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawText = (req.query.text as string) || (req.body?.text as string) || '';
    const lang = ((req.query.lang as string) || (req.body?.lang as string) || 'id').slice(0, 5);

    const text = String(rawText).trim().slice(0, 1500);
    if (!text) {
      res.status(400).json({ success: false, message: 'Parameter text diperlukan untuk sintesis suara.' });
      return;
    }

    const chunks = splitIntoNaturalChunks(text, 180);
    if (chunks.length === 0) {
      res.status(400).json({ success: false, message: 'Teks kosong.' });
      return;
    }

    const buffers = await Promise.all(chunks.map((c) => fetchNeuralChunkMp3(c, lang)));
    const combinedMp3 = Buffer.concat(buffers);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combinedMp3.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');
    res.status(200).send(combinedMp3);
  } catch (error) {
    console.warn('[TTS] Neural synthesis fallback triggered:', (error as any)?.message || error);
    res.status(503).json({
      success: false,
      message: 'Layanan neural stream sedang sibuk, beralih ke mesin suara lokal.',
    });
  }
};

