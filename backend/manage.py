#!/usr/bin/env python
"""Django's command-line utility for administrative."""
import os
import sys


def main():
    """Set up Django environment and execute management commands."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # The virtual environment must have been created with the
        # "site-packages" directory available for imports.
        raise exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()