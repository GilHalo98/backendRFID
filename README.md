# proyectoRFID
backend del proyecto de acceso a zonas por RFID

Modelo de la DB

Descargar npm
Descargar xammp

Una vez descargado esto, ingresar en la consola en el directorio del proyecto lo siguiente:

npm install -g sequelize-cli
npm install

Ahora ejecutamos xammp, abrimos los servicios de mysql y php

Despues de esto creamos una base de datos llamada pdm y creamos un archivo .env con los siguientes parametros:

DB_DATABASE=PDM
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_DIALECT=mysql
DB_PORT=3306

PORT=3001
HOST=localhost

Secret=secret

API_URL=/api/

BASE_DIR=Directorio absoluto al proyecto

MAIL_DIR=
MAIL_PASS=

una vez creada la base de datos y el archivo .env ejecutamos los siguientes comandos

npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

y para ejecutar el servidor del backend se ejecuta el comando
npm start

---
## Control de Versiónes.

| Versión | Descripción |
| :-----: | :---------: |
| 0.1.0   | Primera versión de salida estable |
| 0.1.1   | Se agrego la importacion estatica de los controladores de los endpoints |
| 0.1.2   | Se cambiaron los controladores de registro de empleados completos |
