'use strict';

const { toSQLDate } = require("../../utils/utils");

/** @type {import('sequelize-cli').Migration} */

function generarSemanasLaborales(cantidadUsuarios) {
    // Genera una lista de usuarios con los datos aleatorios
    let horarios = [];
    for(let i = 1; i <= cantidadUsuarios; i++) {
        horarios.push(
            {
                descripcionHorario: "Registro de horario de " + i.toString(),
                tolerancia: "00:15:00",
                idEmpleadoVinculado: i,
            }
        );
    }

    return horarios;
};

function generarDiasLaborales(cantidadUsuarios) {
    // Genera una lista de usuarios con los datos aleatorios
    let horario = [];
    for(let i = 1; i <= cantidadUsuarios; i++) {
        for(let j = 0; j < 7; j++) {
            horario.push(
                {
                    dia: j,
                    esDescanso: "0",
                    horaEntrada: "09:00:00",
                    horaEntradaDescanso: "13:00:00",
                    horaSalidaDescanso: "14:00:00",
                    horaSalida: "18:00:00",
                    idHorarioVinculad0: i
                }
            );
        }
    }

    return horario;
};

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('horarios', [
            ...generarSemanasLaborales(102)
        ], {});

        await queryInterface.bulkInsert('diasLaborales', [
            ...generarDiasLaborales(102)
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('diasLaborales', null, {});
        await queryInterface.bulkDelete('horarios', null, {});
    }
};
