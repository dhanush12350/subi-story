# PowerShell Local Static HTTP Server for Subi Website
$port = 8080
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
    Write-Host "  Subi Story Website is running locally at:" -ForegroundColor Cyan
    Write-Host "  $prefix" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
} catch {
    Write-Host "Failed to start listener on port $port : $_" -ForegroundColor Red
    exit 1
}

$rootDir = $PSScriptRoot

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $filePath = [System.IO.Path]::Combine($rootDir, $urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()

            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".png"  { $response.ContentType = "image/png" }
                ".mp3"  { $response.ContentType = "audio/mpeg" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $buf.Length
            $response.OutputStream.Write($buf, 0, $buf.Length)
        }
        $response.Close()
    } catch {
        # Continue listening on context errors
    }
}
