te diré el fkujo desde las diferente perspectivas de actores.

me acabo de dar cuenta de que el actor CLIENTE no exite. lo borramos tal cual.

Primera parte donde nuestro software ya está en linea.
-Administrador: descubre nuestra plataforma, obviamente no tiene una cuenta tendra que registrarse (Nombre, ci, telefono, correo) el usuario registrado entrará como administrador por defecto, luego de crear su usuario debe aparecer un formulario emergente que diga ¿Cual es el nombre de tu empresa?, el usuario le pone nombre, ahora ese usuario es administrador de una empresa por ahora vacia con 2 modulos a la vista "Gestionar usuarios" y "Modelar BPMN"
-Diseñador: INEXISTENTE POR AHORA
-Funcionario: INEXISTENTE POR AHORA

Segunda parte:
- Administrador: Se dirige al modulo "Gestionar usuarios" donde crea un usuario relacionado a su empresa, con nombre, telefono, ci, correo y rol que puede ser "Administrador", "Diseñador", "Funcionario" el elige crear a su "Diseñador" para que cree el diagrama o de lo contrario el mismo tendria que hacerlo.
- Diseñador: Una vez registrado unicamente tiene acceso a "Modelar BPMN" el desarrolla el diagrama de actividades organizado en carriles para la empresa que si bien puede ser de cualquier tramite de cualquier cosa, crea los sectores con sus requisitos cada uno, requisitos necesarios para que cada tramite necesita para avanzar, tiene a la vista el asistente Gemini que puede editar, su diagrama, darle ideas, editar detalles de su diagrama sin alterar el resto, etc.
- Funcionario: No exite aun.

TERCER PASO:
- Administrador: al tener ya el sistema generado a travez del diagrama los modulos a los que el podra acceder son "Gestionar Usuarios" dondeahora si puede crear usuarios con cualquier rol y podrá recien designarlos a areas especificas, "Gestionar tramites" aquí el administrador podrá registrar tramites de clientes te no tocan la plataforma y tambien puede ver en una grilla los tramites que hay, "Modelar BPMN" si es que el quiere o no crear otro diagrama, "Gestionar Tareas" el administrador podrá ver las tareas/requisitos que hay en cada sector y si hay un tramite en ese sector podra asignar tarea para que los "Funcionarios" asignados a esa area tengan cosas que hacer cada uno
-Diseñador: Ya creo el diagrama, puede esperar a que le pidan otro o pueden ponerlo a trabajar como funcionario pero manteniendo su rol de Diseñador.
- Funcionario: Una vez registrado en la plataforma solo tiene acceso a "Gestionar Tramites" y "Gestionar Tareas" puede registrar tramites, puede auto signarse tareas si es que le toca a su sector, solo de su ector, no puede asignar tareas a otro sector solo el administrador puede


VISTA DE MODULOS EN EL NAVBAR POR PASO#1
- Login= Administrador, Diseñador, Funcionario
- Cerrar sesion= Administrador, Diseñador, Funcionario
- Gestionar usuario= NULO
- Modelar BPMN= NULO
- Gestionar tramites= NULO
- Gestionar Tareas= NULO

PASO#2
- Login= Administrador, Diseñador, Funcionario
- Cerrar sesion= Administrador, Diseñador, Funcionario
- Gestionar usuario= Administrador
- Modelar BPMN= Administrador, Diseñador
- Gestionar tramites= NULO
- Gestionar Tareas= NULO

PASO#3
- Login= Administrador, Diseñador, Funcionario
- Cerrar sesion= Administrador, Diseñador, Funcionario
- Gestionar usuario= Administrador
- Modelar BPMN= Administrador, Diseñador
- Gestionar tramites= Administrador, Diseñador, Funcionario
- Gestionar Tareas= Administrador, Diseñador, Funcionario




backend: .\mvnw spring-boot:run
frontend: npm start