'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('horarios', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            descripcionHorario: {
                type: Sequelize.STRING
            },
            tolerancia: {
                type: Sequelize.TIME
            },

            fechaRegistroHorario: {
                type: Sequelize.DATE
            },

            fechaModificacionHorario: {
                type: Sequelize.DATE
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
        await queryInterface.dropTable('horarios');
    }
};