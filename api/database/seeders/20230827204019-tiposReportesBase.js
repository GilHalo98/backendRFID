'use strict';

const { toSQLDate } = require("../../utils/utils");
const fecha = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('tiposReportes', [
            {
                nombreTipoReporte: 'Acceso garantizado',
                tagTipoReporte: 'accesoGarantizado',
                descripcionTipoReporte: 'Reporte de acceso a zona garantizado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Acceso negado',
                tagTipoReporte: 'accesoNegado',
                descripcionTipoReporte: 'Reporte de acceso a zona negado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Salida de zona',
                tagTipoReporte: 'salidaZona',
                descripcionTipoReporte: 'Reporte de salida de zona',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Tarjeta invalida',
                tagTipoReporte: 'tarjetaInvalida',
                descripcionTipoReporte: 'Reporte de ingreso de tarjeta invalida',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Datos de tarjeta inexistentes',
                tagTipoReporte: 'registroInexistente',
                descripcionTipoReporte: 'Reporte de datos de tarjeta no coinciden con el registro',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Credenciales de tarjeta invalidos',
                tagTipoReporte: 'credencialesInvalidas',
                descripcionTipoReporte: 'Reporte de credenciales de tarjeta invalidos',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Dispositivo activado',
                tagTipoReporte: 'dispositivoActivado',
                descripcionTipoReporte: 'Reporte de dispositivo activado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Dispositivo pausado',
                tagTipoReporte: 'dispositivoPausado',
                descripcionTipoReporte: 'Reporte de dispositivo pausado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Actividad iniciada',
                tagTipoReporte: 'actividadIniciada',
                descripcionTipoReporte: 'Actividad inciada por empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Actividad finalizada',
                tagTipoReporte: 'actividadFinalizada',
                descripcionTipoReporte: 'Actividad finalizada por empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Credenciales invalidas para actividad',
                tagTipoReporte: 'credencialesInvalidasActividad',
                descripcionTipoReporte: 'Credenciales de empleado invalidas para el inicio de actividad ',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Chequeo de entrada',
                tagTipoReporte: 'chequeoEntrada',
                descripcionTipoReporte: 'Chequeo de entrada de empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de entrada con retraso',
                tagTipoReporte: 'chequeoEntradaRetraso',
                descripcionTipoReporte: 'Chequeo de entrada de empleado con retraso',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de salida',
                tagTipoReporte: 'chequeoSalida',
                descripcionTipoReporte: 'Chequeo de salida de empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de salida con extras',
                tagTipoReporte: 'chequeoSalidaExtras',
                descripcionTipoReporte: 'Chequeo de salida de empleado con horas extras',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },

            {
                nombreTipoReporte: 'Chequeo de inicio de descanso',
                tagTipoReporte: 'chequeoInicioDescanso',
                descripcionTipoReporte: 'Chequeo de inicio de descanso del empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
            {
                nombreTipoReporte: 'Chequeo de fin de descanso',
                tagTipoReporte: 'chequeoFinDescanso',
                descripcionTipoReporte: 'Chequeo de fin de descanso del empleado',
                fechaRegistroTipoReporte: toSQLDate(fecha),
            },
        ], {});
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('tiposReportes', null, {});
    }
};
