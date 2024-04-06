'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reportesActividades', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            fechaRegistroReporteActividad: {
                type: Sequelize.DATE
            },

            fechaModificacionReporteActividad: {
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
            },
            idDispositivoVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "dispositivosIoT",
                    },
                    key: "id",
                },
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reportesActividades');
    }
};