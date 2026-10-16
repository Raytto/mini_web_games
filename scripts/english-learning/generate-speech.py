#!/usr/bin/env python3
"""Generate scene-directed CosyVoice 3.5 Plus speech, outside the browser.

Requires ffmpeg/ffprobe and DASHSCOPE_API_KEY. Credentials and signed URLs are
never written to output. Cached audio is reused only when its fingerprint and
content hash match, so model/voice/direction changes cannot reuse old speech.
"""
import argparse
import array
import concurrent.futures
import hashlib
import json
import math
import os
from pathlib import Path
import re
import struct
import subprocess
import time
import urllib.error
import urllib.request

MODEL = 'cosyvoice-v3.5-plus'
ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer'
PROCESSING = 'mono 24kHz MP3, 80kbps, -18 LUFS, -2dBTP; original pitch and timing'
MAX_RAW_BYTES = 16 * 1024 * 1024


def normalize_wav(content):
    """Finalize streaming WAV sizes before a decoder trusts the frame count.

    CosyVoice can return a complete PCM download with near-2-GiB streaming
    placeholders. Only those placeholders may be shortened; ordinary truncated
    files are rejected. PCM bytes are preserved exactly.
    """
    if len(content) < 44 or len(content) > MAX_RAW_BYTES:
        raise RuntimeError('Invalid WAV download size')
    if content[:4] != b'RIFF' or content[8:12] != b'WAVE':
        raise RuntimeError('Expected a RIFF WAVE download')
    declared = struct.unpack_from('<I', content, 4)[0]
    placeholder = lambda value: value >= 0x7fff0000
    if declared != len(content) - 8 and not placeholder(declared):
        raise RuntimeError('Truncated or inconsistent WAV container')
    fixed = bytearray(content)
    offset, audio_format, data_seen = 12, None, False
    while offset < len(content):
        if offset + 8 > len(content):
            raise RuntimeError('Truncated WAV chunk header')
        kind = content[offset:offset + 4]
        size = struct.unpack_from('<I', content, offset + 4)[0]
        start = offset + 8
        available = len(content) - start
        if size > available:
            if kind != b'data' or not placeholder(size):
                raise RuntimeError('Truncated WAV chunk')
            size = available
            struct.pack_into('<I', fixed, offset + 4, size)
        if kind == b'fmt ':
            if audio_format is not None or size < 16:
                raise RuntimeError('Invalid WAV format chunk')
            audio_format = struct.unpack_from('<HHIIHH', content, start)
        elif kind == b'data':
            if data_seen or audio_format is None:
                raise RuntimeError('Invalid WAV audio chunk order')
            encoding, channels, rate, byte_rate, align, bits = audio_format
            if (encoding != 1 or channels not in (1, 2) or rate != 24000
                    or bits != 16 or align != channels * 2 or byte_rate != rate * align):
                raise RuntimeError('Expected 24 kHz 16-bit PCM speech')
            if not size or size % align or size > byte_rate * 30:
                raise RuntimeError('Invalid WAV frame count or speech duration')
            data_seen = True
        offset = start + size + (size % 2)
        if offset > len(content):
            raise RuntimeError('Missing WAV chunk padding')
    if not data_seen:
        raise RuntimeError('Missing WAV audio')
    struct.pack_into('<I', fixed, 4, len(content) - 8)
    return bytes(fixed)


def normalize_cached_wav(raw, meta, cached):
    """Repair a verified cached raw file without regenerating its valid MP3."""
    if not raw.exists() or raw.stat().st_size > MAX_RAW_BYTES:
        raise RuntimeError('Missing or oversized cached WAV')
    content = raw.read_bytes()
    if cached.get('raw_sha256') != hashlib.sha256(content).hexdigest():
        return False
    fixed = normalize_wav(content)
    if fixed != content:
        temp = raw.with_suffix('.part.wav')
        temp.write_bytes(fixed)
        temp.replace(raw)
        cached['raw_sha256'] = hashlib.sha256(fixed).hexdigest()
        write_json(meta, cached)
    return True


def read_key(env_file=None):
    key = os.environ.get('DASHSCOPE_API_KEY', '')
    if env_file:
        for line in Path(env_file).read_text().splitlines():
            if line.startswith('DASHSCOPE_API_KEY='):
                key = line.split('=', 1)[1].strip().strip('\"\'')
    if not key:
        raise SystemExit('DASHSCOPE_API_KEY is not configured')
    return key


