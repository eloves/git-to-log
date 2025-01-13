const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// 获取当前 Git 用户
const authorCommand = `git config user.name`

exec(authorCommand, (err, author) => {
    if (err) {
        console.error('获取用户名失败:', err.message)
        return
    }

    author = author.trim() // 去掉多余空格或换行符
    console.log(`当前用户: ${author}`)

    // Git 日志命令，限制最近两周的日志，筛选当前用户，排除包含 'merge' 的提交
    const logCommand = `git log --all --since="2 weeks ago" --author="${author}" --pretty=format:"%cd %s" --date=short`

    exec(logCommand, (logErr, stdout, stderr) => {
        if (logErr) {
            console.error('获取日志失败:', stderr || logErr.message)
            return
        }

        // 按行拆分日志
        const lines = stdout.split('\n').filter((line) => {
            // 排除包含 'merge' 的提交
            return !line.toLowerCase().includes('merge')
        })

        if (lines.length === 0) {
            console.log('没有符合条件的提交日志。')
            return
        }

        // 按日期分组日志
        const logByDate = {}
        lines.forEach((line) => {
            const parts = line.split(' ')
            const date = parts.shift() // 提取日期
            const message = parts.join(' ') // 提取提交信息
            if (!logByDate[date]) logByDate[date] = []
            logByDate[date].push(message)
        })

        // 生成输出内容，按时间倒序排列
        let output = ''
        Object.keys(logByDate)
            .sort((a, b) => new Date(b) - new Date(a)) // 时间倒序排列
            .forEach((date) => {
                output += `Date: ${date}\n`
                logByDate[date].forEach((message, index) => {
                    output += `${index + 1}. ${message}\n`
                })
                output += '\n'
            })

        // 打印到控制台
        console.log(output)

        // 将结果写入当前目录的文本文件
        const filePath = path.join(__dirname, 'output.txt')
        fs.writeFileSync(filePath, output, 'utf-8')
        console.log(`日志已写入: ${filePath}`)
    })
})
