# git-lfs-interactive.ps1

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║           Git LFS 交互式批量上传工具                     ║
║           智能批量上传图片文件到 Git 仓库                ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
# ==================== 第 0 部分：SSH 配置检查 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "第 0 步：SSH 连接检查和配置" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# git-lfs-interactive-ssh.ps1

# ==================== SSH 配置检查 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "SSH 连接检查和配置" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# 检查当前远程 URL
Write-Host "`n🔗 检查当前远程仓库配置..." -ForegroundColor Gray
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    $remoteUrl = "未设置远程仓库"
}

Write-Host "   当前远程 URL: $remoteUrl" -ForegroundColor Gray

# 检查是 HTTPS 还是 SSH
if ($remoteUrl -match "^https://") {
    Write-Host "   ⚠  当前使用 HTTPS 连接" -ForegroundColor Yellow
    
    # 询问是否切换到 SSH
    Write-Host "`n🚀 是否切换到 SSH 连接？" -ForegroundColor Cyan
    Write-Host "   SSH 优势:" -ForegroundColor Gray
    Write-Host "   • 更稳定，适合大文件推送" -ForegroundColor Gray
    Write-Host "   • 免密推送，无需每次输入凭据" -ForegroundColor Gray
    Write-Host "   • 网络适应性更好" -ForegroundColor Gray
    
    $switchToSSH = Read-Host "   切换为 SSH 连接？ (Y/N)"
    if ($switchToSSH -eq 'Y' -or $switchToSSH -eq 'y') {
        # 从 HTTPS URL 提取用户名和仓库名
        if ($remoteUrl -match "github\.com/([^/]+)/([^/.]+)") {
            $userName = $matches[1]
            $repoName = $matches[2].Replace(".git", "")
            $sshUrl = "git@github.com:$userName/$repoName.git"
            
            Write-Host "   切换为 SSH URL: $sshUrl" -ForegroundColor Green
            git remote set-url origin $sshUrl
            
            # 验证切换
            $newUrl = git remote get-url origin
            Write-Host "   新的远程 URL: $newUrl" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ 无法解析 HTTPS URL" -ForegroundColor Red
            $sshUrl = Read-Host "   请输入 SSH URL (格式: git@github.com:用户名/仓库名.git)"
            git remote set-url origin $sshUrl
        }
    }
}
elseif ($remoteUrl -match "^git@github\.com") {
    Write-Host "   ✅ 当前使用 SSH 连接" -ForegroundColor Green
}
else {
    Write-Host "   ⚠  无法识别的远程 URL 格式" -ForegroundColor Yellow
}

# 测试 SSH 连接
Write-Host "`n🔐 测试 SSH 连接到 GitHub..." -ForegroundColor Gray
$sshTest = ssh -T git@github.com 2>&1
if ($LASTEXITCODE -eq 1) {
    # SSH 连接成功但 GitHub 不提供 shell 访问（这是正常的）
    if ($sshTest -match "successfully authenticated") {
        Write-Host "   ✅ SSH 连接测试成功" -ForegroundColor Green
        Write-Host "      $sshTest" -ForegroundColor Gray
    }
    else {
        Write-Host "   ❌ SSH 连接测试失败" -ForegroundColor Red
        Write-Host "      错误信息: $sshTest" -ForegroundColor Red
    }
}
elseif ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ SSH 连接测试成功" -ForegroundColor Green
}
else {
    Write-Host "   ❌ SSH 连接测试失败，错误代码: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "      错误信息: $sshTest" -ForegroundColor Red
}

# 检查 SSH 密钥
Write-Host "`n🔑 检查 SSH 密钥配置..." -ForegroundColor Gray
$sshKey = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" -ErrorAction SilentlyContinue
$sshKeyRSA = Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub" -ErrorAction SilentlyContinue

