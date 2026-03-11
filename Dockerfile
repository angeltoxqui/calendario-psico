# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# 1. Copiar solo los manifiestos para cachear dependencias
COPY package.json package-lock.json ./

# 2. Instalar solo dependencias de producción + devDeps necesarias para build
#    --ignore-scripts evita scripts postinstall innecesarios
RUN npm ci --ignore-scripts

# 3. Copiar el resto del código fuente
COPY . .

# 4. Generar el bundle estático optimizado
RUN npm run build

# ── Stage 2: Servir con Nginx ultra-ligero ──────────────────
FROM nginx:stable-alpine AS production

# Eliminar la config por defecto y copiar solo lo necesario
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

# Config de nginx para SPA (react-router-dom)
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Compresión gzip\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;\n\
    gzip_min_length 256;\n\
\n\
    # Cache agresivo para assets con hash (inmutables)\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # SPA fallback: todas las rutas caen a index.html\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
