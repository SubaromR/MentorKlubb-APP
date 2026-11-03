# MentorKlubb: csak ellenőriz, semmit nem telepít és nem módosít a gépen.
Write-Host 'MENTORKLUBB – WINDOWS FEJLESZTOI KORNYEZET ELLENORZESE' -ForegroundColor Cyan
$commands = @('node','npm','rustc','cargo')
foreach ($item in $commands) {
    $cmd = Get-Command $item -ErrorAction SilentlyContinue
    if ($cmd) {
        try {
            $version = & $item --version 2>&1 | Select-Object -First 1
            Write-Host "[OK] $item : $version" -ForegroundColor Green
        } catch {
            Write-Host "[HIBA] $item elerheto, de nem indul" -ForegroundColor Red
        }
    } else {
        Write-Host "[HIANYZIK] $item" -ForegroundColor Yellow
    }
}
$studio = @(
    "$env:ProgramFiles\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC",
    "$env:ProgramFiles\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC"
)
if ($studio | Where-Object { Test-Path $_ }) {
    Write-Host '[VALOSZINU OK] Visual Studio C++ build eszkozok – pontos ellenorzes az elso forditasnal' -ForegroundColor Green
} else {
    Write-Host '[ELLENORIZENDO] Visual Studio 2022 – Desktop development with C++' -ForegroundColor Yellow
}
Write-Host '---'
Write-Host 'A hianyzo elemeket a START_ITTD_MAGYARUL.md irja le.' -ForegroundColor Cyan
Write-Host 'Kuldd el az ellenorzes eredmenyet, es azzal folytatjuk.'
