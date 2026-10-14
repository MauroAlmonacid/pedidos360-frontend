# ETAPA 1: Taller de compilación con Node 20
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copiamos los paquetes de dependencias primero para aprovechar caché
COPY package*.json ./
RUN npm install

# 2. Copiamos todo el código fuente del proyecto
COPY . .

# 3. Compilamos para producción y dejamos los archivos listos en una carpeta temporal
RUN npm run build && \
    if [ -d "dist/pedidos360-frontend/browser" ]; then \
      cp -r dist/pedidos360-frontend/browser /app/salida-dist; \
    else \
      cp -r dist/pedidos360-frontend /app/salida-dist; \
    fi

# ETAPA 2: Servidor web de entrega ultraligero (Nginx)
FROM nginx:alpine

# 4. Copiamos la configuración de Nginx que creamos en el archivo anterior
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 5. Copiamos los archivos estáticos desde la etapa de compilación
COPY --from=build /app/salida-dist /usr/share/nginx/html

# Exponemos el puerto 80 hacia el exterior
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]