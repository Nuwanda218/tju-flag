# Git LFS 迁移工具 - PowerShell 版本
# 用于将 .jpg 文件从 LFS 迁移到普通 Git 管理

param(
    [int]$BatchSize = 30,
    [switch]$Force = $false,
    [switch]$NoPush = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
$Host.UI.RawUI.ForegroundColor = "White"
function Write-Info { Write-Host "[INFO] $($args[0])" -ForegroundColor Cyan }
function Write-Success { Write-Host "[SUCCESS] $($args[0])" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $($args[0])" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $($args[0])" -ForegroundColor Red }
function Write-Step { Write-Host "[STEP] $($args[0])" -ForegroundColor Magenta }

# 检查 Git 仓库
function Test-IsGitRepository {
    if (-not (Test-Path .git)) {
        Write-Error "当前目录不是 Git 仓库！"
        exit 1
    }
}

# 检查 Git LFS 是否安装
function Test-GitLFSInstalled {
    try {
        git lfs version *>$null
        return $true
    } catch {
        return $false
    }
}

# 获取当前分支
function Get-CurrentBranch {
    return (git branch --show-current)
}

# 显示 LFS 文件统计
function Show-LFSStats {
    Write-Step "检查 LFS 状态..."
    
    $lfsFiles = git lfs ls-files
    $jpgFiles = $lfsFiles | Where-Object { $_ -match '\.jpg$' -or $_ -match '\.jpeg$' -or $_ -match '\.JPG$' -or $_ -match '\.JPEG$' }
    
    if ($jpgFiles.Count -eq 0) {
        Write-Warning "未找到被 LFS 跟踪的 .jpg 文件"
        return $false
    }
    
    Write-Host "`n========================================" -ForegroundColor DarkGray
    Write-Host "LFS 文件统计" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor DarkGray
    
    # 计算总大小
    $totalSize = 0
    foreach ($file in $jpgFiles) {
        # 解析文件大小（LFS 输出格式：oid sha256:xxx size 123456）
        if ($file -match 'size (\d+)') {
            $totalSize += [int]$matches[1]
        }
    }
    
    $sizeMB = [math]::Round($totalSize / 1MB, 2)
    $sizeGB = [math]::Round($totalSize / 1GB, 2)
    
    Write-Host "文件数量: $($jpgFiles.Count)" -ForegroundColor Yellow
    Write-Host "总大小: $sizeMB MB ($sizeGB GB)" -ForegroundColor Yellow
    
    # 显示前10个文件
    Write-Host "`n前10个文件:" -ForegroundColor White
    $jpgFiles | Select-Object -First 10 | ForEach-Object {
        $file = $_.Split()[-1]  # 获取文件名
        Write-Host "  - $file" -ForegroundColor Gray
    }
    
    if ($jpgFiles.Count -gt 10) {
        Write-Host "  ... 还有 $($jpgFiles.Count - 10) 个文件" -ForegroundColor DarkGray
    }
    
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host ""
    
    return $true
}

# 创建备份
function Create-Backup {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "lfs_backup_$timestamp"
    
    Write-Step "创建备份..."
    
    New-Item -ItemType Directory -Path $backupDir -Force *>$null
    
    # 备份 .gitattributes
    if (Test-Path .gitattributes) {
        Copy-Item .gitattributes "$backupDir/gitattributes.backup"
        Write-Info "已备份 .gitattributes"
    }
    
    # 备份 LFS 文件列表
    git lfs ls-files | Out-File "$backupDir/lfs_files.txt"
    Write-Info "已备份 LFS 文件列表"
    
    # 备份当前状态
    git status | Out-File "$backupDir/git_status.txt"
    
    Write-Success "备份已保存到: $backupDir"
    return $backupDir
}

# 修改 .gitattributes 文件
function Update-GitAttributes {
    Write-Step "更新 .gitattributes 文件..."
    
    if (-not (Test-Path .gitattributes)) {
        Write-Warning ".gitattributes 文件不存在，将创建新文件"
        New-Item .gitattributes -ItemType File *>$null
    }
    
    # 备份原文件
    $backupFile = ".gitattributes.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item .gitattributes $backupFile -Force
    
    # 读取内容并移除 .jpg 相关的 LFS 规则
    $content = Get-Content .gitattributes -Raw
    
    # 移除所有 .jpg 相关的 LFS 规则
    $patterns = @(
        '\.jpg.*filter=lfs.*diff=lfs.*merge=lfs.*-text',
        '\.jpeg.*filter=lfs.*diff=lfs.*merge=lfs.*-text',
        '\.JPG.*filter=lfs.*diff=lfs.*merge=lfs.*-text',
        '\.JPEG.*filter=lfs.*diff=lfs.*merge=lfs.*-text'
    )
    
    foreach ($pattern in $patterns) {
        $content = $content -replace "(?m)^.*$pattern.*$", ""
    }
    
    # 移除空行
    $content = $content -replace "(?m)^\s*`r`n", ""
    
    # 保存修改
    $content | Out-File .gitattributes -Encoding UTF8
    
    Write-Success ".gitattributes 已更新 (备份: $backupFile)"
}

# 停止 LFS 跟踪
function Stop-LFSTracking {
    Write-Step "停止 LFS 跟踪..."
    
    Write-Info "停止跟踪 .jpg 文件..."
    git lfs untrack "*.jpg" 2>$null
    git lfs untrack "*.JPG" 2>$null
    git lfs untrack "*.jpeg" 2>$null
    git lfs untrack "*.JPEG" 2>$null
    
    Write-Success "LFS 跟踪已停止"
}

# 获取 LFS 文件列表
function Get-LFSJpgFiles {
    $allFiles = @()
    $lfsFiles = git lfs ls-files
    
    foreach ($file in $lfsFiles) {
        if ($file -match '\.(jpg|jpeg|JPG|JPEG)$') {
            # 提取文件名（最后一列）
            $fileName = $file -split '\s+' | Select-Object -Last 1
            if ($fileName -and (Test-Path $fileName)) {
                $allFiles += $fileName
            }
        }
    }
    
    return $allFiles
}

# 处理单个批次
function Process-Batch {
    param(
        [array]$Files,
        [int]$BatchNumber,
        [int]$TotalBatches
    )
    
    $batchCount = $Files.Count
    Write-Step "处理批次 $BatchNumber/$TotalBatches ($batchCount 个文件)"
    
    # 处理每个文件
    $processed = 0
    $failed = 0
    
    foreach ($file in $Files) {
        $processed++
        
        # 显示进度
        if ($processed % 10 -eq 0 -or $processed -eq $batchCount) {
            Write-Host "  进度: $processed/$batchCount" -ForegroundColor Gray -NoNewline
            Write-Host "`r" -NoNewline
        }
        
        try {
            # 从缓存移除
            git rm --cached $file 2>$null
            
            # 重新添加到普通 Git
            git add $file 2>$null
            
            Write-Verbose "✓ $file"
        } catch {
            $failed++
            Write-Warning "处理失败: $file"
        }
    }
    
    Write-Host "`n"  # 换行
    
    # 提交这个批次
    if ($batchCount - $failed -gt 0) {
        Write-Info "提交批次 $BatchNumber..."
        $commitMessage = "迁移批次 $BatchNumber: $batchCount 个 .jpg 文件从 LFS 到普通 Git"
        git commit -m $commitMessage 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "批次 $BatchNumber 提交完成 (成功: $($batchCount - $failed), 失败: $failed)"
            return $true
        } else {
            Write-Error "批次 $BatchNumber 提交失败"
            return $false
        }
    } else {
        Write-Warning "批次 $BatchNumber 没有成功处理的文件"
        return $false
    }
}

