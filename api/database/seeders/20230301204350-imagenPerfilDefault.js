'use strict';

const fs = require('fs');
const { toSQLDate } = require("../../utils/utils");
const imagenDefault = fs.readFileSync(
    process.env.RECURSOS_DIR + '/imagenPerfilDefault.png'
)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('recursos', [
            {
                tipo: 'image/png',
                nombre: 'ImagenPerfilDefault',
                data: imagenDefault,
                fechaRegistroRecurso: toSQLDate(new Date())
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('recursos', null, {});
    }
};
