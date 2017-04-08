//------------------------------------------------------------------------------------------
// SECCION VARIABLES GLOBALES
//------------------------------------------------------------------------------------------

//DATOS DE JUGADORES
var jugadores = new Array();

//INICIO DEL JUEGO
var contenidoCargado = false;
var iniciarJuego=false;

//TURNOS
var turnoActual = 0;

//DURANTE EL JUEGO
var tipoDeJuego = 0;//0: Mover en el tablero, 1: Bloquear tablero
var canvas, ctx, x, y;
var bloqueActivo = false;
var color = { black: "#000", blue: "#006999", green: "#00973F", red: "#C13836", yellow: "#DAB42C", white: "#eaeaea" };

//INICIAR VARIABLE GLOBAL
var tipoMovimiento='J'; //{J,BLOQUEH,BLOQUEV}





//variables que voy a necesitar en el juego
var coordenadas = []; //matriz donde se almacenara las coordenadas de cada espacio del tablero
var personajes = [];
var alto = screen.height;//CAMBIAR ESCALARA
var ancho = screen.width;//CAMBIAR ESCALARA
var margen = screen.height*0.10;//0.11 * alto
var tamanio = 0.06 * alto;
var bloque = [];
bloque[0] = -1;
bloque[1] = -1;


//BLOQUES
var bloqueEnMovimiento = [];
bloqueEnMovimiento[0] = -1;
bloqueEnMovimiento[1] = -1;

//------------------------------------------------------------------------------------------
// FIN SECCION VARIABLES GLOBALES
//------------------------------------------------------------------------------------------




//------------------------------------------------------------------------------------------
// SECCION MENSAJES
//------------------------------------------------------------------------------------------

