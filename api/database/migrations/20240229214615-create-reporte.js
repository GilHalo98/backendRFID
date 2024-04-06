'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reportes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            descripcionReporte: {
                type: Sequelize.STRING
            },

            fechaRegistroReporte: {
                type: Sequelize.DATE
            },

            fechaModificacionReporte: {
                type: Sequelize.DATE
            },

            idTipoReporteVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "tiposReportes",
                    },
                    key: "id",
                },
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reportes');
    }
};