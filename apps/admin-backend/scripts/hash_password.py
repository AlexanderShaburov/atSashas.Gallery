#!/usr/bin/env python3
"""CLI script to generate password hashes for users.json"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.auth.security import get_password_hash


def main():
    """Generate password hash from command line."""
    if len(sys.argv) < 2:
        print('Usage: python hash_password.py <password>')
        print('Example: python hash_password.py mySecurePassword123')
        sys.exit(1)

    password = sys.argv[1]
    hashed = get_password_hash(password)
    print(f'\nPassword: {password}')
    print(f'Hash: {hashed}')
    print('\nCopy the hash to users.json')


if __name__ == '__main__':
    main()