def write_json(path, value):
    temp = path.with_name(path.name + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def request_json(endpoint, payload, key):
    request = urllib.request.Request(endpoint, data=json.dumps(payload).encode(),
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=100) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        try:
            code = json.load(error).get('code', 'HTTPError')
        except (ValueError, OSError):
            code = 'HTTPError'
        raise RuntimeError('HTTP ' + str(error.code) + ' ' + str(code)) from None
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError('Provider connection timed out or failed') from None


def probe(path):
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)]))
    pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
        '-f', 's16le', '-ac', '1', '-ar', '24000', '-'])
    samples = array.array('h', pcm)
    rms = math.sqrt(sum(x*x for x in samples) / max(1, len(samples))) / 32768
    peak = max((abs(x) for x in samples), default=0) / 32768
    if not .25 < duration < 14 or rms < .005 or peak > .995:
        raise RuntimeError('Invalid duration, silence or clipping')
    return {'duration': round(duration, 3), 'rms_dbfs': round(20*math.log10(rms), 2),
            'peak_dbfs': round(20*math.log10(peak), 2), 'sha256': sha(path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--raw-dir', type=Path, required=True)
    parser.add_argument('--lines', type=Path, default=Path(__file__).with_name('speech-lines.json'))
    parser.add_argument('--profiles', type=Path, default=Path(__file__).with_name('voice-profiles.json'))
    parser.add_argument('--only', help='Comma-separated clip IDs for a preview or repair')
    parser.add_argument('--workers', type=int, default=3, choices=range(1, 9))
    args = parser.parse_args()
    key = read_key(args.env_file)
    config = json.loads(args.profiles.read_text())
    if config['model'] != MODEL:
        raise SystemExit('This project uses ' + MODEL + '; update the policy explicitly before changing it')
    lines = json.loads(args.lines.read_text())
    if len({item['id'] for item in lines}) != len(lines):
        raise SystemExit('Duplicate clip ID')
    if args.only:
        wanted = set(args.only.split(','))
        if wanted - {item['id'] for item in lines}:
            raise SystemExit('Unknown clip ID in --only')
        lines = [item for item in lines if item['id'] in wanted]
    args.out.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    def generate(item):
        ident = item['id']
        if not re.fullmatch(r'[a-z0-9_]+', ident):
            raise RuntimeError('Invalid clip ID')
        profile = config['profiles'][item['voice_profile']]
        if profile.get('target_model') != MODEL or not profile.get('voice_id'):
            raise RuntimeError(ident + ': missing matching designed voice')
        instruction = item['instruction']
        if not instruction or sum(1 if ord(c) < 128 else 2 for c in instruction) > 100:
            raise RuntimeError(ident + ': instruction must be 1–100 weighted characters')
        payload = {'model': MODEL, 'input': {
            'text': item['text'], 'voice': profile['voice_id'], 'format': 'wav',
            'sample_rate': 24000, 'rate': item.get('rate', .94), 'pitch': 1.0,
            'volume': 50, 'language_hints': ['en'], 'instruction': instruction,
            'seed': item.get('seed', 2026)}}
        fingerprint = hashlib.sha256(json.dumps([payload, PROCESSING], sort_keys=True).encode()).hexdigest()
        target = args.out / (ident + '.mp3')
        raw = args.raw_dir / (ident + '.wav')
        meta = args.raw_dir / (ident + '.json')
        cached = json.loads(meta.read_text()) if meta.exists() else {}
        same = cached.get('fingerprint') == fingerprint
        raw_valid = same and raw.exists() and normalize_cached_wav(raw, meta, cached)
        if same and target.exists() and cached.get('sha256') == sha(target):
            return cached['clip']
        if not raw_valid:
            for attempt in range(4):
                try:
                    data = request_json(ENDPOINT, payload, key)
                    url = data.get('output', {}).get('audio', {}).get('url')
                    if not url:
                        raise RuntimeError('Provider returned no audio URL')
                    url = url.replace('http://', 'https://', 1)
                    try:
                        with urllib.request.urlopen(url, timeout=60) as response:
                            content = response.read(MAX_RAW_BYTES + 1)
                    except (urllib.error.URLError, TimeoutError):
                        raise RuntimeError('Audio download failed') from None
                    temp = raw.with_suffix('.part.wav')
                    temp.write_bytes(normalize_wav(content))
                    temp.replace(raw)
                    cached = {'fingerprint': fingerprint, 'raw_sha256': sha(raw)}
                    write_json(meta, cached)
                    break
                except RuntimeError:
                    if attempt == 3:
                        raise
                    print('Retry', ident, attempt + 1, flush=True)
                    time.sleep(2 ** attempt)
        temp = target.with_suffix('.part.mp3')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af',
            'loudnorm=I=-18:TP=-2:LRA=7', '-ar', '24000', '-ac', '1',
            '-codec:a', 'libmp3lame', '-b:a', '80k', str(temp)], check=True)
        measurements = probe(temp)
        temp.replace(target)
        clip = {**item, 'model': MODEL, 'voice': profile['voice_id'],
                'file': target.name, 'fingerprint': fingerprint, **measurements}
        write_json(meta, {**cached, 'sha256': clip['sha256'], 'clip': clip})
        return clip

    results, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(generate, item): item['id'] for item in lines}
        for future in concurrent.futures.as_completed(futures):
            ident = futures[future]
            try:
                clip = future.result()
                results.append(clip)
                print('Generated', ident, clip['duration'], flush=True)
            except Exception as error:
                failures.append(ident)
                # Deliberately omit arbitrary exception/provider text and signed URLs.
                print('FAILED', ident, type(error).__name__, flush=True)
    if failures:
        raise SystemExit('Failed clips (safe to rerun): ' + ', '.join(failures))
    order = {item['id']: i for i, item in enumerate(lines)}
    results.sort(key=lambda item: order[item['id']])
    manifest = {'provider': config['provider'], 'model': MODEL, 'language': 'English',
        'synthetic': True, 'processing': PROCESSING, 'clips': results}
    write_json(args.out / ('manifest.partial.json' if args.only else 'manifest.json'), manifest)
    print('COMPLETE', len(results), 'clips', sum((args.out/c['file']).stat().st_size for c in results), 'bytes', flush=True)


if __name__ == '__main__':
    main()
