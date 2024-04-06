'use strict';

/**
 * Los permisos son representados por un numero decimal de 1 byte
 * para esto, cada bit representa una zona la que se le puede dar acceso al permiso.
 * | libre   | libre | libre | Oficinas Ing.     | Comedor         | Baño  | Taller | Entrada |
 * |       0 |     0 |    0  |                 1 |               1 |     1 |      1 |       1 |
 * |       0 |     0 |    0  |                 1 |               1 |     1 |      1 |       1 |
 * |       0 |     0 |    0  |                 0 |               1 |     1 |      1 |       1 |
*/

const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('permisos', [
            {
                descripcionPermiso: 'Permisos de acceso para Roles invalidos',
                autorizacion: 0,
                fechaRegistroPermiso: toSQLDate(new Date()),
            },
            {
                descripcionPermiso: 'Permisos de acceso para Admon',
                autorizacion: 255,
                fechaRegistroPermiso: toSQLDate(new Date()),
            },
            {
                descripcionPermiso: 'Permisos de acceso para Ingeniero',
                autorizacion: 31,
                fechaRegistroPermiso: toSQLDate(new Date()),
            },
            {
                descripcionPermiso: 'Permisos de acceso para Controlero',
                autorizacion: 31,
                fechaRegistroPermiso: toSQLDate(new Date()),
            },
            {
                descripcionPermiso: 'Permisos de acceso para Ensamblador',
                autorizacion: 15,
                fechaRegistroPermiso: toSQLDate(new Date()),
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('permisos', null, {});
    }
};
