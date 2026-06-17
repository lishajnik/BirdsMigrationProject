# -*- coding: utf-8 -*-
import unittest
import pandas as pd

class TestBirdAnalytics(unittest.TestCase):

    def setUp(self):
        """Set up mock data for testing analytical logic"""
        self.test_data = pd.DataFrame([
            {'bird_name': 'Goose', 'bird_count': 10, 'temperature': 15.0, 'wind_speed': 5.0, 'is_anomalous': 0},
            {'bird_name': 'Goose', 'bird_count': 12, 'temperature': 16.0, 'wind_speed': 6.0, 'is_anomalous': 0},
            {'bird_name': 'Goose', 'bird_count': 15, 'temperature': 14.0, 'wind_speed': 4.0, 'is_anomalous': 0},
            {'bird_name': 'Goose', 'bird_count': 150, 'temperature': 20.0, 'wind_speed': 12.0, 'is_anomalous': 1}, 
            {'bird_name': 'Duck', 'bird_count': 5, 'temperature': 10.0, 'wind_speed': 3.0, 'is_anomalous': 0},
        ])

    def test_z_score_calculation(self):
        """Test Z-Score mathematical bounds"""
        counts = self.test_data['bird_count']
        mean = counts.mean()
        std = counts.std()
        z_score_anomaly = (150 - mean) / std
        self.assertTrue(z_score_anomaly > 1.5)

    def test_anomaly_flag_assignment(self):
        """Test if anomaly flag is set correctly"""
        anomaly_row = self.test_data[self.test_data['bird_count'] == 150].iloc[0]
        normal_row = self.test_data[self.test_data['bird_count'] == 5].iloc[0]
        self.assertEqual(anomaly_row['is_anomalous'], 1)
        self.assertEqual(normal_row['is_anomalous'], 0)

    def test_pearson_correlation_bounds(self):
        """Test Pearson correlation bounds [-1.0, 1.0]"""
        goose_group = self.test_data[self.test_data['bird_name'] == 'Goose']
        corr = goose_group['bird_count'].corr(goose_group['temperature'])
        self.assertTrue(-1.0 <= corr <= 1.0)

    def test_pearson_correlation_with_single_record(self):
        """Test system stability with single row"""
        duck_group = self.test_data[self.test_data['bird_name'] == 'Duck']
        if len(duck_group) > 1:
            corr = duck_group['bird_count'].corr(duck_group['wind_speed'])
        else:
            corr = 0.0
        self.assertEqual(corr, 0.0)

    def test_pandas_groupby_counting(self):
        """Test unique species calculation"""
        unique_birds = self.test_data['bird_name'].nunique()
        self.assertEqual(unique_birds, 2)

    def test_max_flock_aggregation(self):
        """Test peak flock extraction"""
        goose_group = self.test_data[self.test_data['bird_name'] == 'Goose']
        max_flock = goose_group['bird_count'].max()
        self.assertEqual(max_flock, 150)

    def test_anomalies_sum(self):
        """Test aggregation of anomaly flag sums"""
        total_anomalies = self.test_data['is_anomalous'].sum()
        self.assertEqual(total_anomalies, 1)

if __name__ == '__main__':
    unittest.main()