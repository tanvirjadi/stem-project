# Minimal ESP32-CAM Home Security Backend

Private Node.js + Express backend for testing an ESP32-CAM home security system. Trusted faces are image files stored locally in `uploads/trusted`. PostgreSQL stores metadata only through Prisma.

## Setup

```bash
npm install
npm run prisma:generate
npm run db:push
npm run prisma:migrate
npm run download:models
```

Add trusted face images manually:

```text
uploads/trusted/dad.jpg
uploads/trusted/mom.jpg
uploads/trusted/uncle.jpg
```

Then sync them into PostgreSQL:

```bash
npm run sync:faces
```

Start the server:

```bash
npm run dev
```

## Environment

The app needs `DATABASE_URL` for Prisma:

```env
PORT=3000
DATABASE_URL="postgresql://postgre:this%20is%20a%20secret.@localhost:5432/Home%20Security%20System?schema=public"
FACE_MATCH_THRESHOLD=0.6
FACE_MODEL_PATH=./models
MAX_UPLOAD_BYTES=5242880
```

## Person status categories

Trusted faces now store a `status` category for later use. Valid values are:

- `ADULT`
- `CHILD`
- `HOMEOWNER`
- `VISITOR`
- `OTHER`

## Endpoints

Health:

```http
GET /health
```

Recognition:

```http
POST /recognize
Content-Type: multipart/form-data

image=<visitor image>
```

ESP32-friendly known response:

```json
{
  "known": true,
  "name": "Dad"
}
```

ESP32-friendly unknown response:

```json
{
  "known": false
}
```

No face:

```json
{
  "success": false,
  "message": "No face detected"
}
```

For laptop testing with confidence details:

```bash
curl -X POST "http://localhost:3000/recognize?verbose=true" -F "image=@visitor.jpg"
```

## Laptop Test

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/recognize -F "image=@C:\path\to\visitor.jpg"
```

No API exists for registering, updating, or deleting trusted faces. Add files to `uploads/trusted`, then run `npm run sync:faces`.
