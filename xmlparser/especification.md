<hola>     {hola:
    mundo        "mundo"
</hola>    }


// se deja una flag
<hola valor1="nombre" valor2="nombre2">   {hola: {_attrs: {valor1: "nombre", valor2: "nombre2"}, _text:
    mundo                                 "mundo"
</hola>                                   }}

// no se hace nada
<hola valor1="nombre" valor2="nombre2">  {hola: {_attrs: {valor1: "nombre", valor2: "nombre2"},
    <other>                              other:
        mundo                                   "mundo"
    </other>                             }
</hola>                                  }

<hola valor1="nombre" valor2="nombre2"> {hola: {_attrs: {valor1: "nombre", valor2: "nombre2"}
</hola>                                 }