window.onload = function () {
    //INICIA EL CONNECT SDK
    window.connectManager = new connectsdk.ConnectManager();
    window.connectManager.on("message", function(data){

        //SE INICIA EL JUEGO
        if (data.message.accion == "conectarTV") {
            var mensaje = { accion: "cargarInicio", resultado: ""};

            //EL JUGADOR NUEVO INGRESA A LA OTRA PANTALLA
            window.connectManager.sendMessage(data.from, mensaje);
        }

        //AGREGAR NUEVO JUGADOR
        if(data.message.accion == "conectarJugador")
        {
            if (contenidoCargado) {
                conectarJugador(data.message.jugador, data.message.avatar, data.from);
            }
            else
            {

                var mensaje = { accion: "cargandoJuego", resultado: "" };
                //ENVIAR JSON AL JUGADOR PARA MOSTRAR UN TOAST QUE AUN NO SE HA CARGADO EL JUEGO
                window.connectManager.sendMessage(data.from, mensaje);
            }
        }

        //JUGADOR SE DESOCNECTA
        if (data.message.accion == "desconectarJugador") {
            desconectarJugador(data.from);
            actualizarConectados();
            //ACTIVA O DESACTIVA EL BOTON ANTES DE INICIAR EL JUEGO
            validarInicio();
        }

        //INICIAR EL JUEGO
        if(data.message.accion == "empezarJuego")
        {
            //ACTIVA O DESACTIVA EL BOTON ANTES DE INICIAR EL JUEGO
            validarInicio();
            if (iniciarJuego) {
                //DESACTIVAR POPUP DE CREDITOS
                //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                $("#seccionCreditos").addClass("invisible");

                $('#seccionActiva').load('juego.html', function () {
                    //----------------------------------
                    //VALIDAR QUE INICIA ACCIONES SIN HABER CULMINADO DE CARGA EL SIGUIENTE HTML
                    /* When load is done */
                    generarTurnos();
                    //Enviar turnos
                    enviarTurnos();

                    //DIBUJAR DIV DE JUGADORES
                    dibujarJugadores();

                    //LA PRIMERA VEZ SE MUESTRA QUIEN JUEGA
                    mostrarPopUpInicioTurno();
                    //AL CREAR EL TABLERO SE MUESTRAN LOS POSIBLES MOVIMIENTOS
                    canvasTablero();
                });
            }
            //EN CASO CONTRARIO SE ESPERA A QUE SE CONECTEN 2 O 4 JUGADORES
            //------------------------------------------------------------
        }

        //REINICIAR JUEGO
        if (data.message.accion == "salir") {
            //FINALIZAR PARTIDA
            finalizarPartida();//TODO DEBEN IR A LA PANTALLA DE LLENAR DATOS DEL JUGADOR MANTENIENDO SUS DATOS

            //REINICIAN LAS VARIABLESS
            reiniciarVariables();

            //VUELVEN A LA PANTALLA DE ESPERANDO JUGADORES EN LA TV
            $('#seccionActiva').load('seleccionaTV.html', function () {
                //ACTUALIZAR LOS JUGADORES CONECTADOS
                mostrarJugadoresConectados();
            });
        }
        
        //REINICIAR JUEGO
        if (data.message.accion == "volverAjugar") {
            //VUELVEN A LA PANTALLA DE ESPERANDO JUGADORES CONSERVANDO SUS DATOS DE LA PARTIDA (NOMBRE, AVATAR) EN EL MOVIL
            prepararNuevaPartida();

            //RECARGA EL TABLERO
            $('#seccionActiva').load('juego.html', function () {
                //----------------------------------
                //VALIDAR QUE INICIA ACCIONES SIN HABER CULMINADO DE CARGA EL SIGUIENTE HTML
                /* When load is done */
                generarTurnos();
                //Enviar turnos
                enviarTurnos();

                //DIBUJAR DIV DE JUGADORES
                dibujarJugadores();

                //LA PRIMERA VEZ SE MUESTRA QUIEN JUEGA
                mostrarPopUpInicioTurno();
                //AL CREAR EL TABLERO SE MUESTRAN LOS POSIBLES MOVIMIENTOS
                canvasTablero();
            });
        }

        //MOSTRAR INFORMACION DEL JUEGO
        if(data.message.accion == "mostrarCreditos"){
            if($("#seccionCreditos").hasClass("invisible")){    
                $("#seccionCreditos").removeClass("invisible");
            }else{
                $("#seccionCreditos").addClass("invisible");
            }
        }

        //------------------------------------------------------------
        //CUANDO EL JUGADOR ENVIA LA ACCION A REALIZAR Y ES SU TURNO
        //VALIDA QUE SOLO JUEGO EL JUGADOR DEL CUAL ES EL TURNO
        if (data.message.accion == "enviarEvento" && data.from == jugadores[turnoActual].tablet) {
            if (data.message.tipo == "ficha")
            {
                if (data.message.direccion == "seleccion")
                {
                    //SI ESTOY SELECCIONANDO EL JUGADOR LUEGO DE HABER DIBUJADO ALGUN BLOQUE, LO BORRO
                    if (tipoMovimiento != 'J') {
                        marcarPosiblesMovimientos(); //MARCO LOS POSUBLES MOVIMIENTOS QUE SE BORRARON
                        borrarBloqueTemporal(tipoMovimiento);
                    }
                    tipoMovimiento = 'J';
                }
                else {
                    //Solo puedo validar un ganador luego de mover la ficha
                    //Al mover un ficha culmina el turno
                    //Si es un movimiento valido procedo
                    //Mueve la ficha
                    moverFicha(data.message.direccion);
                }
            }
            else if (data.message.tipo == "bloqueV" || data.message.tipo == "bloqueH")
            {
                if(data.message.direccion == "seleccion")
                {
                    if (tipoMovimiento == 'J')
                    {
                        borrarMarcasPosibleMovimiento();//CUANDO VENGO DEL MANDO DEL JUGADOR BORRO LAS POSIBLES POSICIONES
                        dibujarBloque(data.message.tipo)//Se envia {bloqueV, bloqueH}, PREVIO A DIBUJAR, BORRA LOS POSIBLES MOVIMIENTOS DEL JUGADOR
                        tipoMovimiento = data.message.tipo;//CAPTURO EL TIPO ACTUAL
                    }
                    else if (data.message.tipo != tipoMovimiento)//SI NO SE ESTA SELECCIONANDO EL MISMO MANDO, NO DEBE GIRAR
                    {
                        girarBloque();
                        tipoMovimiento = data.message.tipo;//CAPTURO EL TIPO ACTUAL
                    }
                }
                else
                {
                    moverBloque(data.message.tipo, data.message.direccion);
                    tipoMovimiento = data.message.tipo;//CAPTURO EL TIPO AC
                }

            }
            else if (data.message.tipo == "posicionarBloque")
            {
                if (validarPosicionBloque(tipoMovimiento))//VALIDACION TEMPORAL
                {
                    colocarBloque(tipoMovimiento);//VALIDACION TEMPORAL

                    bloqueoExitoso();//INIDICA AL USUARIO QUE DISMINUYE EN UNO LA CANTIDAD DE BLOQUEES QUE POSEE

                    //Al dejar el bloque vuelvo al mando del jugador
                    tipoMovimiento = 'J';//VUELVO AL TIPO DE JUGADOR J

                    //Turnos
                    actualizarTurnos();
                    enviarTurnos();
                }
                else
                {
                    mensajeMovimientoInvalido();
                }
            }
        }

    });

    window.connectManager.init();

}

//------------------------------------------------------------------------------------------
// FIN SECCION MENSAJES
//------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------
// SECCION CONECTA JUGADOR
//------------------------------------------------------------------------------------------
function finalizarPartida() {
    var mensaje = { accion: "juegoCancelado", resultado: "" }
    for (var i = 0; i < jugadores.length; i++) {
        window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
    }
}

function cargarInicioAct() {
    contenidoCargado = true;
}

