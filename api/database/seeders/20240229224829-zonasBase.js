'use strict';

const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('zonas', [
            {
                nombreZona: 'Entrada',
                descripcionZona: 'Zona de entrada del personal de trabajo',
                bitZona: 1,
                fechaRegistroZona: toSQLDate(new Date())
            },

            {
                nombreZona: 'Taller',
                descripcionZona: 'Area de trabajo de los empleados',
                bitZona: 2,
                fechaRegistroZona: toSQLDate(new Date())
            },

            {
                nombreZona: 'Baño',
                descripcionZona: 'Baño para el personal de trabajo',
                bitZona: 4,
                fechaRegistroZona: toSQLDate(new Date())
            },

            {
                nombreZona: 'Comedor',
                descripcionZona: 'Comedor del personal de trabajo',
                bitZona: 8,
                fechaRegistroZona: toSQLDate(new Date())
            },

            {
                nombreZona: 'Oficinas Ing.',
                descripcionZona: 'Oficinas de ingenieria',
                bitZona: 16,
                fechaRegistroZona: toSQLDate(new Date())
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('zonas', null, {});
    }
};
