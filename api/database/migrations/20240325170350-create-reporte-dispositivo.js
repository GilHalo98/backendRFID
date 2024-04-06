'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reportesDispositivos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            fechaRegistroReporteDispositivo: {
                type: Sequelize.DATE
            },

            fechaModificacionReporteDispositivo: {
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
        await queryInterface.dropTable('reportesDispositivos');
    }
};