//AGREGAR NUEVO JUGADOR (NOMBRE DEL JUGADOR, IDENTIFICADOR UNICO DEL DISPOSITIVO)
//PSDT: SELECCIONAR AVATAR
function conectarJugador(pNombre, pAvatar, pTablet){

    var jugadorRepetido = false;

    for (var i = 0; i < jugadores.length; i++) {
        if (jugadores[i].tablet == pTablet) {
            jugadorRepetido = true;
        }
    }

    if (jugadorRepetido)
    {
        //YA NO AGREGO A LA COLA PERO LE PERMITO PASAR A LA OTRA PANTALLA
        var botonActivado = false;
        if (jugadores.length == 4 || jugadores.length == 2) {
            botonActivado = true;
        }
        else {
            botonActivado = false;
        }
        var mensaje = { accion: "conexionExitosa", resultado: botonActivado }
        window.connectManager.sendMessage(pTablet, mensaje);
        return;
    }


    var jugador =
        {
            nombre: pNombre,
            avatar: pAvatar,
            tablet: pTablet
        };
    
    if(jugadores.length >= 4){
        var mensaje = { accion: "limiteJugadores", resultado: ""}
        window.connectManager.sendMessage(pTablet, mensaje);
    }
    else {
        //AGREGA EL JUGADOR AL LISTADO
        jugadores.push(jugador);

        var botonActivado = false;
        if (jugadores.length == 4 || jugadores.length == 2)
        {
            botonActivado = true;
        }
        else {
            botonActivado = false;
        }
        var mensaje = { accion: "conexionExitosa", resultado: botonActivado }
        window.connectManager.sendMessage(pTablet, mensaje);

        //ACTIVAR JUGADOR CONECTADO
        mostrarJugadoresConectados();

        validarInicio();
    }
}
function mostrarJugadoresConectados() {
    if (jugadores[0] != null) {
        $("#imagenJugador1").attr('src', 'assets/images/conexion/jugador_' + jugadores[0].avatar + '.png');
        $("#nombreJugador1").html(jugadores[0].nombre)
        $("#nombreJugador1").data("identificador", jugadores[0].tablet);
    }
    if (jugadores[1] != null) {
        $("#imagenJugador2").attr('src', 'assets/images/conexion/jugador_' + jugadores[1].avatar + '.png');
        $("#nombreJugador2").html(jugadores[1].nombre)
        $("#nombreJugador2").data("identificador", jugadores[1].tablet);
    }
    if (jugadores[2] != null) {
        $("#imagenJugador3").attr('src', 'assets/images/conexion/jugador_' + jugadores[2].avatar + '.png');
        $("#nombreJugador3").html(jugadores[2].nombre)
        $("#nombreJugador3").data("identificador", jugadores[2].tablet);
    }
    if (jugadores[3] != null) {
        $("#imagenJugador4").attr('src', 'assets/images/conexion/jugador_' + jugadores[3].avatar + '.png');
        $("#nombreJugador4").html(jugadores[3].nombre)
        $("#nombreJugador4").data("identificador", jugadores[3].tablet);
    }
}
function actualizarConectados()
{
    //BORRO TODO
    $("#imagenJugador1").attr('src', 'assets/images/conexion/jugador.png');
    $("#nombreJugador1").html(null)
    $("#nombreJugador1").data("identificador", null);
    $("#imagenJugador2").attr('src', 'assets/images/conexion/jugador.png');
    $("#nombreJugador2").html(null)
    $("#nombreJugador2").data("identificador", null);
    $("#imagenJugador3").attr('src', 'assets/images/conexion/jugador.png');
    $("#nombreJugador3").html(null)
    $("#nombreJugador3").data("identificador", null);
    $("#imagenJugador4").attr('src', 'assets/images/conexion/jugador.png');
    $("#nombreJugador4").html(null)
    $("#nombreJugador4").data("identificador", null);
    mostrarJugadoresConectados();
}
function desconectarJugador(pTablet) {
    for (var i = 0; i < jugadores.length; i++) {
        if (jugadores[i].tablet == pTablet) {
            //ELIMINO AL JUGADOR DEL ARRAY
            //(DONDE ESTA UBICADO, CUANTOS ELIMINA)
            jugadores.splice(i, 1);
        }
    }
}
function validarInicio()
{
    //ACTIVA EL BOTON INICIAR EN EL DISPOSITIVO DE LOS JUGADORES
    if (jugadores.length == 2 || jugadores.length == 4) {   
        var mensaje = { accion: "puedeIniciar", resultado: "" }
        for (var i = 0; i < jugadores.length; i++) {
            window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
        }
        //CLAVE PARA VALIDAR EL INICIO DEL JUEGO
        iniciarJuego = true;
    }
    else {
        var mensaje = { accion: "bloquearInicio", resultado: "" }
        for (var i = 0; i < jugadores.length; i++) {
            window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
        }
        //CLAVE PARA VALIDAR EL INICIO DEL JUEGO
        iniciarJuego = false;
    }
}

//GENERAR TURNOS
function generarTurnos(){
    var cantidadJugadores = 0;
    cantidadJugadores = jugadores.length;
    var jugadoresAux = new Array();
    while(cantidadJugadores > 0)
    {
        var i = Math.floor(Math.random() * cantidadJugadores);
        jugadoresAux.push(jugadores[i]);
        jugadores.splice(i, 1);
        cantidadJugadores--;
    }
    jugadores = jugadoresAux;
}
function enviarTurnos()
{
    for (var i = 0; i < jugadores.length; i++) {
        if (i == turnoActual)
            mensaje = { accion: "esTurno", resultado: true };
        else
            mensaje = { accion: "esTurno", resultado: false };
        window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
    }
}

function prepararNuevaPartida()
{
    var mensaje = { accion: "cargarNuevoInicio", resultado: "" };
    for (var i = 0; i < jugadores.length; i++) {
        window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
    }
}

function finDePartida()
{
    var mensaje = { accion: "juegoFinalizado", resultado: "" };
    for (var i = 0; i < jugadores.length; i++) {
        window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
    }
}

function bloqueoExitoso()
{
    var mensaje = { accion: "bloqueoExitoso", resultado: "" };
    window.connectManager.sendMessage(jugadores[turnoActual].tablet, mensaje);
}

//------------------------------------------------------------------------------------------
// FIN SECCION CONECTA JUGADOR
//------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------
// SECCION PIZARRA
//------------------------------------------------------------------------------------------
function dibujarJugadores(){
    
    for (var i = 0; i < jugadores.length; i++) {
        $('#seccionJugadores').append("<div class=\"contenedor-jugador\">" +
                                        "<img class=\"jugador\" src=\"assets/images/juego/jugador_" + (i + 1) + ".png\">" +
                                        "<label class=\"jugador-nombre\">" + (jugadores[i].nombre).toUpperCase() + "</label>" +
                                        "</div>");  
    }
}

