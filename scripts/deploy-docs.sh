#!/usr/bin/env bash
#
# Publish docs/ to S3 behind CloudFront.
#
# Reads its target from the environment so no account id, bucket name or
# distribution id is ever committed:
#
#   export DOCS_BUCKET=my-docs-bucket
#   export DOCS_DISTRIBUTION=E1234567890ABC     # optional
#   export AWS_PROFILE=docs                     # optional
#   ./scripts/deploy-docs.sh
#
# Requires the AWS CLI, already authenticated.

set -euo pipefail

: "${DOCS_BUCKET:?set DOCS_BUCKET to the target S3 bucket}"
DIST="${DOCS_DISTRIBUTION:-}"
DOCS_DIR="$(cd "$(dirname "$0")/.." && pwd)/docs"

[ -f "$DOCS_DIR/index.html" ] || { echo "no docs/index.html at $DOCS_DIR" >&2; exit 1; }

echo "account : $(aws sts get-caller-identity --query Account --output text)"
echo "bucket  : s3://$DOCS_BUCKET"

# Images are content-addressed by nothing, so keep their cache short enough that
# a corrected screenshot actually reaches people, and never cache the HTML:
# a stale index.html is how documentation quietly describes an older version.
aws s3 sync "$DOCS_DIR" "s3://$DOCS_BUCKET" --delete \
  --exclude "*.html" \
  --cache-control "public,max-age=86400"

aws s3 sync "$DOCS_DIR" "s3://$DOCS_BUCKET" --delete \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8"

if [ -n "$DIST" ]; then
  id=$(aws cloudfront create-invalidation --distribution-id "$DIST" \
        --paths '/*' --query 'Invalidation.Id' --output text)
  echo "invalidation: $id"
else
  echo "no DOCS_DISTRIBUTION set; skipping CloudFront invalidation"
fi

echo "done"
