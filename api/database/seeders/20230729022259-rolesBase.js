'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('roles', [
            {
                rolTrabajador: 'Invalido',
                descripcionRol: 'Rol de registros invalidos',
                bitRol: 1,
                fechaRegistroRol: toSQLDate(new Date()),
                idPermisoVinculado: 1
            },
            {
                rolTrabajador: 'Admon',
                descripcionRol: 'Administrador de sistemas',
                bitRol: 2,
                fechaRegistroRol: toSQLDate(new Date()),
                idPermisoVinculado: 2
            },
            {
                rolTrabajador: 'Ingeniero',
                descripcionRol: 'Ingeniero de diseño',
                bitRol: 4,
                fechaRegistroRol: toSQLDate(new Date()),
                idPermisoVinculado: 3
            },
            {
                rolTrabajador: 'Controlero',
                descripcionRol: 'Técnico en control industrial',
                bitRol: 8,
                fechaRegistroRol: toSQLDate(new Date()),
                idPermisoVinculado: 4
            },
            {
                rolTrabajador: 'Ensamblador',
                descripcionRol: 'Ensamblador de maquinas',
                bitRol: 16,
                fechaRegistroRol: toSQLDate(new Date()),
                idPermisoVinculado: 5
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('roles', null, {});
    }
};