function iniciaTurno() {
    //DESAPARECE EL POPUP MOSTRADO
    $('#popups').children().remove();
    $('#popups').hide();
}

function actualizarTurnos(){
    if (turnoActual >= jugadores.length - 1) {
        turnoActual = 0;
    }
    else {
        turnoActual++;
    }
    marcarPosiblesMovimientos();
}
function moverFicha(direccion) {
    switch (direccion)
    {
        case "arriba":
            if (validarMovimientoPersonaje(1)) {
                moverPersonaje(1);
                return true;
                break;
            }
            else
            {
                mensajeMovimientoInvalido();
                return false;
                break;
            }
            break;
        case "abajo":
            if (validarMovimientoPersonaje(3)) {
                moverPersonaje(3);
                return true;
                break;
            }
            else {
                mensajeMovimientoInvalido();
                return false;
                break;
            }
            break;
        case "izquierda":
            if (validarMovimientoPersonaje(4)) {
                moverPersonaje(4);
                return true;
                break;
            }
            else {
                mensajeMovimientoInvalido();
                return false;
                break;
            }
            break;
        case "derecha":
            if (validarMovimientoPersonaje(2)) {
                moverPersonaje(2);
                return true;
                break;
            }
            else {
                mensajeMovimientoInvalido();
                return false;
                break;
            }
            break;
    }
}

// function mueve el bloque
function moverBloque(tipo,evento) {
    var canvas = document.getElementById('canvasBloques');
    var contexto = canvas.getContext('2d');

    //indices de la posicion inicial en la matriz
    var x = bloqueEnMovimiento[0];
    var y = bloqueEnMovimiento[1];

    // establece las coordenadas x y en el canvas
    var xinicial = coordenadas[x][y][0];
    var yinicial = coordenadas[x][y][1];

    // arriba
    if (evento == 'arriba' && validarMovimientoBloque(tipo,evento)) {
        var xf = x;
        var yf = y - 2;
    }
        // derecha
    else if (evento == 'derecha' && validarMovimientoBloque(tipo, evento)) {
        var xf = x + 2;
        var yf = y;
    }
        // abajo
    else if (evento == 'abajo' && validarMovimientoBloque(tipo, evento)) {
        var xf = x;
        var yf = y + 2;
    }
        // izquierda
    else if (evento == 'izquierda' && validarMovimientoBloque(tipo, evento)) {
        var xf = x - 2;
        var yf = y;
    }
    else
        return;

    var xfinal = coordenadas[xf][yf][0];
    var yfinal = coordenadas[xf][yf][1];

    var imagenMover = new Image();

    if (tipo == 'bloqueH') {
        var anchoBloque = 2.5 * tamanio;
        var altoBloque = tamanio / 2;
    }
    else if (tipo == 'bloqueV') {
        var altoBloque = 2.5 * tamanio;
        var anchoBloque = tamanio / 2;
    }
    else
        return;

    // obtiene el espacio a mover y lo setea en la nueva posici�n
    imagenMover.src = setearImagenBloque(xf, yf,tipo);
    contexto.clearRect(xinicial, yinicial, anchoBloque, altoBloque);

    imagenMover.onload = function () {
        contexto.drawImage(imagenMover, xfinal, yfinal, anchoBloque, altoBloque);
        // se setea los valores del bloque
        bloqueEnMovimiento[0] = xf;
        bloqueEnMovimiento[1] = yf;
    }
}

function setearImagenBloque(x, y,tipo) {
    if (tipo == 'bloqueH') {
        if (coordenadas[x][y][2] > 0 || coordenadas[x + 1][y][2] > 0 || coordenadas[x + 2][y][2] > 0)
            return 'assets/images/juego/bloque-horizontal-gris.png';
        else
            return 'assets/images/juego/bloque-horizontal.png';
    }

    else if (tipo == 'bloqueV') {
        if (coordenadas[x][y][2] > 0 || coordenadas[x][y + 1][2] > 0 || coordenadas[x][y + 2][2] > 0)
            return 'assets/images/juego/bloque-vertical-gris.png';
        else
            return 'assets/images/juego/bloque-vertical.png';
    }
    else
        return;
}

function validarMovimientoBloque(tipo,evento) {
    // se establecen cuales son las variaciones en la matriz de acuerdo a que movimiento se haga 
    if (evento == 'arriba') // arriba w
    {
        if (bloqueEnMovimiento[1] - 2 < 0)
        {
            return false;
        }
    }
    else if (evento == 'derecha') // derecha d
    {
        if (tipo == 'bloqueV' && bloqueEnMovimiento[0] + 2 > 16)
        {
            return false;
        }            
        else if (tipo == 'bloqueH' && bloqueEnMovimiento[0] + 4 > 16)
        {
            return false;
        }
    }
    else if (evento == 'abajo') // abajo s
    {
        if (tipo == 'bloqueV' && bloqueEnMovimiento[1] + 4 > 16)
        {
            return false;
        }
        else if (tipo == 'bloqueH' && bloqueEnMovimiento[1] + 2 > 16)
        {
            return false;
        }
    }
    else if (evento == 'izquierda') // izquierda a
    {
        if (bloqueEnMovimiento[0] - 2 < 0)
        {
            return false;
        }
    }
    else
        return false;
    return true;
}


