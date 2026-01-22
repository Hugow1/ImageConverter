# Image Converter

A lightweight, high-performance image conversion and optimization microservice built with Node.js and Sharp.

## Features

- Convert images between JPEG, PNG, WebP, and AVIF formats
- Resize images with configurable fitting strategies
- Adjust quality and compression settings
- Automatic EXIF-based rotation
- In-memory processing for fast throughput
- Docker-ready deployment

## Quick Start

### Using Docker Compose (recommended)

```bash
docker compose up -d
```

### Using Docker

```bash
docker build -t image-converter .
docker run -p 3000:3000 image-converter
```

### Running locally

```bash
npm install
node server.js
```

The service runs on port 3000 by default. Set the `PORT` environment variable to change it.

## API

### Health Check

```
GET /health
```

Returns `{"ok": true}` when the service is running.

### Convert Image

```
POST /convert
```

Converts and optionally resizes an image.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Max file size: 10MB
- Allowed input formats: JPEG, PNG, WebP, AVIF

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `webp` | Output format: `webp`, `jpeg`, `png`, `avif` |
| `quality` | int | `80` | Compression quality (1-100) |
| `lossless` | bool | `false` | Enable lossless encoding (WebP only) |
| `width` | int | - | Target width in pixels (1-10000) |
| `height` | int | - | Target height in pixels (1-10000) |
| `fit` | string | `cover` | Resize strategy: `cover`, `contain`, `fill`, `inside`, `outside` |

**Response:**
- Body: Binary image data
- `Content-Type`: Output image MIME type
- `X-Original-Bytes`: Original file size
- `X-Output-Bytes`: Converted file size

**Error Responses:**
- `400`: Missing file or unsupported format
- `422`: Image processing error

## Examples

Convert to WebP with default settings:

```bash
curl -F "file=@photo.jpg" "http://localhost:3000/convert" -o photo.webp
```

Convert to AVIF at 60% quality:

```bash
curl -F "file=@photo.png" "http://localhost:3000/convert?format=avif&quality=60" -o photo.avif
```

Resize to 800px width, maintaining aspect ratio:

```bash
curl -F "file=@photo.jpg" "http://localhost:3000/convert?width=800" -o resized.webp
```

Create a thumbnail with cover fit:

```bash
curl -F "file=@photo.jpg" "http://localhost:3000/convert?width=200&height=200&fit=cover" -o thumb.webp
```

## Resize Fit Options

| Option | Description |
|--------|-------------|
| `cover` | Crop to fill dimensions (default) |
| `contain` | Fit within dimensions, preserving aspect ratio |
| `fill` | Stretch to fill dimensions |
| `inside` | Resize to fit inside dimensions |
| `outside` | Resize to cover dimensions |

## Tech Stack

- [Express](https://expressjs.com/) - Web framework
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [Multer](https://github.com/expressjs/multer) - File upload handling
