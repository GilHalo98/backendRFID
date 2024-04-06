'use strict';

const nombres = [
    'Hugo',
    'Mateo',
    'Martín',
    'Lucas',
    'Leo',
    'Daniel',
    'Alejandro',
    'Manuel',
    'Pablo',
    'Álvaro',
    'Adrián',
    'Enzo',
    'Mario',
    'Diego',
    'David',
    'Oliver',
    'Marcos',
    'Thiago',
    'Marco',
    'Álex',
    'Javier',
    'Izan',
    'Bruno',
    'Miguel',
    'Antonio',
    'Gonzalo',
    'Liam',
    'Gael',
    'Marc',
    'Carlos',
    'Juan',
    'Ángel',
    'Dylan',
    'Nicolás',
    'José',
    'Sergio',
    'Gabriel',
    'Luca',
    'Jorge',
    'Darío',
    'Íker',
    'Samuel',
    'Eric',
    'Adam',
    'Héctor',
    'Francisco',
    'Rodrigo',
    'Jesús',
    'Erik',
    'Amir',
    'Jaime',
    'Ian',
    'Rubén',
    'Aarón',
    'Iván',
    'Pau',
    'Víctor',
    'Guillermo',
    'Luis',
    'Mohamed',
    'Pedro',
    'Julen',
    'Unai',
    'Rafael',
    'Santiago',
    'Saúl',
    'Alberto',
    'Noah',
    'Aitor',
    'Joel',
    'Nil',
    'Jan',
    'Pol',
    'Raúl',
    'Matías',
    'Martí',
    'Fernando',
    'Andrés',
    'Rayan',
    'Alonso',
    'Ismael',
    'Asier',
    'Biel',
    'Ander',
    'Aleix',
    'Axel',
    'Alan',
    'Ignacio',
    'Fabio',
    'Neizan',
    'Jon',
    'Teo',
    'Isaac',
    'Arnau',
    'Luka',
    'Max',
    'Imran',
    'Youssef',
    'Anas',
    'Elías',
    'Aarón',
    'Abdiel',
    'Abel',
    'Abimael',
    'Abraham',
    'Acab',
    'Adán',
    'Agustín',
    'Ahzià',
    'Alejandro',
    'Andrés',
    'Aram',
    'Ashur',
    'Baltasar',
    'Bartolomé',
    'Beltrán',
    'Benjamín',
    'Caín',
    'Caín',
    'Caleb',
    'Ciro',
    'Dámaso',
    'Daniel',
    'Darío',
    'David',
    'Demócrito',
    'Édgar',
    'Efraín',
    'Elí',
    'Elías',
    'Eliel',
    'Eliseo',
    'Eneas',
    'Esteban',
    'Esteban',
    'Ezequiel',
    'Fabián',
    'Felipe',
    'Félix',
    'Francisco',
    'Gabriel',
    'Gadiel',
    'Gaspar',
    'Germán',
    'Guido',
    'Herodes',
    'Homero',
    'Hugo',
    'Isaac',
    'Isaías',
    'Isaías',
    'Ismael',
    'Israel',
    'Jacob',
    'Jaír de Galaad',
    'Jairo',
    'Jared',
    'Jehoram',
    'Jeremías',
    'Jesús',
    'Jiram',
    'Joanix',
    'Joaquín',
    'Jonás',
    'José',
    'Josué',
    'Juan',
    'Julio',
    'Labán',
    'Lemuel',
    'Leví',
    'Lucas',
    'Lucas',
    'Marcos',
    'Marduk',
    'Mateo',
    'Mateo',
    'Matías',
    'Miguel',
    'Moisés',
    'Naín',
    'Neftalí',
    'Neftalí',
    'Nicolás',
    'Noé',
    'Omar',
    'Pablo',
    'Rafael',
    'Renato',
    'Rubén',
    'Salomón',
    'Samuel',
    'Saúl',
    'Sergio',
    'Set',
    'Simón',
    'Tobías',
    'Uzías',
    'Zacarías',
];