function finalizaJuego(ganador) {
    //SI ALGUN JUGADOR LLEGO AL OTRO EXTREMO

    //CAMBIOS
    var jugador = ganador;
    mostrarPopUpGanador(jugador);
}

function reiniciarVariables() {
    //-------------------------------REINICIAR VARIABLES - VICTOR-------------------------------
    //INICIO DEL JUEGO
    //contenidoCargado = false;
    iniciarJuego = false;

    //TURNOS
    turnoActual = 0;

    //REINICIA EL LISTADO DE JUGADORES CONECTADOS
    jugadores = new Array();


    //-------------------------------REINICIAR VARIABLES - DAVID-------------------------------
    coordenadas = [];
}

//------------------------------------------------------------------------------------------
// FIN SECCION PIZARRA
//------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------
// SECCION POP-UPS
//------------------------------------------------------------------------------------------
function mostrarPopUpInicioTurno() {
    //TURNO ACTUAL
    var jugador = jugadores[turnoActual].nombre;

    $('#popups').children().remove();
    $('#popups').show();
    $('#popups').append('<img class=\"pop-up-categoria\" src=\'assets/images/juego/popup_vacio.png\'>' +
                        '<div class=\"pop-up-turno-texto \">TURNO DE ' + jugador.toUpperCase() + '</div>');
    setTimeout(iniciaTurno, 3000);
}
function mostrarPopUpGanador(ganador) {
    //SE DEBE BUSCAR AL JUGADOR GANADOR DE LA PARTIDA
    var nombreGanador = ganador;

    //ELIMINA LOS POPUP'S
    $('#popups').children().remove();
    $('#popups').show();
    $('#popups').append('<img class=\"pop-up-ganador\" src=\'assets/images/juego/popup_ganador.png\'>' +
                        '<div class=\"pop-up-ganador-texto \">' + nombreGanador + '</div>');
    //------------------------------------------------------------------
    //ENVIAR MENSAJE EN ANDROID
    for (var i = 0; i < jugadores.length; i++) {
        var mensaje = { accion: "ganadorJuego", resultado: jugador.nombre };
        window.connectManager.sendMessage(jugadores[i].tablet, mensaje);
    }
}

//------------------------------------------------------------------------------------------
// FIN SECCION POP-UPS
//------------------------------------------------------------------------------------------








//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
// DAVID
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------



	
// construccion del tablero
function canvasTablero() {
    

    var x;
    var y;
			
    var canv = document.getElementById('tablero');
    canv.width = 2 * margen + 13 * tamanio;
    canv.height = 2 * margen + 13 * tamanio;

    var canvasBloque = document.getElementById('canvasBloques');
    canvasBloque.width = 2 * margen + 13 * tamanio;
    canvasBloque.height = 2 * margen + 13 * tamanio;

    var canvasPosMov = document.getElementById('canvasPosibleMovimiento');
    canvasPosibleMovimiento.width = 2 * margen + 13 * tamanio;
    canvasPosibleMovimiento.height = 2 * margen + 13 * tamanio;
			
    var ctx = canv.getContext('2d');

    var imgCasilla = new Image();
    imgCasilla.src = 'assets/images/juego/casilla.png';
	
    imgCasilla.onload = function(){
        for (var i = 0 ; i < 17 ; i++)
        {
            coordenadas[i] = [];
					
            // casilla
            if ((i + 2) % 2 == 0)
                y = i / 2 * 1.5 * tamanio + margen;
                // espacio vacio
            else
                y = (i + 1) / 2 * tamanio + (i - 1) / 2 * 0.5 * tamanio + margen;
					
            for (var j = 0 ; j < 17 ; j++)
            {
                //casilla
                if ((j + 2) % 2 == 0)
                    x = j / 2 * 1.5 * tamanio + margen;
                    //espacio vacio
                else
                    x = (j + 1) / 2 * tamanio + (j - 1) / 2 * 0.5 * tamanio + margen;
							
                // guarda todas las coordenadas x y de cada casilla del tablero	
                coordenadas[i][j] = [];
                coordenadas[i][j].push(y);
                coordenadas[i][j].push(x);
                coordenadas[i][j].push(-1);
						
                // dibujo la casilla en las posiciones que debe
                if ((i + 2) % 2 == 0 && (j + 2) % 2 == 0)
                    ctx.drawImage(imgCasilla,x,y,tamanio,tamanio);
            }
					
            x = margen;//0.11 * alto;
        }

        //TERMINA DE CONSTRUIR EL TABLERO Y COLOCA A LOS JUGADORES
        if (jugadores.length == 2)
        {
            // setea personajes // se debe eliminar
            personajes[0] = [];
            personajes[1] = [];
            //2 JUGADORES - DATOS
            //---------------------------------P1---------------------------------
            personajes[0].push(8);
            personajes[0].push(0);
            personajes[0].push(1);
            coordenadas[8][0][2] = 0;
            //---------------------------------P2---------------------------------
            personajes[1].push(8);
            personajes[1].push(16);
            personajes[1].push(3);
            coordenadas[8][16][2] = 1;
            //MOVMIENTOS
            marcarPosiblesMovimientos();

            //2 JUGADORES - GRAFICOS
            var imgPersonaje = new Image();
            imgPersonaje.src = 'assets/images/juego/jugador_tablero_' + jugadores[0].avatar + '.png';
            imgPersonaje.onload = function () {
                ctx.drawImage(imgPersonaje, coordenadas[8][0][0], coordenadas[8][0][1], tamanio, tamanio);
            }
            var imgPersonaje2 = new Image();
            imgPersonaje2.src = 'assets/images/juego/jugador_tablero_' + jugadores[1].avatar + '.png';
            imgPersonaje2.onload = function () {
                ctx.drawImage(imgPersonaje2, coordenadas[8][16][0], coordenadas[8][16][1], tamanio, tamanio);
            }
        }
        else if (jugadores.length == 4)
        {
            // setea personajes // se debe eliminar
            personajes[0] = [];
            personajes[1] = [];
            personajes[2] = [];
            personajes[3] = [];
            //2 JUGADORES - DATOS
            //---------------------------------P1---------------------------------
            personajes[0].push(8);
            personajes[0].push(0);
            personajes[0].push(1);
            coordenadas[8][0][2] = 0;
            //---------------------------------P2---------------------------------
            personajes[1].push(16);
            personajes[1].push(8);
            personajes[1].push(2);
            coordenadas[16][8][2] = 1;
            //---------------------------------P3---------------------------------
            personajes[2].push(8);
            personajes[2].push(16);
            personajes[2].push(3);
            coordenadas[8][16][2] = 2;
            //---------------------------------P4---------------------------------
            personajes[3].push(0);
            personajes[3].push(8);
            personajes[3].push(4);
            coordenadas[0][8][2] = 3;

            //MOVMIENTOS
            marcarPosiblesMovimientos();

            //2 JUGADORES - GRAFICOS
            var imgPersonaje = new Image();
            imgPersonaje.src = 'assets/images/juego/jugador_tablero_' + jugadores[0].avatar + '.png';
            imgPersonaje.onload = function () {
                ctx.drawImage(imgPersonaje, coordenadas[8][0][0], coordenadas[8][0][1], tamanio, tamanio);
            }
            var imgPersonaje2 = new Image();
            imgPersonaje2.src = 'assets/images/juego/jugador_tablero_' + jugadores[1].avatar + '.png';
            imgPersonaje2.onload = function () {
                ctx.drawImage(imgPersonaje2, coordenadas[16][8][0], coordenadas[16][8][1], tamanio, tamanio);
            }
            var imgPersonaje3 = new Image();
            imgPersonaje3.src = 'assets/images/juego/jugador_tablero_' + jugadores[2].avatar + '.png';
            imgPersonaje3.onload = function () {
                ctx.drawImage(imgPersonaje3, coordenadas[8][16][0], coordenadas[8][16][1], tamanio, tamanio);
            }
            var imgPersonaje4 = new Image();
            imgPersonaje4.src = 'assets/images/juego/jugador_tablero_' + jugadores[3].avatar + '.png';
            imgPersonaje4.onload = function () {
                ctx.drawImage(imgPersonaje4, coordenadas[0][8][0], coordenadas[0][8][1], tamanio, tamanio);
            }
        }
        
    }
}

