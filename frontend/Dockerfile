# Etapa de compilación
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa de ejecución con Nginx
FROM nginx:alpine
# Copiamos el build de Angular a la carpeta de Nginx
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Copiamos una configuración personalizada de Nginx para el proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
