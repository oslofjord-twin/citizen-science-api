To build the api: npm run build
To restart pm2 server: pm2 restart citizen-science-api

## Environment Configuration

**Development (local with MinIO):**
```bash
cp .env.development .env
docker run -d -p 9000:9000 -p 9001:9001 --name minio-dev \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```
Create bucket: http://localhost:9001 (login: minioadmin/minioadmin)

**Production (NREC):**
```bash
cp .env.production .env
# Fill in S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY from:
# openstack ec2 credentials create
```

## Secchi object storage uploads (S3)

This API supports direct-to-object-storage uploads via presigned URLs.

2) Request a presigned upload URL:

```bash
curl -X POST "$API_URL/api/secchi/uploads/request" \
	-H "Content-Type: application/json" \
	-H "Cookie: <your-auth-cookie>" \
	-d '{"contentType":"image/jpeg","sizeBytes":123456}'
```

3) Upload the file bytes directly to S3 using the returned `url` and `headers`.

4) Tell the API to verify the upload:

```bash
curl -X POST "$API_URL/api/secchi/uploads/complete" \
	-H "Content-Type: application/json" \
	-H "Cookie: <your-auth-cookie>" \
	-d '{"key":"secchi/raw/<user>/<yyyy>/<mm>/<uuid>.jpg"}'
```