// funcion que mueve el personaje
function moverPersonaje(evento)
{
    var canvas = document.getElementById('tablero');
    var contexto = canvas.getContext('2d');
			
    //indices de la posicion inicial en la matriz
    var x = personajes[turnoActual][0];
    var y = personajes[turnoActual][1];

    // establece las coordenadas x y en el canvas
    var xinicial = coordenadas[x][y][0];
    var yinicial = coordenadas[x][y][1];
			
    // arriba
    if (evento == 1 && validarMovimientoPersonaje(evento)) 
    {
        // establece las coordenadas x y en el canvas
        var xfinal = coordenadas[x][y - 2][0];
        var yfinal = coordenadas[x][y - 2][1];

        // indices de la posicion destino en la matriz
        var xf = x;
        var yf = y - 2;
    }
        // derecha
    else if (evento == 2 && validarMovimientoPersonaje(evento))
    {
        var xfinal = coordenadas[x + 2][y][0];
        var yfinal = coordenadas[x + 2][y][1];

        var xf = x + 2;
        var yf = y;
    }
        // abajo
    else if (evento == 3 && validarMovimientoPersonaje(evento))
    {
        var xfinal = coordenadas[x][y + 2][0];
        var yfinal = coordenadas[x][y + 2][1];

        var xf = x;
        var yf = y + 2;
    }
        // izquierda
    else if (evento == 4 && validarMovimientoPersonaje(evento))
    {
        var xfinal = coordenadas[x - 2][y][0];
        var yfinal = coordenadas[x - 2][y][1];

        var xf = x - 2;
        var yf = y;
    }
    else
        return;

    var imagenMover = new Image();
    // obtiene el espacio a mover y lo setea en la nueva posici�n
    imagenMover = contexto.getImageData(xinicial, yinicial, tamanio, tamanio);
    contexto.putImageData(imagenMover, xfinal, yfinal);
    // nueva posicion del personaje
    personajes[turnoActual][0] = xf;
    personajes[turnoActual][1] = yf;

    borrarMarcasPosibleMovimiento();

    var img = new Image();
    img.src = 'assets/images/juego/casilla.png';
    img.onload = function () {
        
        contexto.drawImage(img, xinicial, yinicial, tamanio, tamanio);
        coordenadas[x][y][2] = -1;
        coordenadas[xf][yf][2] = turnoActual;

        //Valido el fin del juego
        if (validarGanador()) {
            //ENVIA JSON A LOS DISPOSITIVOS PARA INDICAR EL FIN DE LA PARTIDA
            finDePartida();
            //POPUP
            finalizaJuego(jugadores[turnoActual].nombre);
        }
        else {
            //Turnos
            actualizarTurnos();
            enviarTurnos();
            //EL POPUP SE HA DESACTIVADO PARA APRECIAR EL MOVIMIENTO
            //mostrarPopUpInicioTurno();
        }
    }
    // -----------------------------------------------------------------------------------------------
}

