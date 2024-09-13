'use strict';

const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('dispositivosIoT', [
            {
                descripcionDispositivo: 'Dispositivo para chequeo de personal',
                nombreDispositivo: 'checador',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 1,
                idTipoDispositivoVinculado: 1
            },

            {
                descripcionDispositivo: 'Dispositivo para operar montacargas',
                nombreDispositivo: 'montacargas',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },
            {
                descripcionDispositivo: 'Dispositivo para operar cortadora lazer',
                nombreDispositivo: 'cortadora laser',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },
            {
                descripcionDispositivo: 'Dispositivo para operar prensa hidraulica',
                nombreDispositivo: 'prensa hidraulica',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },
            {
                descripcionDispositivo: 'Dispositivo para operar CNC 1',
                nombreDispositivo: 'CNC 1',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },
            {
                descripcionDispositivo: 'Dispositivo para operar CNC 2',
                nombreDispositivo: 'CNC 2',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },
            {
                descripcionDispositivo: 'Dispositivo para operar CNC 3',
                nombreDispositivo: 'CNC 3',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 2,
                idTipoDispositivoVinculado: 3
            },

            {
                descripcionDispositivo: 'Dispositivo para abrir/cerrar puertas del baño de empleados',
                nombreDispositivo: 'puertas baño',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 3,
                idTipoDispositivoVinculado: 4
            },
            {
                descripcionDispositivo: 'Dispositivo para el acceso al baño de empleados',
                nombreDispositivo: 'lector entrada baño',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 3,
                idTipoDispositivoVinculado: 2
            },
            {
                descripcionDispositivo: 'Dispositivo para la salida del baño de empleados al area de trabajo',
                nombreDispositivo: 'lector salida baño',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 3,
                idTipoDispositivoVinculado: 2
            },

            {
                descripcionDispositivo: 'Dispositivo para abrir/cerrar puertas del comedor de empleados',
                nombreDispositivo: 'puertas comedor',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 4,
                idTipoDispositivoVinculado: 4
            },
            {
                descripcionDispositivo: 'Dispositivo para el acceso al comedor de empleados',
                nombreDispositivo: 'lector entrada comedor',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 4,
                idTipoDispositivoVinculado: 2
            },
            {
                descripcionDispositivo: 'Dispositivo para la salida del comedor de empleados al area de trabajo',
                nombreDispositivo: 'lector salida comedor',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 4,
                idTipoDispositivoVinculado: 2
            },

            {
                descripcionDispositivo: 'Dispositivo para abrir/cerrar puertas de las oficinas de ingenieria',
                nombreDispositivo: 'puertas oficinas',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 5,
                idTipoDispositivoVinculado: 4
            },
            {
                descripcionDispositivo: 'Dispositivo para el acceso a las oficinas de ingeniria',
                nombreDispositivo: 'lector entrada oficinas',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 5,
                idTipoDispositivoVinculado: 2
            },
            {
                descripcionDispositivo: 'Dispositivo para la salida de las oficinas de ingenieria al area de trabajo',
                nombreDispositivo: 'lector salida oficinas',
                fechaRegistroIoT: toSQLDate(new Date()),
                idZonaVinculada: 5,
                idTipoDispositivoVinculado: 2
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('dispositivosIoT', null, {});
    }
};
