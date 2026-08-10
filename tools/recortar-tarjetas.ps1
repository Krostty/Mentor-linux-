param(
  [Parameter(Mandatory = $true)][string]$MaquinasSheet,
  [Parameter(Mandatory = $true)][string]$WargameSheet
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$salidaMaquinas = Join-Path $raiz 'assets/art/maquinas'
$salidaWargame = Join-Path $raiz 'assets/art/wargame'
New-Item -ItemType Directory -Force -Path $salidaMaquinas, $salidaWargame | Out-Null

$nombresMaquinas = @(
  'lumen', 'forge', 'pulse', 'archive',
  'signal', 'bastion', 'mirage', 'ledger',
  'vector', 'citadel', 'kernel', 'eclipse'
)

$nombresWargame = 0..14 | ForEach-Object { 'nivel-{0:d2}' -f $_ }

# Los límites eliminan las divisiones oscuras de las dos láminas maestras.
$columnasMaquinas = @(@(3, 369), @(373, 738), @(742, 1123), @(1127, 1533))
$filasMaquinas = @(@(3, 363), @(367, 672), @(676, 1021))
$columnasWargame = @(@(6, 345), @(350, 671), @(676, 1015), @(1020, 1341), @(1346, 1686))
$filasWargame = @(@(6, 313), @(318, 601), @(606, 915))

function Exportar-Tarjetas {
  param(
    [string]$Origen,
    [string]$Destino,
    [array]$Columnas,
    [array]$Filas,
    [array]$Nombres
  )

  $fuente = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Origen))
  try {
    $indice = 0
    foreach ($fila in $Filas) {
      foreach ($columna in $Columnas) {
        $ancho = $columna[1] - $columna[0]
        $alto = $fila[1] - $fila[0]
        $recorte = New-Object System.Drawing.Rectangle($columna[0], $fila[0], $ancho, $alto)
        $pieza = $fuente.Clone($recorte, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
          # Salida uniforme 3:2. La ilustración conserva su proporción y el
          # espacio lateral se integra con el azul marino de la colección.
          $lienzo = New-Object System.Drawing.Bitmap(720, 480, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
          try {
            $grafico = [System.Drawing.Graphics]::FromImage($lienzo)
            try {
              $grafico.Clear([System.Drawing.ColorTranslator]::FromHtml('#061427'))
              $grafico.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
              $grafico.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
              $grafico.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
              $escala = [Math]::Min(720 / $pieza.Width, 480 / $pieza.Height)
              $destinoAncho = [int][Math]::Round($pieza.Width * $escala)
              $destinoAlto = [int][Math]::Round($pieza.Height * $escala)
              $x = [int][Math]::Floor((720 - $destinoAncho) / 2)
              $y = [int][Math]::Floor((480 - $destinoAlto) / 2)
              $grafico.DrawImage($pieza, $x, $y, $destinoAncho, $destinoAlto)
            }
            finally { $grafico.Dispose() }

            $archivo = Join-Path $Destino ($Nombres[$indice] + '.png')
            $lienzo.Save($archivo, [System.Drawing.Imaging.ImageFormat]::Png)
          }
          finally { $lienzo.Dispose() }
        }
        finally { $pieza.Dispose() }
        $indice++
      }
    }
  }
  finally { $fuente.Dispose() }
}

Exportar-Tarjetas -Origen $MaquinasSheet -Destino $salidaMaquinas -Columnas $columnasMaquinas -Filas $filasMaquinas -Nombres $nombresMaquinas
Exportar-Tarjetas -Origen $WargameSheet -Destino $salidaWargame -Columnas $columnasWargame -Filas $filasWargame -Nombres $nombresWargame

Write-Output "Creadas $($nombresMaquinas.Count) imágenes de máquinas y $($nombresWargame.Count) de Wargame."
