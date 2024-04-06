'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('diasLaborales', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            dia: {
                type: Sequelize.INTEGER
            },

            esDescanso: {
                type: Sequelize.BOOLEAN
            },

            horaEntrada: {
                type: Sequelize.TIME
            },
            horaSalidaDescanso: {
                type: Sequelize.TIME
            },
            horaEntradaDescanso: {
                type: Sequelize.TIME
            },
            horaSalida: {
                type: Sequelize.TIME
            },

            fechaRegistroDia: {
                type: Sequelize.DATE
            },

            fechaModificacionDia: {
                type: Sequelize.DATE
            },

            idHorarioVinculada: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "horarios",
                    },
                    key: "id",
                },
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('diasLaborales');
    }
};