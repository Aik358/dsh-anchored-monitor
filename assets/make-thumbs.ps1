Add-Type -AssemblyName System.Drawing
$src = 'E:/dsh_dynamic_adjust/references/liang-intensity-calibrator/media/source-frames'
$dst = 'E:/dsh_dynamic_adjust/anchored-monitor/assets/liang'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$map = @{ 'frame-00.png' = 'liang-0.png'; 'frame-06.png' = 'liang-1.png'; 'frame-12.png' = 'liang-2.png'; 'frame-18.png' = 'liang-3.png'; 'frame-24.png' = 'liang-4.png'; 'frame-30.png' = 'liang-5.png' }
foreach ($k in $map.Keys) {
  $path = Join-Path $src $k
  $img = [System.Drawing.Image]::FromFile($path)
  $bmp = New-Object System.Drawing.Bitmap 96, 96
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, 96, 96)
  $bmp.Save((Join-Path $dst $map[$k]), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Output ($map[$k] + ' done')
}