// 训练记录数据 - 从Excel转换而来
const trainingRecords = {
    // 示例：学号为3024000001的队员的训练记录
    "3024000001": {
        // 每周训练时长记录（单位：小时）
        weeklyHours: [3, 4, 5, 4, 6, 5, 4, 3, 6, 5, 4, 3, 5, 4, 6, 5, 4, 5, 6, 5],
        
        // 关键训练里程碑
        milestones: [
            {
                date: "2024.09.15",
                event: "入队仪式",
                type: "event",
                description: "正式加入天津大学国旗护卫队28届预备队员",
                significance: "训练历程的起点"
            },
            {
                date: "2024.09.20",
                event: "第一次晚训",
                type: "training",
                description: "学习基础军姿、队列纪律",
                significance: "第一次正式训练，时长3小时"
            },
            {
                date: "2024.10.08",
                event: "第一次大训练",
                type: "training",
                description: "集体队列训练，学习升旗流程",
                significance: "首次参加周末大训练"
            },
            {
                date: "2024.10.25",
                event: "队列动作考核",
                type: "exam",
                description: "军姿、转体、齐步走考核",
                score: "优秀",
                significance: "第一次正式考核"
            },
            {
                date: "2024.11.15",
                event: "升旗仪式考核",
                type: "exam",
                description: "模拟升旗流程考核",
                score: "良好",
                significance: "掌握基本升旗流程"
            },
            {
                date: "2024.12.10",
                event: "期中综合考核",
                type: "exam",
                description: "队列、升旗、理论综合考核",
                score: "优秀",
                significance: "学期中点检验"
            },
            {
                date: "2024.12.28",
                event: "迎新晚会表演",
                type: "event",
                description: "国旗护卫队列表演",
                significance: "首次公开演出"
            },
            {
                date: "2025.01.15",
                event: "期末考核",
                type: "exam",
                description: "学期末综合能力考核",
                score: "优秀",
                significance: "学期训练总结"
            }
        ],
        
        // 训练统计
        statistics: {
            totalHours: 98,
            averageWeeklyHours: 4.9,
            maxWeeklyHours: 6,
            totalTrainings: 45,
            attendances: 43,
            attendanceRate: 95.6
        },
        
        // 训练照片统计
        photoStats: {
            training: 12,
            exam: 8,
            event: 6,
            award: 4,
            total: 30
        }
    },
    
    // 可以继续添加其他队员的数据
    "3024000002": {
        weeklyHours: [3, 4, 4, 3, 5, 4, 3, 4, 5, 4, 3, 5, 4, 4, 5, 4, 3, 4, 5, 4],
        milestones: [
            // 类似结构
        ]
    }
    // ... 更多队员
};

// 导出数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = trainingRecords;
}