# 推送批次
function Push-Batch {
    param(
        [int]$BatchNumber,
        [int]$MaxRetries = 3
    )
    
    Write-Step "推送批次 $BatchNumber..."
    
    for ($retry = 1; $retry -le $MaxRetries; $retry++) {
        Write-Info "推送尝试 $retry/$MaxRetries..."
        
        $pushOutput = git push 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "批次 $BatchNumber 推送成功 (尝试 $retry)"
            return $true
        } else {
            Write-Warning "批次 $BatchNumber 推送失败 (尝试 $retry)"
            Write-Host "错误信息: $pushOutput" -ForegroundColor DarkYellow
            
            if ($retry -lt $MaxRetries) {
                $waitTime = $retry * 30
                Write-Info "等待 ${waitTime}秒后重试..."
                Start-Sleep -Seconds $waitTime
            }
        }
    }
    
    Write-Error "批次 $BatchNumber 推送失败，已达到最大重试次数"
    return $false
}

# 清理 LFS 缓存
function Clean-LFSCache {
    Write-Step "清理 LFS 缓存..."
    
    Write-Info "当前 LFS 存储信息:"
    git lfs env | Select-String "Storage" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
    
    $choice = Read-Host "是否清理不再使用的 LFS 对象？(y/n)"
    if ($choice -eq 'y') {
        git lfs prune
        Write-Success "LFS 缓存已清理"
    } else {
        Write-Info "跳过 LFS 缓存清理"
    }
}

