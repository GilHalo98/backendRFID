'use strict';

const { toSQLDate } = require("../../utils/utils");
const fecha = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('tiposReportes', [
            {
                nombreTipoReporte: 'Acceso garantizado',
                descripcionTipoReporte: 'Reporte de acceso a zona garantizado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Acceso negado',
                descripcionTipoReporte: 'Reporte de acceso a zona negado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Tarjeta invalida',
                descripcionTipoReporte: 'Reporte de ingreso de tarjeta invalida',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Datos de tarjeta inexistentes',
                descripcionTipoReporte: 'Reporte de datos de tarjeta no coinciden con el registro',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Credenciales de tarjeta invalidos',
                descripcionTipoReporte: 'Reporte de credenciales de tarjeta invalidos',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Dispositivo activado',
                descripcionTipoReporte: 'Reporte de dispositivo activado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Dispositivo pausado',
                descripcionTipoReporte: 'Reporte de dispositivo pausado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Chequeo de entrada',
                descripcionTipoReporte: 'Chequeo de entrada de empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de entrada con retraso',
                descripcionTipoReporte: 'Chequeo de entrada de empleado con retraso',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de salida',
                descripcionTipoReporte: 'Chequeo de salida de empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de salida con extras',
                descripcionTipoReporte: 'Chequeo de salida de empleado con horas extras',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Actividad iniciada',
                descripcionTipoReporte: 'Actividad inciada por empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Actividad finalizada',
                descripcionTipoReporte: 'Actividad finalizada por empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Credenciales invalidas para actividad',
                descripcionTipoReporte: 'Credenciales de empleado invalidas para el inicio de actividad ',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
        ], {});
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('tiposReportes', null, {});
    }
};
