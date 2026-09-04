# Hosting the docs on a fresh AWS account

Everything here is one-time setup you run yourself — an AWS account needs your
payment details and identity, and no script can create one for you.

Region: `ap-southeast-2` (Sydney) throughout, so latency is sane from Melbourne.

## 1. The account

Create the account, then **before anything else**:

- Turn on MFA for the root user.
- Create an IAM user for day-to-day work and stop using root.
- Set a **zero-spend budget alert** under Billing → Budgets. Free tier is twelve
  months; a forgotten distribution after that bills quietly.

## 2. Bucket

```bash
aws s3api create-bucket --bucket YOUR-DOCS-BUCKET \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

# Keep it private. CloudFront reaches it through an Origin Access Control;
# a public bucket means the S3 URL bypasses CloudFront entirely.
aws s3api put-public-access-block --bucket YOUR-DOCS-BUCKET \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

## 3. CloudFront

```bash
aws cloudfront create-origin-access-control --origin-access-control-config \
  'Name=docs-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3'
```

Then create a distribution with:

- Origin: `YOUR-DOCS-BUCKET.s3.ap-southeast-2.amazonaws.com` — the **REST**
  endpoint, not the website endpoint, or the OAC will not apply.
- The OAC id from above.
- `DefaultRootObject: index.html`
- Viewer protocol policy: redirect HTTP to HTTPS.

Finally attach the generated bucket policy allowing `cloudfront.amazonaws.com`
`s3:GetObject`, restricted by `AWS:SourceArn` to that distribution.

## 4. Deploy

```bash
export DOCS_BUCKET=YOUR-DOCS-BUCKET
export DOCS_DISTRIBUTION=EXXXXXXXXXXXXX
./scripts/deploy-docs.sh
```

The script uploads HTML with `no-cache` and assets with a one-day cache. That
split matters: a cached `index.html` means the documentation silently describes
an older version of the library than the one people install.

## 5. Verify

```bash
D=xxxxxxxxxxxx.cloudfront.net
curl -sI "https://$D/" | head -1                    # expect 200
curl -sI "https://YOUR-DOCS-BUCKET.s3.ap-southeast-2.amazonaws.com/index.html" | head -1
                                                     # expect 403 — if this is
                                                     # 200 the bucket is public
                                                     # and CloudFront is decorative
```

## What this costs

Nothing for twelve months at this traffic. After that, a docs page of a few
hundred kilobytes serving light traffic is cents per month — but it is not zero,
and the budget alert in step 1 is what tells you.

GitHub Pages would host the same directory free permanently with none of the
above. This path is worth it if you want the AWS practice; it is not worth it
for the page alone.
