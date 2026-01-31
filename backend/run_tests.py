#!/usr/bin/env python
"""Simple test runner script"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import pytest
    exit_code = pytest.main(["-v", "tests/"])
    sys.exit(exit_code)