if ($sshKey -or $sshKeyRSA) {
    if ($sshKey) {
        Write-Host "   ✅ 找到 ED25519 SSH 密钥" -ForegroundColor Green
        $keyType = "ed25519"
        $keyPath = "$env:USERPROFILE\.ssh\id_ed25519.pub"
    }
    else {
        Write-Host "   ✅ 找到 RSA SSH 密钥" -ForegroundColor Green
        $keyType = "rsa"
        $keyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
    }
    
    # 显示密钥指纹
    Write-Host "   📋 密钥位置: $keyPath" -ForegroundColor Gray
    if ($keyType -eq "ed25519") {
        $fingerprint = ssh-keygen -l -f "$env:USERPROFILE\.ssh\id_ed25519" 2>&1
    }
    else {
        $fingerprint = ssh-keygen -l -f "$env:USERPROFILE\.ssh\id_rsa" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   🔍 密钥指纹: $fingerprint" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ⚠  未找到 SSH 密钥" -ForegroundColor Yellow
    Write-Host "      请运行: ssh-keygen -t ed25519 -C 'your_email@example.com'" -ForegroundColor Gray
    Write-Host "      然后将公钥添加到 GitHub: https://github.com/settings/keys" -ForegroundColor Gray
}
# 检查当前分支是否领先于远程分支
$localCommits = git log origin/main..main --oneline
if ($localCommits) {
    $localCommitCount = ($localCommits | Measure-Object).Count
    Write-Host "⚠  你的本地分支领先远程分支 $localCommitCount 个提交" -ForegroundColor Yellow
    Write-Host "未推送的提交：" -ForegroundColor Yellow
    foreach ($commit in $localCommits) {
        Write-Host "   $commit" -ForegroundColor Gray
    }
    
    Write-Host "`n是否先推送这些提交？" -ForegroundColor Cyan
    Write-Host "   [Y] 是 - 先推送本地提交" -ForegroundColor Green
    Write-Host "   [N] 否 - 继续上传新文件（可能导致冲突）" -ForegroundColor Yellow
    Write-Host "   [Q] 退出 - 取消操作" -ForegroundColor Red
    
    $pushExistingChoice = Read-Host "请选择 (Y/N/Q)"
    if ($pushExistingChoice -eq 'Y' -or $pushExistingChoice -eq 'y') {
        Write-Host "正在推送现有提交..." -ForegroundColor Gray
        git push origin
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ 现有提交推送成功" -ForegroundColor Green
        } else {
            Write-Host "❌ 现有提交推送失败" -ForegroundColor Red
            # 可以选择让用户决定是否继续
            $continueChoice = Read-Host "是否继续上传新文件？ (Y/N)"
            if ($continueChoice -ne 'Y' -and $continueChoice -ne 'y') {
                exit
            }
        }
    }
    elseif ($pushExistingChoice -eq 'Q' -or $pushExistingChoice -eq 'q') {
        exit
    }
    # 如果选择N，则继续上传新文件
}
# 优化 Git 配置
Write-Host "`n⚙️  优化 Git 配置..." -ForegroundColor Gray

# 设置推送默认方式
$currentPushDefault = git config --get push.default
if (-not $currentPushDefault) {
    git config push.default simple
    Write-Host "   设置 push.default 为 simple" -ForegroundColor Green
}

# 设置大型文件缓冲区
git config http.postBuffer 524288000
Write-Host "   设置 http.postBuffer 为 500MB" -ForegroundColor Green

# 设置 Git LFS 并发传输
git config lfs.concurrenttransfers 8
Write-Host "   设置 LFS 并发传输数为 8" -ForegroundColor Green

# 检查 Git LFS
Write-Host "`n🔍 检查 Git LFS 配置..." -ForegroundColor Gray
$lfsVersion = git lfs version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Git LFS 已安装: $lfsVersion" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Git LFS 未安装" -ForegroundColor Red
    Write-Host "      请从 https://git-lfs.github.com/ 安装 Git LFS" -ForegroundColor Yellow
}

# 测试 Git 操作
Write-Host "`n🧪 测试 Git 操作..." -ForegroundColor Gray

# 测试 fetch（不实际下载内容）
Write-Host "   测试远程连接..." -ForegroundColor Gray
$gitFetch = git fetch --dry-run 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ 远程连接正常" -ForegroundColor Green
}
else {
    Write-Host "   ⚠  远程连接测试异常: $gitFetch" -ForegroundColor Yellow
}

# 显示当前分支状态
Write-Host "   当前分支状态:" -ForegroundColor Gray
git status --short --branch 2>&1 | Select-Object -First 3 | ForEach-Object {
    Write-Host "      $_" -ForegroundColor Gray
}

Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "SSH 配置完成！" -ForegroundColor Green
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# 现在可以继续运行上传脚本...
# 下面是之前脚本的继续...

# ==================== 步骤 1: 环境检查 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 1: 环境检查" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# 检查当前目录
$currentDir = Get-Location
Write-Host "📁 当前工作目录: $currentDir" -ForegroundColor Gray

