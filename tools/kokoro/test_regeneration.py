import contextlib
import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import generate_audio as generator


class RegenerationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name)
        self.calls = []
        self.fail_on = None
        self.video = {
            'scriptVersion': 'v1', 'approval': {'status': 'approved', 'approvedScriptVersion': 'v1'},
            'audio': {'voice': {'voice': 'af_heart', 'speed': 1}},
            'scenes': [{'id': 'hook', 'narration': 'Hello world.'}, {'id': 'payoff', 'narration': 'Clear ideas.'}],
        }

    def pipeline(self, text, **kwargs):
        self.calls.append(text)
        if text == self.fail_on:
            raise RuntimeError('Synthesis failed')
        words = text.split()
        yield SimpleNamespace(audio=np.sin(np.arange(24000) * 0.05) * 0.1,
                              tokens=[SimpleNamespace(text=w, start_ts=i * 0.3, end_ts=(i + 1) * 0.3) for i, w in enumerate(words)])

    def run_generator(self, *args):
        (self.project / 'video.json').write_text(json.dumps(self.video))
        factory = SimpleNamespace(KPipeline=lambda **kwargs: self.pipeline)
        with patch.dict(sys.modules, {'kokoro': factory}), patch.object(generator, 'package_version', return_value='test'), patch.object(sys, 'argv', ['generate_audio', '--project', str(self.project), *args]), contextlib.redirect_stdout(io.StringIO()):
            generator.main()

    def hashes(self):
        return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (self.project / 'voice').iterdir()}

    def test_noop_keeps_wavs_timings_and_manifest_bytes(self):
        self.run_generator()
        (self.project / 'voice/notes.txt').write_text('Retain unrelated voice notes.')
        before = self.hashes()
        self.run_generator()
        self.assertEqual(self.calls, ['Hello world.', 'Clear ideas.'])
        self.assertEqual(self.hashes(), before)

    def test_one_text_change_regenerates_one_scene(self):
        self.run_generator()
        before = self.hashes()
        self.video['scenes'][0]['narration'] = 'Fresh hook.'
        self.run_generator()
        self.assertEqual(self.calls[-1], 'Fresh hook.')
        self.assertEqual(len(self.calls), 3)
        self.assertEqual(before['payoff.wav'], self.hashes()['payoff.wav'])

    def test_speed_change_and_force_invalidate_all(self):
        self.run_generator()
        self.video['audio']['voice']['speed'] = 1.1
        self.run_generator()
        self.assertEqual(len(self.calls), 4)
        self.run_generator('--force')
        self.assertEqual(len(self.calls), 6)

    def test_corrupt_wav_regenerates_only_that_scene(self):
        self.run_generator()
        (self.project / 'voice/hook.wav').write_bytes(b'broken')
        self.run_generator()
        self.assertEqual(self.calls, ['Hello world.', 'Clear ideas.', 'Hello world.'])

    def test_failure_after_first_synthesis_preserves_entire_previous_set(self):
        self.run_generator()
        before = self.hashes()
        self.fail_on = 'Clear ideas.'
        with self.assertRaisesRegex(RuntimeError, 'Synthesis failed'):
            self.run_generator('--force')
        self.assertEqual(self.hashes(), before)

    def test_generator_version_and_bad_captions_invalidate_cache(self):
        self.run_generator()
        manifest_path = self.project / 'voice/manifest.json'
        manifest = json.loads(manifest_path.read_text())
        manifest['scenes'][0]['captions'][0]['text'] = 'Missing words'
        manifest_path.write_text(json.dumps(manifest))
        self.run_generator()
        self.assertEqual(len(self.calls), 3)
        manifest = json.loads(manifest_path.read_text())
        manifest['generatorVersion'] = 'old'
        manifest_path.write_text(json.dumps(manifest))
        self.run_generator()
        self.assertEqual(len(self.calls), 5)

    def test_failed_directory_install_restores_previous_voice_set(self):
        self.run_generator()
        before = self.hashes()
        replace = generator.os.replace

        def fail_install(source, target):
            if Path(source).name == 'voice' and Path(target).resolve() == (self.project / 'voice').resolve():
                raise OSError('Simulated install failure')
            return replace(source, target)

        with patch.object(generator.os, 'replace', side_effect=fail_install):
            with self.assertRaisesRegex(OSError, 'Simulated install failure'):
                self.run_generator('--force')
        self.assertEqual(self.hashes(), before)


if __name__ == '__main__':
    unittest.main()
