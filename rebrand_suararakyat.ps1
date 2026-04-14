$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Copy-Item -Path 'articles.json' -Destination "articles.json.bak.$timestamp" -Force

$counts = @{ main=0; article=0; css=0; package=0; docs=0; img=0; other=0 }

function Replace-InFile($path, $newContent) {
    Set-Content -Path $path -Value $newContent -Encoding UTF8
}

function Apply-TextTransforms($text) {
    $text = $text -replace '[\u201C\u201D]','"'
    $text = $text -replace '[\u2018\u2019]','\''
    $text = $text -replace '–','-'
    $text = $text -replace '—','-'
    $text = $text -replace [char]0x00A0,' '
    $text = $text -replace [char]0xFFFD,' '

    $text = $text -replace 'Indonesia Daily','Suara Rakyat'
    $text = $text -replace 'IndonesiaDaily','Suararakyat'
    $text = $text -replace 'indonesiadaily','suararakyat'
    $text = $text -replace 'IndonesiaDaily33@gmail\.com','suararakyat@gmail.com'
    $text = $text -replace 'indonesiadaily33@gmail\.com','suararakyat@gmail.com'

    $text = $text -replace 'https?://(www\.)?twitter\.com/indonesiadaily','https://twitter.com/suararakyat'
    $text = $text -replace 'https?://(www\.)?facebook\.com/indonesiadaily','https://facebook.com/suararakyat'
    $text = $text -replace 'https?://(www\.)?instagram\.com/indonesiadaily','https://instagram.com/suararakyat'
    $text = $text -replace 'https?://(www\.)?youtube\.com/@indonesiadaily','https://youtube.com/@suararakyat'
    $text = $text -replace 'https?://(www\.)?linkedin\.com/company/indonesiadaily','https://linkedin.com/company/suararakyat'

    $text = [regex]::Replace($text, "<img[^>]*?src=\"(?:\.\./)?img/logo\.png\"[^>]*>", 'SUARA RAKYAT', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    $text = [regex]::Replace($text, "(?i)<a\s+class=[\"']navbar-brand[\"'][^>]*>.*?</a>", '<a class="navbar-brand" href="index.html">SUARA<br>RAKYAT</a>', [System.Text.RegularExpressions.RegexOptions]::Singleline)

    # color variables
    $text = $text -replace '--primary:\s*#[0-9A-Fa-f]{6}','--primary: #B91C1C'
    $text = $text -replace '--dark:\s*#[0-9A-Fa-f]{6}','--dark: #3F0D0D'
    $text = $text -replace '--secondary:\s*#[0-9A-Fa-f]{6}','--secondary: #2C3E50'

    $text = $text -replace '#FFCC00','#B91C1C'
    $text = $text -replace '#31404B','#2C3E50'
    $text = $text -replace '#1E2024','#3F0D0D'
    $text = $text -replace '#1E3A8A','#B91C1C'
    $text = $text -replace '#0B1F3A','#3F0D0D'

    return $text
}

# Process HTML files
$files = Get-ChildItem -Recurse -Include *.html -File
foreach ($f in $files) {
    $text = Get-Content -Raw -Encoding UTF8 $f.FullName
    $newText = Apply-TextTransforms $text
    if ($newText -ne $text) {
        Replace-InFile $f.FullName $newText
        if ($f.DirectoryName -like '*\\article') { $counts.article++ } else { $counts.main++ }
    }
}

# CSS
$cssFiles = @('css/style.css','css/style.min.css')
foreach ($css in $cssFiles) {
    if (Test-Path $css) {
        $text = Get-Content -Raw -Encoding UTF8 $css
        $newText = Apply-TextTransforms $text
        if ($newText -ne $text) { Replace-InFile $css $newText; $counts.css++ }
    }
}

# packages
if (Test-Path 'package.json') {
    $p = Get-Content -Raw -Encoding UTF8 package.json
    $new = $p -replace '"name"\s*:\s*"[^"]+"','"name": "suararakyat"'
    if ($new -ne $p) { Replace-InFile 'package.json' $new; $counts.package++ }
}
if (Test-Path 'tools/package.json') {
    $p = Get-Content -Raw -Encoding UTF8 'tools/package.json'
    $new = $p -replace '"name"\s*:\s*"[^"]+"','"name": "suararakyat-article-generator"'
    $new = $new -replace '"description"\s*:\s*"[^"]+"','"description": "Generator artikel otomatis dari Google Sheets untuk Suara Rakyat"'
    if ($new -ne $p) { Replace-InFile 'tools/package.json' $new; $counts.package++ }
}

# docs
$docs = @('AUTOMATION_README.md','GOOGLE_DRIVE_GUIDE.md','netlify.toml')
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $text = Get-Content -Raw -Encoding UTF8 $doc
        $newText = Apply-TextTransforms $text
        if ($newText -ne $text) { Replace-InFile $doc $newText; $counts.docs++ }
    }
}

# remove old logo
if (Test-Path 'img/logo.png') {
    Remove-Item 'img/logo.png' -Force
    $counts.img++
}

# Verify no occurrences
$errors = @()
$check = Get-ChildItem -Recurse -Include *.html,*.md,*.toml,*.json -File
foreach ($f in $check) {
    $content = Get-Content -Raw -Encoding UTF8 $f.FullName
    if ($content -match 'Indonesia Daily|indonesiadaily|IndonesiaDaily') { $errors += $f.FullName }
    if ($content -match 'logo\.png') { $errors += $f.FullName }
}

Write-Output "COUNTS: $($counts | ForEach-Object { $_.Key + '=' + $_.Value } )"
if ($errors.Count -gt 0) {
    Write-Output "FOUND POST-CHECK RESIDUES: $($errors.Count) files"
    $errors | Select-Object -First 20
} else {
    Write-Output 'RESIDUE CHECK PASSED'
}
