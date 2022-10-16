#!/usr/bin/env python3

"""Utility to start local webserver for specified build name."""

import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, test
from pathlib import Path

import settings

parser = argparse.ArgumentParser(description=__doc__)

parser.add_argument('build', type=str, nargs='?',
                    help='Specify build name')
parser.add_argument('--port', default=8000, type=int,
                    help='Specify alternate port [default: %(default)s]')
args = parser.parse_args()

try:
    settings.load(args.build)
except ValueError as err:
    parser.error(err)

directory = os.fspath(Path(__file__).parent/ 'build')
if not os.path.isdir(directory):
    parser.error(f'Directory not found: {directory}')

handler_class = partial(SimpleHTTPRequestHandler, directory=directory)  # Python 3.7+
test(HandlerClass=handler_class, port=args.port, bind='localhost')
