// 训练成就数据
const achievementsData = {
    // 通用成就
    commonAchievements: [
        {
            id: "perfect-attendance",
            name: "全勤之星",
            description: "连续一个月训练全勤",
            icon: "fa-calendar-check",
            color: "#4CAF50",
            level: 1
        },
        {
            id: "100-hours",
            name: "百时训练",
            description: "累计训练时长超过100小时",
            icon: "fa-clock",
            color: "#2196F3",
            level: 2
        },
        {
            id: "first-exam",
            name: "考核新秀",
            description: "完成第一次正式考核",
            icon: "fa-clipboard-check",
            color: "#FF9800",
            level: 1
        },
        {
            id: "perfect-score",
            name: "满分标兵",
            description: "在考核中获得满分成绩",
            icon: "fa-star",
            color: "#FFD700",
            level: 3
        },
        {
            id: "team-leader",
            name: "队列骨干",
            description: "担任队列训练小组长",
            icon: "fa-users",
            color: "#9C27B0",
            level: 2
        }
    ],
    
    // 队员特定成就
    memberAchievements: {
        "3024000001": [
            "perfect-attendance",
            "first-exam",
            "100-hours",
            "perfect-score"
        ]
        // ... 其他队员
    }
};