// valida si es permitido el movimiento
function validarMovimientoPersonaje(evento){
    // se establecen cuales son las variaciones en la matriz de acuerdo a que movimiento se haga 
    if (evento == 1) {
        var varx = 0;
        var vary = -2;
    }
    else if (evento == 2) {
        var varx = 2;
        var vary = 0;
    }
    else if (evento == 3) {
        var varx = 0;
        var vary = 2;
    }
    else if (evento == 4) {
        var varx = -2;
        var vary = 0;
    }
    else
        return;

    // valida que no salga del tablero
    if (personajes[turnoActual][0] + varx < 0 || personajes[turnoActual][0] + varx > 16 || personajes[turnoActual][1] + vary < 0 || personajes[turnoActual][1] + vary > 16)
    {
        return false;
    }
    // valida que no se ponga encima de un personaje	
    if (coordenadas[personajes[turnoActual][0] + varx][personajes[turnoActual][1] + vary][2] >= 0)
    {
        return false;
    }
    // valida que no pase por un bloque
    if (coordenadas[personajes[turnoActual][0] + varx / 2][personajes[turnoActual][1] + vary / 2][2] > 0)
    {
        return false;
    }
    return true;
}

// dibujar el bloque y borrarlo hasta que fije su posicion
function dibujarBloque(posicion) {

    var canvas = document.getElementById('canvasBloques');
    var contexto = canvas.getContext('2d');

    var imagenBloque = new Image();

    if (posicion == 'bloqueH') {
        imagenBloque.src = setearImagenBloque(8, 7, posicion);

        imagenBloque.onload = function () {
            contexto.drawImage(imagenBloque, coordenadas[8][7][0], coordenadas[8][7][1], tamanio * 2.5, tamanio / 2);
            bloqueEnMovimiento[0] = 8;
            bloqueEnMovimiento[1] = 7;
        }
    }

    else if (posicion == 'bloqueV') {
        imagenBloque.src = setearImagenBloque(7, 8, posicion);

        imagenBloque.onload = function () {
            contexto.drawImage(imagenBloque, coordenadas[7][8][0], coordenadas[7][8][1], tamanio / 2, tamanio * 2.5);
            bloqueEnMovimiento[0] = 7;
            bloqueEnMovimiento[1] = 8;
        }
    }
}
function girarBloque()
{
    // establece los indices x y de la matriz
    var x = bloqueEnMovimiento[0];
    var y = bloqueEnMovimiento[1];

    // establece las coordenadas x y en el canvas
    var xinicial = coordenadas[x][y][0];
    var yinicial = coordenadas[x][y][1];

    if (tipoMovimiento == 'bloqueH') {
        var anchoBloque = 2.5 * tamanio;
        var altoBloque = tamanio / 2;

        var xf = x + 1;
        var yf = y - 1;
    }
    else if (tipoMovimiento == 'bloqueV') {
        var altoBloque = 2.5 * tamanio;
        var anchoBloque = tamanio / 2;

        var xf = x - 1;
        var yf = y + 1;
    }
    else
        return;

    // establece las coordenadas en el canvas a dibujar
    var xfinal = coordenadas[xf][yf][0];
    var yfinal = coordenadas[xf][yf][1];

    var canvasBloque = document.getElementById('canvasBloques');
    var contextoBloque = canvasBloque.getContext('2d');

    contextoBloque.clearRect(xinicial, yinicial, anchoBloque, altoBloque);

    var imgBloque = new Image();
    imgBloque.src = setearImagenBloque(xf, yf,tipoMovimiento);

    imgBloque.onload = function () {
        contextoBloque.drawImage(imgBloque, xfinal, yfinal, altoBloque, anchoBloque);
        bloqueEnMovimiento[0] = xf;
        bloqueEnMovimiento[1] = yf;
    }
}
// valida que el bloque se pueda poner en la posicion actual
function validarPosicionBloque(posicion) {
    var x = bloqueEnMovimiento[0];
    var y = bloqueEnMovimiento[1];

    if (posicion == 'bloqueH') {
        if (coordenadas[x][y][2] > 0 || coordenadas[x + 1][y][2] > 0 || coordenadas[x + 2][y][2] > 0)
            return false;
    }
    else if (posicion == 'bloqueV') {
        if (coordenadas[x][y][2] > 0 || coordenadas[x][y + 1][2] > 0 || coordenadas[x][y + 2][2] > 0)
            return false;
    }
    else
        return;
    return true;
}

function mensajeMovimientoInvalido()
{
    var mensaje = { accion: "movimientoInvalido" };
    window.connectManager.sendMessage(jugadores[turnoActual].tablet, mensaje);
}

