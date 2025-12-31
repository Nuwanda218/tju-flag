# git-batch-commit-push-interactive.ps1
# 设置每批处理文件的数量
$batchSize = 10

# 显示当前仓库状态
Write-Host "=== Git 批量提交与推送脚本 ===" -ForegroundColor Cyan
Write-Host "当前工作目录: $(Get-Location)" -ForegroundColor Gray
Write-Host "`n检查当前仓库状态..." -ForegroundColor Gray

# 获取未跟踪的文件列表（包括更改区的内容）
$untrackedFiles = git status --porcelain | Where-Object { $_ -match '^\?\? ' } | ForEach-Object { $_.Substring(3) }

# 如果没有未跟踪文件，则退出
if ($untrackedFiles.Count -eq 0) {
    Write-Host "没有发现未跟踪的文件！" -ForegroundColor Yellow
    exit
}

Write-Host "发现 $($untrackedFiles.Count) 个未跟踪文件" -ForegroundColor Green
Write-Host "将分为 $([Math]::Ceiling($untrackedFiles.Count / $batchSize)) 批次进行处理" -ForegroundColor Green

# 显示前10个文件作为预览
Write-Host "`n文件预览 (前10个):" -ForegroundColor Cyan
for ($i = 0; $i -lt [Math]::Min(10, $untrackedFiles.Count); $i++) {
    Write-Host "  $($untrackedFiles[$i])" -ForegroundColor Gray
}
if ($untrackedFiles.Count -gt 10) {
    Write-Host "  ... 还有 $($untrackedFiles.Count - 10) 个文件" -ForegroundColor Gray
}

# 确认是否开始处理
Write-Host "`n是否开始批量处理？" -ForegroundColor Yellow
Write-Host "  [Y] 是 - 开始处理所有文件" -ForegroundColor Green
Write-Host "  [N] 否 - 预览下一个批次" -ForegroundColor Yellow
Write-Host "  [Q] 退出 - 取消操作" -ForegroundColor Red

$choice = Read-Host "请选择 (Y/N/Q)"
if ($choice -eq 'Q' -or $choice -eq 'q') {
    Write-Host "已取消操作" -ForegroundColor Yellow
    exit
}

# 按批次处理文件
$batchCount = 0
$totalFiles = $untrackedFiles.Count
$processedFiles = 0

for ($i = 0; $i -lt $totalFiles; $i += $batchSize) {
    $batchCount++
    
    # 获取当前批次的文件
    $currentBatch = $untrackedFiles[$i..[Math]::Min($i + $batchSize - 1, $totalFiles - 1)]
    
    # 预览当前批次
    if ($choice -eq 'N' -or $choice -eq 'n') {
        Write-Host "`n=== 预览第 $batchCount 批次 ===" -ForegroundColor Cyan
        Write-Host "本批次包含 $($currentBatch.Count) 个文件:" -ForegroundColor Gray
        
        foreach ($file in $currentBatch) {
            Write-Host "  $file" -ForegroundColor Gray
        }
        
        Write-Host "`n如何处理这个批次？" -ForegroundColor Yellow
        Write-Host "  [P] 处理 - 提交并推送这个批次" -ForegroundColor Green
        Write-Host "  [S] 跳过 - 预览下一个批次" -ForegroundColor Yellow
        Write-Host "  [Q] 退出 - 取消剩余操作" -ForegroundColor Red
        
        $batchChoice = Read-Host "请选择 (P/S/Q)"
        
        if ($batchChoice -eq 'Q' -or $batchChoice -eq 'q') {
            Write-Host "已取消剩余操作" -ForegroundColor Yellow
            exit
        }
        elseif ($batchChoice -eq 'S' -or $batchChoice -eq 's') {
            Write-Host "已跳过第 $batchCount 批次" -ForegroundColor Yellow
            continue
        }
        # 如果选择处理，则继续执行下面的代码
    }
    else {
        # 如果不是预览模式，直接显示处理信息
        Write-Host "`n=== 处理第 $batchCount 批次 ===" -ForegroundColor Cyan
        Write-Host "本批次包含 $($currentBatch.Count) 个文件" -ForegroundColor Gray
    }
    
    # 添加到暂存区
    Write-Host "正在添加文件到暂存区..." -ForegroundColor Gray
    foreach ($file in $currentBatch) {
        git add "$file"
    }
    
    # 显示添加结果
    $gitStatus = git status --porcelain
    $stagedFiles = ($gitStatus | Where-Object { $_ -match '^[A|M|D|R|C|U] ' }).Count
    Write-Host "已暂存 $stagedFiles 个文件" -ForegroundColor Green
    
    # 提交
    Write-Host "正在提交更改..." -ForegroundColor Gray
    $commitMessage = "jpg - 第 $batchCount 批，共 $($currentBatch.Count) 个文件"
    git commit -m $commitMessage
    Write-Host "已提交: $commitMessage" -ForegroundColor Green
    
    # 推送
    Write-Host "正在推送到远程仓库..." -ForegroundColor Gray
    $pushResult = git push origin
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "推送成功!" -ForegroundColor Green
    }
    else {
        Write-Host "推送失败，错误代码: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "推送输出: $pushResult" -ForegroundColor Red
        
        Write-Host "`n是否继续处理下一个批次？" -ForegroundColor Yellow
        Write-Host "  [Y] 是 - 继续处理" -ForegroundColor Green
        Write-Host "  [N] 否 - 停止处理" -ForegroundColor Red
        
        $continueChoice = Read-Host "请选择 (Y/N)"
        if ($continueChoice -eq 'N' -or $continueChoice -eq 'n') {
            Write-Host "已停止处理" -ForegroundColor Yellow
            exit
        }
    }
    
    $processedFiles += $currentBatch.Count
    Write-Host "第 $batchCount 批次处理完成! (进度: $processedFiles/$totalFiles)" -ForegroundColor Green
    
    # 如果不是预览模式且不是最后一批，询问是否继续
    if ($choice -ne 'N' -and $choice -ne 'n' -and ($i + $batchSize -lt $totalFiles)) {
        Write-Host "`n继续处理下一个批次？" -ForegroundColor Yellow
        Write-Host "  [Y] 是 - 继续处理" -ForegroundColor Green
        Write-Host "  [N] 否 - 停止处理" -ForegroundColor Red
        Write-Host "  [P] 切换到预览模式" -ForegroundColor Cyan
        
        $continueChoice = Read-Host "请选择 (Y/N/P)"
        
        if ($continueChoice -eq 'N' -or $continueChoice -eq 'n') {
            Write-Host "已停止处理" -ForegroundColor Yellow
            exit
        }
        elseif ($continueChoice -eq 'P' -or $continueChoice -eq 'p') {
            Write-Host "已切换到预览模式" -ForegroundColor Cyan
            $choice = 'N'
        }
    }
    
    # 可选：添加延迟，避免推送过快
    if ($i + $batchSize -lt $totalFiles) {
        Write-Host "等待 3 秒后继续..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

Write-Host "`n=== 所有文件处理完成！ ===" -ForegroundColor Green
Write-Host "总计处理: $processedFiles 个文件" -ForegroundColor Green
Write-Host "批次数量: $batchCount 批" -ForegroundColor Green
Write-Host "`n执行 git status 查看最终状态:" -ForegroundColor Cyan
git status --short