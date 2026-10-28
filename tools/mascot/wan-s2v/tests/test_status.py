import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'remote'))
from status import sampling_progress, render


class StatusTests(unittest.TestCase):
    def test_duplicate_final_line_and_second_chunk(self):
        log = '20/20 [10:00<00:00, 30.00s/it]\r20/20 [10:00<00:00, 30.00s/it]\n0/20 [00:00<?, ?it/s]\r2/20 [01:00<09:00, 30.00s/it]'
        self.assertEqual(sampling_progress(log), {'chunk':2,'step':2,'total':20,'secondsPerStep':30.0})

    def test_loading_has_no_invented_eta(self):
        self.assertIsNone(sampling_progress('Loading model'))
        snapshot = {'now':160,'started':100,'status':'running','workerAlive':True,
                    'comfyLog':'','models':[{'bytes':10,'total':20,'verified':False}],
                    'dependenciesReady':True,'inferenceStarted':None,'gpu':'30 MiB, 0 %'}
        result=render(snapshot,hourly_rate=3600)
        self.assertIn('00:01:00',result)
        self.assertIn('chưa thể ước tính',result)
        self.assertIn('~60.00',result)

    def test_steps_per_second(self):
        result=sampling_progress('2/20 [00:01<00:09, 2.00it/s]')
        self.assertEqual(result['secondsPerStep'],0.5)


if __name__ == '__main__':
    unittest.main()
