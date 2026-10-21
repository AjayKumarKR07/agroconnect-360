# syntax=docker/dockerfile:1

FROM python:3.11-slim AS python-deps
WORKDIR /opt/ml
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
COPY ml/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=5000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}"
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && ln -sf /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/ .
COPY --from=python-deps /opt/venv /opt/venv
COPY ml /app/ml

RUN mkdir -p /app/ml/models /app/ml/temp \
    && chown -R node:node /app /opt/venv
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD node -e "require('http').get('http://127.0.0.1:5000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