function colocarBloque(posicion) {
    if (posicion == 'bloqueH') {
        var anchoBloque = 2.5 * tamanio;
        var altoBloque = tamanio / 2;
    }
    else if (posicion == 'bloqueV') {
        var altoBloque = 2.5 * tamanio;
        var anchoBloque = tamanio / 2;
    }
    else
        return;

    var canvasBloque = document.getElementById('canvasBloques');
    var contextoBloque = canvasBloque.getContext('2d');

    var canvasTablero = document.getElementById('tablero');
    var contextoTablero = canvasTablero.getContext('2d');

    //indices de la posicion inicial en la matriz
    var x = bloqueEnMovimiento[0];
    var y = bloqueEnMovimiento[1];

    // establece las coordenadas x y en el canvas
    var xinicial = coordenadas[x][y][0];
    var yinicial = coordenadas[x][y][1];

    var imagenMover = new Image();

    imagenMover = contextoBloque.getImageData(xinicial, yinicial, anchoBloque, altoBloque);
    contextoBloque.clearRect(xinicial, yinicial, anchoBloque, altoBloque);

    contextoTablero.putImageData(imagenMover, xinicial, yinicial);

    if (posicion == 'bloqueH') {
        coordenadas[x][y][2] = 1;
        coordenadas[x + 1][y][2] = 1;
        coordenadas[x + 2][y][2] = 1;
    }
    else if (posicion == 'bloqueV') {
        coordenadas[x][y][2] = 1;
        coordenadas[x][y + 1][2] = 1;
        coordenadas[x][y + 2][2] = 1;
    }

    // se setea los valores del bloque
    bloqueEnMovimiento[0] = -1;
    bloqueEnMovimiento[1] = -1;
}

function borrarBloqueTemporal(posicion) {
    var canvasBloque = document.getElementById('canvasBloques');
    var contextoBloque = canvasBloque.getContext('2d');

    contextoBloque.clearRect(0, 0, canvasBloque.width, canvasBloque.height);

    // se setea los valores del bloque
    bloqueEnMovimiento[0] = -1;
    bloqueEnMovimiento[1] = -1;
}
function marcarPosiblesMovimientos() {
    var x = personajes[turnoActual][0];
    var y = personajes[turnoActual][1];

    var imgArriba = new Image();
    var imgDerecha = new Image();
    var imgAbajo = new Image();
    var imgIzquierda = new Image();

    var canvas = document.getElementById('canvasPosibleMovimiento');
    var contexto = canvas.getContext('2d');

    var imagenLimite = new Image();
    imagenLimite.src = 'assets/images/juego/casilla-resaltante-tablero.png';

    imagenLimite.onload = function () {
        imagenLimite.style.filter = "alpha(opacity=50)";
        imagenLimite.style.opacity = 0.5;

        for (var i = 0 ; i < 17 ; i++) {
            if (personajes[turnoActual][2] == 1) {
                if (coordenadas[i][16][2] < 0) {
                    contexto.drawImage(imagenLimite, coordenadas[i][16][0], coordenadas[i][16][1], tamanio, tamanio);
                }
            }

            else if (personajes[turnoActual][2] == 2) {
                if (coordenadas[0][i][2] < 0) {
                    contexto.drawImage(imagenLimite, coordenadas[0][i][0], coordenadas[0][i][1], tamanio, tamanio);
                }
            }

            else if (personajes[turnoActual][2] == 3) {
                if (coordenadas[i][0][2] < 0) {
                    contexto.drawImage(imagenLimite, coordenadas[i][0][0], coordenadas[i][0][1], tamanio, tamanio);
                }
            }

            else if (personajes[turnoActual][2] == 4) {
                if (coordenadas[16][i][2] < 0) {
                    contexto.drawImage(imagenLimite, coordenadas[16][i][0], coordenadas[16][i][1], tamanio, tamanio);
                }
            }

            i = i + 1;
        }

        //--------------CARGA FLECHAS DE POSIBLES MOVIMIENTOS--------------
        if (validarMovimientoPersonaje(1)) {
            imgArriba.src = 'assets/images/juego/flecha-arriba.png';

            imgArriba.onload = function () {
                contexto.drawImage(imgArriba, coordenadas[x][y - 2][0], coordenadas[x][y - 2][1], tamanio, tamanio);
            }
        }

        if (validarMovimientoPersonaje(2)) {
            imgDerecha.src = 'assets/images/juego/flecha-derecha.png';

            imgDerecha.onload = function () {
                contexto.drawImage(imgDerecha, coordenadas[x + 2][y][0], coordenadas[x + 2][y][1], tamanio, tamanio);
            }
        }

        if (validarMovimientoPersonaje(3)) {
            imgAbajo.src = 'assets/images/juego/flecha-abajo.png';

            imgAbajo.onload = function () {
                contexto.drawImage(imgAbajo, coordenadas[x][y + 2][0], coordenadas[x][y + 2][1], tamanio, tamanio);
            }
        }

        if (validarMovimientoPersonaje(4)) {
            imgIzquierda.src = 'assets/images/juego/flecha-izquierda.png';

            imgIzquierda.onload = function () {
                contexto.drawImage(imgIzquierda, coordenadas[x - 2][y][0], coordenadas[x - 2][y][1], tamanio, tamanio);
            }
        }
    }
}

function validarGanador() {
    switch (personajes[turnoActual][2]) {
        case 1:
            if (personajes[turnoActual][1] == 16)
                return true;
            break;

        case 2:
            if (personajes[turnoActual][0] == 0)
                return true;
            break;

        case 3:
            if (personajes[turnoActual][1] == 0)
                return true;
            break;

        case 4:
            if (personajes[turnoActual][0] == 16)
                return true;
            break;
    }
    return false;
}
function borrarMarcasPosibleMovimiento()
{
    var canvas = document.getElementById('canvasPosibleMovimiento');
    var contexto = canvas.getContext('2d');

    contexto.clearRect(0, 0, canvas.width, canvas.height);
}