# 检查是否为 Git 仓库
if (-not (Test-Path ".git")) {
    Write-Host "❌ 错误: 当前目录不是 Git 仓库" -ForegroundColor Red
    Write-Host "   请在 Git 仓库根目录中运行此脚本" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ 当前目录是 Git 仓库" -ForegroundColor Green

# 检查 Git LFS 是否已安装
Write-Host "`n🔍 检查 Git LFS 状态..." -ForegroundColor Gray
try {
    $lfsVersion = git lfs version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git LFS 已安装: $lfsVersion" -ForegroundColor Green
    }
    else {
        throw "Git LFS 命令执行失败"
    }
}
catch {
    Write-Host "❌ Git LFS 未正确安装或初始化" -ForegroundColor Red
    Write-Host "   请运行: git lfs install" -ForegroundColor Yellow
    exit 1
}

# 检查 .gitattributes 文件
Write-Host "`n📄 检查 .gitattributes 文件..." -ForegroundColor Gray
if (Test-Path ".gitattributes") {
    Write-Host "✓ 找到 .gitattributes 文件" -ForegroundColor Green
    
    # 显示 LFS 跟踪规则
    $lfsRules = Select-String -Path ".gitattributes" -Pattern "filter=lfs" | ForEach-Object { $_.Line }
    if ($lfsRules) {
        Write-Host "📋 当前的 LFS 跟踪规则:" -ForegroundColor Cyan
        foreach ($rule in $lfsRules) {
            Write-Host "   $rule" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "⚠  警告: .gitattributes 中没有找到 LFS 跟踪规则" -ForegroundColor Yellow
        Write-Host "   你可能需要运行: git lfs track '*.jpg'" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠  警告: 没有找到 .gitattributes 文件" -ForegroundColor Yellow
    Write-Host "   你可能需要运行: git lfs track '*.jpg'" -ForegroundColor Yellow
}

# ==================== 步骤 2: 扫描图片文件 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 2: 扫描图片文件" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# 询问要扫描的文件类型
Write-Host "`n📸 选择要扫描的图片文件类型:" -ForegroundColor Cyan
Write-Host "   [1] JPG 文件 (*.jpg, *.jpeg)" -ForegroundColor Gray
Write-Host "   [2] PNG 文件 (*.png)" -ForegroundColor Gray
Write-Host "   [3] 所有图片文件 (*.jpg, *.jpeg, *.png, *.gif, *.bmp)" -ForegroundColor Gray
Write-Host "   [4] 自定义文件类型" -ForegroundColor Gray

$scanChoice = Read-Host "`n请选择 (1-4) 或直接按回车使用默认[JPG]"

$filePatterns = @()
switch ($scanChoice) {
    "2" { $filePatterns = @("*.png") }
    "3" { $filePatterns = @("*.jpg", "*.jpeg", "*.png", "*.gif", "*.bmp", "*.tiff") }
    "4" {
        $customPattern = Read-Host "请输入文件模式 (例如: *.jpg 或 *.png)"
        $filePatterns = @($customPattern)
    }
    default { $filePatterns = @("*.jpg", "*.jpeg") }
}

Write-Host "🔍 正在扫描文件模式: $($filePatterns -join ', ')" -ForegroundColor Gray

# 扫描文件
$allFiles = @()
foreach ($pattern in $filePatterns) {
    $files = Get-ChildItem -Recurse -Filter $pattern -File | Where-Object { $_.FullName -notlike "*\.git*" }
    $allFiles += $files
}

if ($allFiles.Count -eq 0) {
    Write-Host "❌ 没有找到匹配的图片文件" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 找到 $($allFiles.Count) 个图片文件" -ForegroundColor Green

# 检查哪些文件已经被 Git 跟踪
Write-Host "`n🔍 检查文件 Git 状态..." -ForegroundColor Gray
$untrackedFiles = @()
$trackedFiles = @()
$lfsFiles = @()

foreach ($file in $allFiles) {
    $relativePath = Resolve-Path -Relative $file.FullName
    $gitStatus = git status --porcelain $relativePath 2>&1
    
    if ($gitStatus -match "^\?\? ") {
        $untrackedFiles += @{
            FullPath = $file.FullName
            RelativePath = $relativePath
            Name = $file.Name
            Extension = $file.Extension
            Size = $file.Length
        }
    }
    else {
        $trackedFiles += $relativePath
    }
}

# 检查 LFS 文件
if (Test-Path ".gitattributes") {
    $lfsTracked = Get-Content ".gitattributes" | Where-Object { $_ -match "filter=lfs" }
    $lfsPatterns = $lfsTracked | ForEach-Object { 
        $_.Split(" ")[0].Trim()
    }
    
    foreach ($file in $untrackedFiles) {
        foreach ($pattern in $lfsPatterns) {
            if ($file.RelativePath -like $pattern) {
                $lfsFiles += $file
                break
            }
        }
    }
}

Write-Host "📊 文件状态统计:" -ForegroundColor Cyan
Write-Host "   📄 未跟踪文件: $($untrackedFiles.Count)" -ForegroundColor Yellow
Write-Host "   ✅ 已跟踪文件: $($trackedFiles.Count)" -ForegroundColor Green
if ($lfsFiles.Count -gt 0) {
    Write-Host "   🔗 将被 LFS 跟踪: $($lfsFiles.Count)" -ForegroundColor Cyan
}

# ==================== 步骤 3: 显示文件详情 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 3: 文件详情预览" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

if ($untrackedFiles.Count -gt 0) {
    # 按文件类型分组统计
    Write-Host "`n📈 按文件类型统计:" -ForegroundColor Cyan
    $typeStats = $untrackedFiles | Group-Object Extension | Sort-Object Count -Descending
    foreach ($group in $typeStats) {
        $count = $group.Count
        $totalSize = ($group.Group | Measure-Object -Property Size -Sum).Sum
        $avgSize = [math]::Round($totalSize / $count / 1024, 2)
        $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
        
        Write-Host "   $($group.Name): $count 个文件, ${totalSizeMB}MB, 平均 ${avgSize}KB/文件" -ForegroundColor Gray
    }
    
    # 显示文件大小分布
    $totalSizeAll = ($untrackedFiles | Measure-Object -Property Size -Sum).Sum
    $totalSizeMBAll = [math]::Round($totalSizeAll / 1MB, 2)
    Write-Host "`n📦 总文件大小: ${totalSizeMBAll}MB" -ForegroundColor Yellow
    
    # 按大小分组
    $smallFiles = $untrackedFiles | Where-Object { $_.Size -lt 1MB } | Measure-Object
    $mediumFiles = $untrackedFiles | Where-Object { $_.Size -ge 1MB -and $_.Size -lt 5MB } | Measure-Object
    $largeFiles = $untrackedFiles | Where-Object { $_.Size -ge 5MB } | Measure-Object
    
    Write-Host "   📄 小文件 (<1MB): $($smallFiles.Count) 个" -ForegroundColor Gray
    Write-Host "   📦 中文件 (1-5MB): $($mediumFiles.Count) 个" -ForegroundColor Gray
    Write-Host "   🚀 大文件 (>5MB): $($largeFiles.Count) 个" -ForegroundColor Gray
    
    # 显示目录分布
    Write-Host "`n📁 按目录分布:" -ForegroundColor Cyan
    $dirStats = $untrackedFiles | ForEach-Object { 
        Split-Path $_.RelativePath -Parent 
    } | Group-Object | Sort-Object Count -Descending | Select-Object -First 5
    
    foreach ($dir in $dirStats) {
        Write-Host "   $($dir.Name): $($dir.Count) 个文件" -ForegroundColor Gray
    }
}

# 预览文件列表
Write-Host "`n👀 是否预览文件列表？" -ForegroundColor Cyan
Write-Host "   [1] 预览前20个文件" -ForegroundColor Gray
Write-Host "   [2] 按文件大小排序预览" -ForegroundColor Gray
Write-Host "   [3] 按目录预览" -ForegroundColor Gray
Write-Host "   [4] 跳过预览" -ForegroundColor Gray

$previewChoice = Read-Host "`n请选择 (1-4)"
switch ($previewChoice) {
    "1" {
        Write-Host "`n📋 前20个文件:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(20, $untrackedFiles.Count); $i++) {
            $sizeKB = [math]::Round($untrackedFiles[$i].Size / 1024, 2)
            Write-Host "   $($untrackedFiles[$i].RelativePath) (${sizeKB}KB)" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host "`n📊 按文件大小排序 (前20个):" -ForegroundColor Cyan
        $sortedBySize = $untrackedFiles | Sort-Object Size -Descending | Select-Object -First 20
        foreach ($file in $sortedBySize) {
            $sizeMB = [math]::Round($file.Size / 1MB, 2)
            Write-Host "   ${sizeMB}MB - $($file.RelativePath)" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "`n📁 按目录分组:" -ForegroundColor Cyan
        $byDir = $untrackedFiles | Group-Object { Split-Path $_.RelativePath -Parent } | Sort-Object Count -Descending
        foreach ($dirGroup in $byDir) {
            Write-Host "`n   $($dirGroup.Name):" -ForegroundColor Yellow
            foreach ($file in $dirGroup.Group | Select-Object -First 5) {
                Write-Host "      $($file.Name)" -ForegroundColor Gray
            }
            if ($dirGroup.Count -gt 5) {
                Write-Host "      ... 还有 $($dirGroup.Count - 5) 个文件" -ForegroundColor DarkGray
            }
        }
    }
}

# ==================== 步骤 4: 配置上传参数 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 4: 配置上传参数" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

Write-Host "`n⚙️  配置批量上传参数" -ForegroundColor Cyan

# 批次大小
$defaultBatchSize = 10
Write-Host "`n📦 设置每批次上传的文件数量" -ForegroundColor Gray
Write-Host "   当前有 $($untrackedFiles.Count) 个文件需要上传" -ForegroundColor Gray
Write-Host "   建议批次大小:" -ForegroundColor Gray
Write-Host "   [1] 小批次 (5个文件/批) - 适合不稳定网络" -ForegroundColor Gray
Write-Host "   [2] 中批次 (10个文件/批) - 平衡选择" -ForegroundColor Gray
Write-Host "   [3] 大批次 (20个文件/批) - 适合稳定网络" -ForegroundColor Gray
Write-Host "   [4] 自定义数量" -ForegroundColor Gray

$batchChoice = Read-Host "`n请选择 (1-4) 或直接按回车使用默认[10个]"
switch ($batchChoice) {
    "1" { $batchSize = 5 }
    "2" { $batchSize = 10 }
    "3" { $batchSize = 20 }
    "4" {
        $customBatch = Read-Host "请输入每批文件数量"
        if ([int]::TryParse($customBatch, [ref]$batchSize) -and $batchSize -gt 0) {
            Write-Host "✓ 使用自定义批次大小: $batchSize" -ForegroundColor Green
        }
        else {
            Write-Host "⚠  输入无效，使用默认值: 10" -ForegroundColor Yellow
            $batchSize = 10
        }
    }
    default { $batchSize = $defaultBatchSize }
}

# 重试次数
Write-Host "`n🔄 设置失败重试次数" -ForegroundColor Gray
$retryChoice = Read-Host "输入重试次数 (默认: 3)"
# 修复：先初始化变量
$maxRetries = 0

if ([int]::TryParse($retryChoice, [ref]$maxRetries) -and $maxRetries -ge 0) {
    Write-Host "✓ 设置最大重试次数: $maxRetries" -ForegroundColor Green
}
else {
    $maxRetries = 3
    Write-Host "✓ 使用默认重试次数: 3" -ForegroundColor Green
}

# 批次间隔
Write-Host "`n⏱️  设置批次间隔时间" -ForegroundColor Gray
Write-Host "   为避免请求过快，建议设置批次间隔" -ForegroundColor Gray
$delayChoice = Read-Host "输入间隔秒数 (默认: 5)"
$batchDelay = 0
if ([int]::TryParse($delayChoice, [ref]$batchDelay) -and $batchDelay -ge 0) {
    Write-Host "✓ 设置批次间隔: ${batchDelay}秒" -ForegroundColor Green
}
else {
    $batchDelay = 5
    Write-Host "✓ 使用默认间隔: 5秒" -ForegroundColor Green
}

# 提交信息模板
Write-Host "`n💬 设置提交信息模板" -ForegroundColor Gray
Write-Host "   提交信息将包含以下变量:" -ForegroundColor Gray
Write-Host "   {batch} - 批次号" -ForegroundColor Gray
Write-Host "   {count} - 本批文件数量" -ForegroundColor Gray
Write-Host "   {size} - 本批文件大小(MB)" -ForegroundColor Gray
Write-Host "   示例: '添加图片 - 第{batch}批 ({count}个文件, {size}MB)'" -ForegroundColor Gray

$commitTemplate = Read-Host "`n输入提交信息模板 (默认: '添加图片文件 - 第{batch}批 ({count}个文件)')"
if ([string]::IsNullOrWhiteSpace($commitTemplate)) {
    $commitTemplate = "添加图片文件 - 第{batch}批 ({count}个文件)"
}

# 显示配置摘要
Write-Host "`n📋 配置摘要:" -ForegroundColor Cyan
Write-Host "   📦 每批文件数: $batchSize" -ForegroundColor Gray
Write-Host "   🔄 最大重试次数: $maxRetries" -ForegroundColor Gray
Write-Host "   ⏱️  批次间隔: ${batchDelay}秒" -ForegroundColor Gray
Write-Host "   💬 提交信息模板: $commitTemplate" -ForegroundColor Gray
Write-Host "   📄 总文件数: $($untrackedFiles.Count)" -ForegroundColor Gray
Write-Host "   📊 预计批次: $([math]::Ceiling($untrackedFiles.Count / $batchSize))" -ForegroundColor Gray

# ==================== 步骤 5: 开始上传 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 5: 开始上传" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

Write-Host "`n🚀 准备开始上传..." -ForegroundColor Cyan
Write-Host "   上传前请确认:" -ForegroundColor Gray
Write-Host "   1. 网络连接正常" -ForegroundColor Gray
Write-Host "   2. Git 配置正确" -ForegroundColor Gray
Write-Host "   3. 有足够的存储配额" -ForegroundColor Gray

$confirm = Read-Host "`n是否开始上传？ (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "❌ 上传已取消" -ForegroundColor Red
    exit 0
}

# 上传进度显示函数
function Show-Progress {
    param(
        [int]$Current,
        [int]$Total,
        [int]$Batch,
        [int]$TotalBatches,
        [string]$Status
    )
    
    $percent = if ($Total -gt 0) { [math]::Round(($Current / $Total) * 100, 1) } else { 0 }
    $progressBarLength = 30
    $filledLength = [math]::Round($progressBarLength * $Current / $Total)
    $bar = '█' * $filledLength + '░' * ($progressBarLength - $filledLength)
    
    Write-Host "`n" + ("─" * 60) -ForegroundColor DarkGray
    Write-Host "📊 进度: [$bar] $percent%" -ForegroundColor Cyan
    Write-Host "   📄 文件: $Current/$Total ($percent%)" -ForegroundColor Gray
    Write-Host "   📦 批次: $Batch/$TotalBatches" -ForegroundColor Gray
    if (-not [string]::IsNullOrEmpty($Status)) {
        Write-Host "   📝 状态: $Status" -ForegroundColor Yellow
    }
    Write-Host ("─" * 60) -ForegroundColor DarkGray
}

# 上传函数
function Upload-Batch {
    param(
        [array]$Files,
        [int]$BatchNumber,
        [int]$TotalBatches
    )
    
    Write-Host "`n🔄 处理第 $BatchNumber/$TotalBatches 批" -ForegroundColor Cyan
    Write-Host "   📄 本批文件数: $($Files.Count)" -ForegroundColor Gray
    
    # 计算本批大小
    $batchSizeMB = 0
    foreach ($file in $Files) {
        $batchSizeMB += [math]::Round($file.Size / 1MB, 2)
    }
    Write-Host "   📦 本批大小: ${batchSizeMB}MB" -ForegroundColor Gray
    
    # 显示本批文件
    Write-Host "   📋 文件列表:" -ForegroundColor Gray
    foreach ($file in $Files) {
        $fileSizeKB = [math]::Round($file.Size / 1024, 2)
        Write-Host "      $($file.RelativePath) (${fileSizeKB}KB)" -ForegroundColor DarkGray
    }
    
    # 确认是否处理本批
    Write-Host "`n   ❓ 是否处理这个批次？" -ForegroundColor Yellow
    Write-Host "      [Y] 是 - 处理并上传" -ForegroundColor Green
    Write-Host "      [S] 跳过 - 跳过这个批次" -ForegroundColor Gray
    Write-Host "      [Q] 退出 - 停止上传" -ForegroundColor Red
    
    $choice = Read-Host "   请选择 (Y/S/Q)"
    if ($choice -eq 'S' -or $choice -eq 's') {
        Write-Host "   ⏭️  跳过第 $BatchNumber 批" -ForegroundColor Yellow
        return @{ Success = $false; Skipped = $true }
    }
    elseif ($choice -eq 'Q' -or $choice -eq 'q') {
        Write-Host "   🛑 用户请求停止" -ForegroundColor Red
        return @{ Success = $false; Stopped = $true }
    }
    
    # 添加到暂存区
    Write-Host "   📤 添加到暂存区..." -ForegroundColor Gray
    $addedCount = 0
    foreach ($file in $Files) {
        $result = git add $file.RelativePath 2>&1
        if ($LASTEXITCODE -eq 0) {
            $addedCount++
            Write-Host "      ✓ $($file.Name)" -ForegroundColor DarkGreen
        }
        else {
            Write-Host "      ✗ $($file.Name) - 添加失败" -ForegroundColor Red
            Write-Host "        错误: $result" -ForegroundColor DarkRed
        }
    }
    
    if ($addedCount -eq 0) {
        Write-Host "   ⚠  没有文件成功添加，跳过本批" -ForegroundColor Yellow
        return @{ Success = $false; Skipped = $true }
    }
    
    # 提交
    Write-Host "   📝 提交更改..." -ForegroundColor Gray
    $commitMessage = $commitTemplate -replace "{batch}", $BatchNumber -replace "{count}", $addedCount -replace "{size}", $batchSizeMB
    $commitResult = git commit -m $commitMessage 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ 提交成功: $commitMessage" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ 提交失败" -ForegroundColor Red
        Write-Host "     错误: $commitResult" -ForegroundColor DarkRed
        
        # 尝试撤销添加
        git reset HEAD 2>&1 | Out-Null
        return @{ Success = $false; Error = "提交失败" }
    }
    
    # 推送（带重试）
    Write-Host "   🚀 推送到远程仓库..." -ForegroundColor Gray
    $retryCount = 0
    $pushSuccess = $false
    
    while ($retryCount -lt $maxRetries -and -not $pushSuccess) {
        $retryCount++
        
        if ($retryCount -gt 1) {
            Write-Host "   🔄 第 $retryCount 次重试 (共 $maxRetries 次)..." -ForegroundColor Yellow
        }
        
        $pushResult = git push origin 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ 推送成功!" -ForegroundColor Green
            $pushSuccess = $true
        }
        else {
            Write-Host "   ❌ 推送失败" -ForegroundColor Red
            Write-Host "     错误: $pushResult" -ForegroundColor DarkRed
            
            if ($retryCount -lt $maxRetries) {
                $waitTime = $retryCount * 5  # 指数退避
                Write-Host "     等待 ${waitTime}秒后重试..." -ForegroundColor Yellow
                Start-Sleep -Seconds $waitTime
            }
        }
    }
    
    if (-not $pushSuccess) {
        Write-Host "   ⚠  推送失败，已达到最大重试次数" -ForegroundColor Red
        
        Write-Host "`n   ❓ 如何处理失败？" -ForegroundColor Yellow
        Write-Host "      [R] 重试 - 再次尝试当前批次" -ForegroundColor Green
        Write-Host "      [S] 跳过 - 跳过这个批次" -ForegroundColor Gray
        Write-Host "      [Q] 退出 - 停止上传" -ForegroundColor Red
        
        $failChoice = Read-Host "   请选择 (R/S/Q)"
        
        if ($failChoice -eq 'R' -or $failChoice -eq 'r') {
            return @{ Success = $false; Retry = $true }
        }
        elseif ($failChoice -eq 'Q' -or $failChoice -eq 'q') {
            return @{ Success = $false; Stopped = $true }
        }
        else {
            return @{ Success = $false; Skipped = $true }
        }
    }
    
    return @{ Success = $true; Processed = $addedCount }
}

# 开始批量处理
Write-Host "`n🎬 开始批量上传..." -ForegroundColor Green
Write-Host "   总文件数: $($untrackedFiles.Count)" -ForegroundColor Gray
Write-Host "   批次大小: $batchSize" -ForegroundColor Gray
Write-Host "   预计批次: $([math]::Ceiling($untrackedFiles.Count / $batchSize))" -ForegroundColor Gray

$totalFiles = $untrackedFiles.Count
$totalBatches = [math]::Ceiling($totalFiles / $batchSize)
$processedFiles = 0
$processedBatches = 0
$successfulBatches = 0
$skippedBatches = 0
$failedBatches = 0

$currentBatch = 0
$i = 0

while ($i -lt $totalFiles) {
    $currentBatch++
    
    # 获取当前批次的文件
    $batchFiles = @()
    $batchEnd = [Math]::Min($i + $batchSize - 1, $totalFiles - 1)
    
    for ($j = $i; $j -le $batchEnd; $j++) {
        $batchFiles += $untrackedFiles[$j]
    }
    
    # 显示进度
    Show-Progress -Current $processedFiles -Total $totalFiles -Batch $currentBatch -TotalBatches $totalBatches -Status "处理第 $currentBatch 批"
    
    # 处理当前批次
    $result = Upload-Batch -Files $batchFiles -BatchNumber $currentBatch -TotalBatches $totalBatches
    
    if ($result.Stopped) {
        Write-Host "🛑 上传已停止" -ForegroundColor Red
        break
    }
    elseif ($result.Retry) {
        Write-Host "🔄 重新处理当前批次..." -ForegroundColor Yellow
        continue  # 不增加 i，重新处理当前批次
    }
    elseif ($result.Skipped) {
        Write-Host "⏭️  跳过第 $currentBatch 批" -ForegroundColor Yellow
        $skippedBatches++
        $i += $batchSize  # 跳过整个批次
        continue
    }
    elseif ($result.Success) {
        Write-Host "✅ 第 $currentBatch 批处理完成!" -ForegroundColor Green
        $successfulBatches++
        $processedBatches++
        $processedFiles += $result.Processed
        
        # 移动到下一批
        $i += $batchSize
        
        # 如果不是最后一批，等待间隔
        if ($i -lt $totalFiles) {
            Write-Host "   ⏱️  等待 ${batchDelay}秒后继续下一批..." -ForegroundColor Gray
            Start-Sleep -Seconds $batchDelay
        }
    }
    else {
        Write-Host "❌ 第 $currentBatch 批处理失败" -ForegroundColor Red
        $failedBatches++
        $i += $batchSize  # 即使失败也移动到下一批
    }
}

# ==================== 步骤 6: 上传完成 ====================
Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "步骤 6: 上传完成" -ForegroundColor Yellow
Write-Host ("═" * 60) -ForegroundColor DarkCyan

Write-Host "`n🎉 批量上传完成!" -ForegroundColor Green
Write-Host "📊 最终统计:" -ForegroundColor Cyan

Write-Host "`n📈 批次统计:" -ForegroundColor Gray
Write-Host "   ✅ 成功批次: $successfulBatches" -ForegroundColor Green
Write-Host "   ⏭️  跳过年份: $skippedBatches" -ForegroundColor Yellow
Write-Host "   ❌ 失败批次: $failedBatches" -ForegroundColor Red
Write-Host "   📦 总计批次: $processedBatches" -ForegroundColor Gray

Write-Host "`n📄 文件统计:" -ForegroundColor Gray
Write-Host "   📤 已上传文件: $processedFiles" -ForegroundColor Green
Write-Host "   📭 剩余文件: $($totalFiles - $processedFiles)" -ForegroundColor Yellow
Write-Host "   📊 总文件数: $totalFiles" -ForegroundColor Gray

if ($processedFiles -gt 0) {
    Write-Host "`n📋 上传摘要:" -ForegroundColor Cyan
    $gitLog = git log --oneline -n 3 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   最近提交:" -ForegroundColor Gray
        foreach ($line in $gitLog) {
            Write-Host "   $line" -ForegroundColor DarkGray
        }
    }
    
    Write-Host "`n🔍 当前 Git 状态:" -ForegroundColor Cyan
    git status --short 2>&1 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    
    Write-Host "`n🔗 Git LFS 状态:" -ForegroundColor Cyan
    git lfs status 2>&1 | Select-Object -First 10 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
}

