#!/bin/sh
set -eu

# This hook is run by the official MySQL image only for a brand-new data
# directory.  The dump intentionally has no USE statement, so select the
# configured database explicitly.  Credentials stay in Docker environment
# variables and are never stored in this script.
mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  --database="${MYSQL_DATABASE}" \
  < /docker-entrypoint-initdb.d/10-student-rental.dump
