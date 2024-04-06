'use strict';

const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('tiposDispositivos', [
            {
                nombreTipoDispositivo: 'Checador',
                descripcionTipoDispositivo: 'Dispositivo para el control de chequeo de empelados',
                fechaRegistroTipoDispositivo: toSQLDate(new Date()),
            },

            {
                nombreTipoDispositivo: 'Lector',
                descripcionTipoDispositivo: 'Dispositivo para la lectura de sistemas RFID',
                fechaRegistroTipoDispositivo: toSQLDate(new Date()),
            },

            {
                nombreTipoDispositivo: 'Controlador',
                descripcionTipoDispositivo: 'Dispositivo para el control de maquinaria, montacargas, etc.',
                fechaRegistroTipoDispositivo: toSQLDate(new Date()),
            },

            {
                nombreTipoDispositivo: 'Controlador Puertas',
                descripcionTipoDispositivo: 'Dispositivo para el control de puertas.',
                fechaRegistroTipoDispositivo: toSQLDate(new Date()),
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('tiposDispositivos', null, {});
    }
};