Write-Host "`n💡 下一步建议:" -ForegroundColor Yellow
Write-Host "   1. 运行 'git lfs ls-files' 查看 LFS 文件" -ForegroundColor Gray
Write-Host "   2. 运行 'git log --oneline' 查看提交历史" -ForegroundColor Gray
Write-Host "   3. 运行 'git status' 查看当前状态" -ForegroundColor Gray

if ($failedBatches -gt 0 -or $processedFiles -lt $totalFiles) {
    Write-Host "`n⚠  注意: 有文件未成功上传" -ForegroundColor Red
    Write-Host "   可以重新运行脚本上传剩余文件" -ForegroundColor Yellow
}

Write-Host "`n" + ("═" * 60) -ForegroundColor DarkCyan
Write-Host "脚本执行完成!" -ForegroundColor Green
Write-Host ("═" * 60) -ForegroundColor DarkCyan

# 可选：保存日志
$logChoice = Read-Host "`n是否保存本次操作日志？ (Y/N)"
if ($logChoice -eq 'Y' -or $logChoice -eq 'y') {
    $logFile = "git-lfs-upload-log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    $logContent = @"
Git LFS 批量上传日志
====================
时间: $(Get-Date)
目录: $currentDir

文件统计:
  总文件数: $totalFiles
  已上传: $processedFiles
  剩余: $($totalFiles - $processedFiles)

批次统计:
  成功批次: $successfulBatches
  跳过批次: $skippedBatches
  失败批次: $failedBatches
  总计批次: $processedBatches

配置:
  批次大小: $batchSize
  重试次数: $maxRetries
  批次间隔: ${batchDelay}秒
  提交模板: $commitTemplate
"@
    
    $logContent | Out-File -FilePath $logFile -Encoding UTF8
    Write-Host "📝 日志已保存到: $logFile" -ForegroundColor Green
}