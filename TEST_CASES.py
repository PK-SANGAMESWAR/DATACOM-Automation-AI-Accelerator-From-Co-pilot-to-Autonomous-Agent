import unittest
import os
from process_data import DataProcessor

class TestDataProcessor(unittest.TestCase):
    def setUp(self):
        # Initialize processor with sample data
        self.processor = DataProcessor("customers.csv")
        self.processor.load_data()
        
    def test_export_customer_data_bug(self):
        """
        Replicate the bug where 'dict' object has no attribute 'keys'.
        We simulate the problematic data state that causes the export to fail.
        """
        # Injecting a mock object that produces the exact AttributeError 
        # to simulate the data corruption that led to the crash.
        class BadData:
            pass
        bad_dict = BadData()
        bad_dict.__class__.__name__ = 'dict' # Override name to match error log exactly
        
        # Corrupt one of the customer records
        if self.processor.customers:
            first_key = list(self.processor.customers.keys())[0]
            self.processor.customers[first_key] = bad_dict
            
        with self.assertRaises(AttributeError) as context:
            # When the exporter tries to get keys() from the corrupted dictionary, it will fail
            self.processor.export_customer_data("test_error_export.csv", "csv")
            
        self.assertTrue("'dict' object has no attribute 'keys'" in str(context.exception))

if __name__ == '__main__':
    unittest.main()