# 显示菜单
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host "   Git LFS 迁移工具 - PowerShell 版" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host ""
    
    $currentBranch = Get-CurrentBranch
    Write-Host "当前分支: $currentBranch" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "请选择操作:" -ForegroundColor White
    Write-Host "1) 查看 LFS 状态" -ForegroundColor Gray
    Write-Host "2) 创建备份" -ForegroundColor Gray
    Write-Host "3) 更新配置并停止 LFS 跟踪" -ForegroundColor Gray
    Write-Host "4) 分批迁移文件" -ForegroundColor Gray
    Write-Host "5) 清理 LFS 缓存" -ForegroundColor Gray
    Write-Host "6) 显示帮助信息" -ForegroundColor Gray
    Write-Host "7) 退出" -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "请输入选项 (1-7)"
    return $choice
}

# 主函数
function Main {
    Write-Host ""
    Write-Host "Git LFS 迁移工具启动..." -ForegroundColor Cyan
    Write-Host ""
    
    # 检查环境
    Test-IsGitRepository
    
    if (-not (Test-GitLFSInstalled)) {
        Write-Error "Git LFS 未安装！"
        Write-Host "请先安装 Git LFS: https://git-lfs.github.com/" -ForegroundColor Yellow
        exit 1
    }
    
    # 全局变量
    $global:BackupDir = $null
    $global:AllFiles = @()
    $global:BatchSize = $BatchSize
    
    # 主循环
    while ($true) {
        $choice = Show-Menu
        
        switch ($choice) {
            "1" {
                # 查看 LFS 状态
                Show-LFSStats
                Read-Host "按 Enter 继续..."
            }
            
            "2" {
                # 创建备份
                $global:BackupDir = Create-Backup
                Read-Host "按 Enter 继续..."
            }
            
            "3" {
                # 更新配置
                $confirm = Read-Host "确定要更新 .gitattributes 并停止 LFS 跟踪吗？(y/n)"
                if ($confirm -eq 'y') {
                    Update-GitAttributes
                    Stop-LFSTracking
                    Write-Success "配置已更新"
                }
                Read-Host "按 Enter 继续..."
            }
            
            "4" {
                # 分批迁移文件
                if (-not $global:AllFiles) {
                    $global:AllFiles = Get-LFSJpgFiles
                }
                
                if ($global:AllFiles.Count -eq 0) {
                    Write-Warning "没有找到需要处理的 .jpg 文件"
                    Read-Host "按 Enter 继续..."
                    continue
                }
                
                $confirm = Read-Host "找到 $($global:AllFiles.Count) 个文件，确定要开始分批迁移吗？(y/n)"
                if ($confirm -ne 'y') {
                    continue
                }
                
                # 询问批次大小
                $sizeInput = Read-Host "请输入每批处理的文件数 [默认: $global:BatchSize]"
                if ($sizeInput -and $sizeInput -match '^\d+$') {
                    $global:BatchSize = [int]$sizeInput
                }
                
                # 分批处理
                $totalFiles = $global:AllFiles.Count
                $batchCount = [math]::Ceiling($totalFiles / $global:BatchSize)
                
                Write-Info "总文件数: $totalFiles"
                Write-Info "批次大小: $global:BatchSize"
                Write-Info "总批次数: $batchCount"
                Write-Host ""
                
                # 处理每个批次
                for ($i = 0; $i -lt $batchCount; $i++) {
                    $startIdx = $i * $global:BatchSize
                    $endIdx = [math]::Min($startIdx + $global:BatchSize - 1, $totalFiles - 1)
                    
                    $batchFiles = $global:AllFiles[$startIdx..$endIdx]
                    $batchNum = $i + 1
                    
                    Write-Host "`n========================================" -ForegroundColor DarkGray
                    Write-Host "处理批次 $batchNum/$batchCount" -ForegroundColor White
                    Write-Host "========================================" -ForegroundColor DarkGray
                    
                    # 询问是否处理这个批次
                    $processChoice = Read-Host "处理批次 $batchNum 吗？(y=处理, n=跳过, s=跳过剩余, q=退出)"
                    
                    switch ($processChoice.ToLower()) {
                        "q" {
                            Write-Info "用户退出"
                            return
                        }
                        "s" {
                            Write-Info "跳过剩余批次"
                            break
                        }
                        "n" {
                            Write-Info "跳过批次 $batchNum"
                            continue
                        }
                        "y" {
                            if (Process-Batch -Files $batchFiles -BatchNumber $batchNum -TotalBatches $batchCount) {
                                # 询问是否推送
                                if (-not $NoPush) {
                                    $pushChoice = Read-Host "立即推送批次 $batchNum 吗？(y/n)"
                                    if ($pushChoice -eq 'y') {
                                        Push-Batch -BatchNumber $batchNum
                                    } else {
                                        Write-Info "批次 $batchNum 已提交但未推送"
                                    }
                                }
                            }
                        }
                    }
                }
                
                Write-Success "所有批次处理完成"
                Read-Host "按 Enter 继续..."
            }
            
            "5" {
                # 清理 LFS 缓存
                Clean-LFSCache
                Read-Host "按 Enter 继续..."
            }
            
            "6" {
                # 显示帮助信息
                Show-Help
                Read-Host "按 Enter 继续..."
            }
            
            "7" {
                # 退出
                Write-Host "`n感谢使用 Git LFS 迁移工具！" -ForegroundColor Cyan
                exit 0
            }
            
            default {
                Write-Warning "无效选项，请重新选择"
                Start-Sleep -Seconds 1
            }
        }
    }
}

# 显示帮助信息
function Show-Help {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host "   帮助信息" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "使用说明:" -ForegroundColor Yellow
    Write-Host "1. 首先运行选项1查看当前状态" -ForegroundColor Gray
    Write-Host "2. 运行选项2创建备份" -ForegroundColor Gray
    Write-Host "3. 运行选项3更新配置" -ForegroundColor Gray
    Write-Host "4. 运行选项4分批迁移文件" -ForegroundColor Gray
    Write-Host ""
    Write-Host "参数说明:" -ForegroundColor Yellow
    Write-Host "-BatchSize <数字>: 设置每批处理的文件数" -ForegroundColor Gray
    Write-Host "-Force: 跳过确认提示" -ForegroundColor Gray
    Write-Host "-NoPush: 不自动推送，只提交到本地" -ForegroundColor Gray
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host ".\remove_lfs.ps1 -BatchSize 50" -ForegroundColor Gray
    Write-Host ".\remove_lfs.ps1 -NoPush" -ForegroundColor Gray
    Write-Host ""
}

# 脚本启动
if ($args[0] -eq "-help" -or $args[0] -eq "-h") {
    Show-Help
    exit 0
}

# 执行主函数
Main