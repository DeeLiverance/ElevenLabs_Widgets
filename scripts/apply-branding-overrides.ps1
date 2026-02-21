#Requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NewLineStyle {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    if ($Content.Contains("`r`n")) {
        return "`r`n"
    }

    return "`n"
}

function Read-TextFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return [System.IO.File]::ReadAllText($Path)
}

function Write-TextFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Apply-RegexRule {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Pattern,
        [Parameter(Mandatory = $true)]
        [string]$Replacement,
        [switch]$IgnoreCase
    )

    $options = [System.Text.RegularExpressions.RegexOptions]::Multiline
    if ($IgnoreCase) {
        $options = $options -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    }

    return [System.Text.RegularExpressions.Regex]::Replace($Content, $Pattern, $Replacement, $options)
}

function Ensure-ConvAiPoweredByOverride {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $targetProp = 'poweredByTextOverride="Powered by GRABiT-Labs"'

    if ($Content -match 'poweredByTextOverride\s*=') {
        return Apply-RegexRule -Content $Content -Pattern 'poweredByTextOverride\s*=\s*"[^"]*"' -Replacement $targetProp -IgnoreCase
    }

    $newLine = Get-NewLineStyle -Content $Content
    $insertPattern = '(providerOffsetY=\{[^}]+\})'
    $replacement = '$1' + $newLine + '          ' + $targetProp

    return [System.Text.RegularExpressions.Regex]::Replace($Content, $insertPattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline, [TimeSpan]::FromSeconds(2))
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$targetFiles = @(
    "widgets/EL_widget/app/(examples)/convai-replica/ConvAIReplicaClient.tsx",
    "vendor/EL_ui/apps/www/registry/elevenlabs-ui/blocks/realtime-transcriber-01/page.tsx",
    "vendor/EL_ui/apps/www/public/r/realtime-transcriber-01.json",
    "vendor/EL_ui/apps/www/registry/elevenlabs-ui/blocks/voice-form-01/page.tsx",
    "vendor/EL_ui/apps/www/public/r/voice-form-01.json"
)

$brandingRules = @(
    @{
        Pattern = 'Powered by ElevenLabs(?:\.com)? Speech to Text'
        Replacement = 'Powered by GRABiT-Labs.com Speech to Text'
    },
    @{
        Pattern = 'Powered by ElevenLabs(?:\.com)? Scribe'
        Replacement = 'Powered by GRABiT-Labs.com Scribe'
    },
    @{
        Pattern = 'Powered by ElevenLabs Agents?'
        Replacement = 'Powered by GRABiT-Labs'
    }
)

$changedFiles = New-Object System.Collections.Generic.List[string]
$missingFiles = New-Object System.Collections.Generic.List[string]

foreach ($relativePath in $targetFiles) {
    $absolutePath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        $missingFiles.Add($relativePath)
        continue
    }

    $original = Read-TextFile -Path $absolutePath
    $updated = $original

    foreach ($rule in $brandingRules) {
        $updated = Apply-RegexRule -Content $updated -Pattern $rule.Pattern -Replacement $rule.Replacement -IgnoreCase
    }

    if ($relativePath -eq "widgets/EL_widget/app/(examples)/convai-replica/ConvAIReplicaClient.tsx") {
        $updated = Ensure-ConvAiPoweredByOverride -Content $updated
    }

    if ($updated -ne $original) {
        $changedFiles.Add($relativePath)
        if (-not $CheckOnly) {
            Write-TextFile -Path $absolutePath -Content $updated
        }
    }
}

if ($changedFiles.Count -gt 0) {
    if ($CheckOnly) {
        Write-Host "Branding drift detected in $($changedFiles.Count) file(s):" -ForegroundColor Yellow
    } else {
        Write-Host "Branding overrides applied to $($changedFiles.Count) file(s):" -ForegroundColor Green
    }
    foreach ($file in $changedFiles) {
        Write-Host "  - $file"
    }
} else {
    Write-Host "No branding changes needed." -ForegroundColor Green
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Skipped missing file(s):" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file"
    }
}

if ($CheckOnly -and $changedFiles.Count -gt 0) {
    exit 2
}

exit 0
