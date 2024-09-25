'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reportesChequeos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            fechaRegistroReporteChequeo: {
                type: Sequelize.DATE
            },

            fechaModificacionReportChequeo: {
                type: Sequelize.DATE
            },

            idReporteVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "reportes",
                    },
                    key: "id",
                },
            },
            idEmpleadoVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "empleados",
                    },
                    key: "id",
                },
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reportesChequeos');
    }
};