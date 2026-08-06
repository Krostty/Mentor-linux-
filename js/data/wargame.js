import { WARGAME_PASSWORDS } from './snapshots.js';
import { hashRespuesta } from './secretos.js';

const DATOS = [
  ['Primer contacto', 'La contraseña está en el archivo `README` de tu carpeta personal.', 'cat README', ['Lista primero con `ls`.', '`cat` muestra el contenido de un archivo.']],
  ['El archivo imposible', 'Lee el archivo cuyo nombre es solamente `-`.', 'cat ./-', ['Un guion se interpreta como opción.', 'Anteponer `./` obliga a tratarlo como ruta.']],
  ['Espacios', 'Encuentra la contraseña dentro del archivo con espacios en su nombre.', 'cat "spaces in this filename"', ['Los espacios separan argumentos.', 'Protege el nombre con comillas.']],
  ['Lo oculto', 'La contraseña está en un archivo oculto.', 'ls -la\ncat .hidden', ['Usa `ls -a`.', 'Los nombres ocultos empiezan por punto.']],
  ['Humano entre binarios', 'Dentro de `files/`, solo un archivo es texto legible.', 'file files/*\ncat files/file07', ['Inspecciona todos con `file`.', 'Después lee el que se identifique como texto.']],
  ['La aguja', 'Busca recursivamente el único archivo llamado `password.txt`.', 'find deep -type f -name "password.txt"\ncat deep/one/two/password.txt', ['`find` puede filtrar por tipo y nombre.', 'Empieza la búsqueda en `deep`.']],
  ['La línea exacta', 'En `data.txt`, la contraseña está junto a la palabra `millionth`.', 'grep millionth data.txt', ['No necesitas leer miles de líneas.', 'Filtra con `grep`.']],
  ['La línea única', 'En `data.txt`, la contraseña es la única línea que aparece una vez.', 'sort data.txt | uniq -u', ['`uniq` necesita datos agrupados.', 'Ordena antes y usa `uniq -u`.']],
  ['Texto dentro del ruido', 'Extrae la contraseña imprimible de `binary.dat`.', 'strings binary.dat', ['El archivo no es texto normal.', 'Usa `strings`.']],
  ['No es cifrado', 'Decodifica el contenido Base64 de `encoded.txt`.', 'base64 -d encoded.txt', ['Base64 representa datos; no los cifra.', 'La opción de decodificar es `-d`.']],
  ['Rotación', 'El texto de `rot13.txt` fue transformado con ROT13.', 'cat rot13.txt | tr "A-Za-z" "N-ZA-Mn-za-m"', ['ROT13 sustituye cada letra por la situada 13 posiciones después.', 'Puedes traducir caracteres con `tr`.']],
  ['Capas', 'El archivo `capas.txt` contiene dos capas consecutivas de Base64.', 'cat capas.txt | base64 -d | base64 -d', ['La primera salida sigue pareciendo Base64.', 'Conecta dos decodificaciones con pipes.']],
  ['Qué cambió', 'Compara `passwords.old` y `passwords.new`: la línea nueva es la contraseña.', 'diff passwords.old passwords.new', ['No revises ambos archivos a ojo.', '`diff` marca eliminaciones y adiciones.']],
  ['Los logs recuerdan', 'Busca en los registros la clave `next_password`.', 'grep next_password logs/auth.log', ['Los registros están en `logs/`.', 'Filtra por el nombre exacto de la clave.']],
  ['Responsabilidad root', 'Lee `FINAL.txt` para obtener la última contraseña y completar el Wargame.', 'cat FINAL.txt', ['Este nivel resume el recorrido.', 'Usa `cat FINAL.txt`.']],
];

export const WARGAME = DATOS.map(([nombre, objetivo, solucion, pistas], n) => ({
  id: `bandit-${n}`,
  n,
  nombre,
  objetivo,
  snapshot: `wargame-${n}`,
  solucion,
  pistas,
  passwordHash: hashRespuesta(WARGAME_PASSWORDS[n]),
  xp: 60 + n * 5,
}));

export const NIVEL_WARGAME_POR_ID = Object.fromEntries(WARGAME.map((nivel) => [nivel.id, nivel]));
