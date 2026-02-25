# ETAPA 1: BUILD
# Usamos Node 20 (Alpine = versión ligera de Linux)
# para instalar dependencias y compilar la app con Vite

FROM node:20-alpine AS builder

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero solo los manifiestos de dependencias

COPY package.json package-lock.json ./

# Instalamos TODAS las dependencias (devDependencies también,
# porque Vite y TailwindCSS las necesitamos para el build)
RUN npm ci

# Ahora copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto genera la carpeta /app/dist
RUN npm run build


# ETAPA 2: PRODUCCIÓN
# Usamos Nginx 
FROM nginx:stable-alpine AS production

# Copiamos los archivos compilados desde la etapa anterior
# hacia la carpeta donde Nginx sirve archivos por defecto
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Comando para arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
