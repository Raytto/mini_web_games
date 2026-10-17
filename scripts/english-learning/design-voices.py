#!/usr/bin/env python3
"""Create missing CosyVoice 3.5 Plus text-designed voices from saved briefs.

Existing voice IDs are retained. To redesign one voice, remove that profile's
voice_id/target_model deliberately, then run this before generate-speech.py.
"""
import argparse
import base64
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('speech_generator', Path(__file__).with_name('generate-speech.py'))
speech = importlib.util.module_from_spec(spec)
spec.loader.exec_module(speech)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', type=Path)
    parser.add_argument('--profiles', type=Path, default=Path(__file__).with_name('voice-profiles.json'))
    parser.add_argument('--preview-dir', type=Path, required=True)
    args = parser.parse_args()
    config = json.loads(args.profiles.read_text())
    if config['model'] != speech.MODEL:
        raise SystemExit('Project voice model must be ' + speech.MODEL)
    key = speech.read_key(args.env_file)
    args.preview_dir.mkdir(parents=True, exist_ok=True)
    for role, profile in config['profiles'].items():
        if profile.get('voice_id'):
            if profile.get('target_model') != speech.MODEL:
                raise SystemExit('Voice model mismatch for ' + role)
            print('Reusing voice profile', role, flush=True)
            continue
        payload = {'model': 'voice-enrollment', 'input': {
            'action': 'create_voice', 'target_model': speech.MODEL,
            'voice_prompt': profile['voice_prompt'], 'preview_text': profile['preview_text'],
            'prefix': profile['prefix'], 'language_hints': ['en']},
            'parameters': {'sample_rate': 24000, 'response_format': 'wav'}}
        output = speech.request_json('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', payload, key)['output']
        profile.update(voice_id=output['voice_id'], target_model=output.get('target_model', speech.MODEL))
        # Persist the ID immediately to avoid buying a duplicate voice after an interruption.
        speech.write_json(args.profiles, config)
        preview = output.get('preview_audio', {}).get('data')
        if preview:
            (args.preview_dir / (role + '-preview.wav')).write_bytes(base64.b64decode(preview))
        print('Created voice profile', role, flush=True)

if __name__ == '__main__':
    main()
