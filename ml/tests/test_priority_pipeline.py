import unittest

from scripts.feature_engineering import assign_priority_label, compute_priority_score
from scripts.hotspot_clustering import hotspot_risk_level


class PriorityPipelineTests(unittest.TestCase):
    def test_assign_priority_label_thresholds(self):
        self.assertEqual(assign_priority_label(0.75), 2)
        self.assertEqual(assign_priority_label(0.55), 1)
        self.assertEqual(assign_priority_label(0.25), 0)

    def test_compute_priority_score_respects_severity_status_and_density(self):
        high_severity = compute_priority_score(1.0, 1.0, 1.0)
        medium_severity = compute_priority_score(0.6, 0.5, 0.4)
        low_severity = compute_priority_score(0.2, 0.0, 0.0)

        self.assertGreater(high_severity, 0.7)
        self.assertGreater(medium_severity, 0.3)
        self.assertLess(low_severity, 0.4)

    def test_compute_priority_score_is_clamped_to_normalized_range(self):
        self.assertEqual(compute_priority_score(4.0, 4.0, 4.0), 1.0)
        self.assertEqual(compute_priority_score(-1.0, -1.0, -1.0), 0.0)

    def test_hotspot_risk_level_thresholds(self):
        self.assertEqual(hotspot_risk_level(0.5), "HIGH")
        self.assertEqual(hotspot_risk_level(0.3), "MEDIUM")
        self.assertEqual(hotspot_risk_level(0.29), "LOW")


if __name__ == "__main__":
    unittest.main()