const apellidos = [
    'Hernández',
    'García',
    'Martínez',
    'López',
    'González',
    'Pérez',
    'Rodríguez',
    'Sánchez',
    'Ramírez',
    'Cruz',
    'Flores',
    'Gómez',
    'Morales',
    'Vázquez',
    'Reyes',
    'Jiménez',
    'Torres',
    'Díaz',
    'Gutiérrez',
    'Ruíz',
    'Mendoza',
    'Aguilar',
    'Ortiz',
    'Moreno',
    'Castillo',
    'Romero',
    'Álvarez',
    'Méndez',
    'Chávez',
    'Rivera',
    'Juárez',
    'Ramos',
    'Domínguez',
    'Herrera',
    'Medina',
    'Castro',
    'Vargas',
    'Guzmán',
    'Velázquez',
    'Rojas',
    'De la Cruz',
    'Contreras',
    'Salazar',
    'Luna',
    'Ortega',
    'Santiago',
    'Guerrero',
    'Estrada',
    'Bautista',
    'Cortés',
    'Soto',
    'Alvarado',
    'Espinoza',
    'Lara',
    'Ávila',
    'Ríos',
    'Cervantes',
    'Silva',
    'Delgado',
    'Vega',
    'Márquez',
    'Sandoval',
    'Carrillo',
    'Fernández',
    'León',
    'Mejía',
    'Solís',
    'Rosas',
    'Ibarra',
    'Valdez',
    'Nuez',
    'Campos',
    'Santos',
    'Camacho',
    'Navarro',
    'Maldonado',
    'Rosales',
    'Acosta',
    'Pea',
    'Miranda',
    'Cabrera',
    'Trejo',
    'Valencia',
    'Nava',
    'Pacheco',
    'Robles',
    'Molina',
    'Fuentes',
    'Rangel',
    'Huerta',
    'Meza',
    'Padilla',
    'Espinosa',
    'Aguirre',
    'Salas',
    'Cárdenas',
    'Orozco',
    'Valenzuela',
    'Ayala',
];

let bufferFecha = new Date();

function numeroAleatorio() {
    // Genera un numero telefonico aleatorio.
    return Math.floor(
        Math.random() * (8199999999 - 8100000000) + 8100000000
    ).toString();
};

function fechaAleatoria() {
    // Genera una fecha aleatorio.
    const anio = Math.floor(
        Math.random() * (1970 - 2005) + 2005
    ).toString();

    const mes = Math.floor(
        Math.random() * (1 - 12) + 12
    ).toString();

    const dia = Math.floor(
        Math.random() * (1 - 29) + 29
    ).toString();

    const fecha = anio + '-' + mes + '-' + dia;

    bufferFecha = new Date(fecha);

    return fecha;
};

function nombreAleatorio() {
    // Genera un nombre aleatorio para el usuario.
    let nombre = '';
    let nombreSeleccionado = 0;
    const totalNombres = Math.random() * (3 - 1) + 1;

    for (let i = 0; i < totalNombres - 1; i++) {
        nombreSeleccionado = Math.floor(Math.random() * (nombres.length - 1) + 1);
        nombre += nombres[nombreSeleccionado] + ' ';
    }
    nombreSeleccionado = Math.floor(Math.random() * (nombres.length - 1) + 1);
    nombre += nombres[nombreSeleccionado];

    return nombre;
};

function apellidoAleatorio() {
    // Genera un apellido aleatorio para el usuario.
    const nombreSeleccionado = Math.floor(Math.random() * (apellidos.length - 1) + 1);;

    return apellidos[nombreSeleccionado];
};

function rolAleatorio() {
    return Math.random() * (2 - 1) + 4;
};

function generarUsuariosAleatorios(cantidadUsuarios) {
    // Genera una lista de usuarios con los datos aleatorios
    let listaUsuarios = [];
    for(let i = 0; i < cantidadUsuarios; i++) {
        listaUsuarios.push(
            {
                nombres: nombreAleatorio(),
                apellidoPaterno: apellidoAleatorio(),
                apellidoMaterno: apellidoAleatorio(),
                numeroTelefonico: numeroAleatorio(),

                fechaNacimiento: new Date(fechaAleatoria()),

                fechaRegistroEmpleado: new Date(),

                idRolVinculado: rolAleatorio(),
                idImagenVinculada: 1
            }
        );
    }

    return listaUsuarios;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('empleados', [
            ...generarUsuariosAleatorios(100)
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('empleados', null, {});
    }
};
